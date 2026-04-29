import { Resend } from "resend";
import { readSecret } from "../utils/secrets.js";

const resendApiKey = readSecret("RESEND_API_KEY");
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Group 14 <orders@cryptic-coders.net>";
const FRONTEND_URL =
  process.env.FRONTEND_ORIGIN || "https://wwb.cryptic-coders.net";

/**
 * Sends an order confirmation email to the customer.
 *
 * @param {Object} order - The order document.
 */
export async function sendOrderConfirmation(order) {
  if (!resend) {
    console.warn("Resend API key not configured. Skipping email.");
    return;
  }

  const { shippingDetails, items, totalAmount, _id, accessKey } = order;
  const trackingUrl = `${FRONTEND_URL}/order-details/${_id}?accessKey=${accessKey}`;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; mx-auto; margin: 40px auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        .header { background: #0f172a; color: white; padding: 40px; text-align: center; }
        .content { padding: 40px; }
        .order-id { font-family: monospace; color: #64748b; font-size: 12px; margin-bottom: 8px; display: block; }
        .item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
        .item-name { font-weight: 600; }
        .item-price { color: #64748b; }
        .total { display: flex; justify-content: space-between; padding: 20px 0; font-size: 20px; font-weight: 900; border-top: 2px solid #f1f5f9; margin-top: 20px; }
        .button { display: inline-block; background: #2563eb; color: white !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; margin-top: 30px; text-align: center; }
        .footer { padding: 40px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -1px;">Order Confirmed!</h1>
          <p style="margin: 10px 0 0; opacity: 0.8;">Thank you for your purchase, ${shippingDetails.fullName}.</p>
        </div>
        <div class="content">
          <span class="order-id">ORDER ID: ${_id}</span>
          <h2 style="margin: 0 0 20px; font-size: 18px; font-weight: 700;">Summary</h2>
          
          ${items
            .map(
              (item) => `
            <div class="item">
              <div>
                <span class="item-name">${item.name}</span>
                <br/>
                <span style="font-size: 12px; color: #94a3b8;">Qty: ${item.quantity}</span>
              </div>
              <span class="item-price">$${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          `,
            )
            .join("")}
          
          <div class="total">
            <span>Total</span>
            <span style="color: #2563eb;">$${totalAmount.toFixed(2)}</span>
          </div>

          <div style="text-align: center;">
            <a href="${trackingUrl}" class="button">Track Your Order</a>
          </div>
          
          <p style="margin-top: 30px; font-size: 14px; color: #64748b;">
            Questions about your order? Just reply to this email, we're here to help.
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Group 14 Store. Built with passion.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [shippingDetails.email],
      subject: `Order Confirmed - #${_id.toString().slice(-6).toUpperCase()}`,
      html: emailHtml,
    });

    if (error) {
      console.error("Resend Error:", error);
    } else {
      console.log("Confirmation email sent:", data.id);
    }
  } catch (err) {
    console.error("Failed to send email:", err.message);
  }
}
