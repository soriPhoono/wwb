import Stripe from "stripe";
import fs from "fs";

function readSecret(envKey) {
  if (process.env[envKey]) return process.env[envKey];
  const fileKey = `${envKey}_FILE`;
  if (process.env[fileKey]) {
    try {
      return fs.readFileSync(process.env[fileKey], "utf8").trim();
    } catch (e) {
      console.error(`Could not read ${fileKey}:`, e.message);
    }
  }
  return undefined;
}

const secretKey = readSecret("STRIPE_SECRET_KEY");
const stripe = new Stripe(secretKey);

export const createCheckoutSession = async (order, successUrl, cancelUrl) => {
  const lineItems = order.items.map((item) => ({
    price_data: {
      currency: "usd",
      product_data: {
        name: item.name,
        images: item.image ? [item.image] : [],
      },
      unit_amount: Math.round(item.price * 100), // Stripe expects amounts in cents
    },
    quantity: item.quantity,
  }));

  return await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: order._id.toString(),
    customer_email: order.shippingDetails?.email, // If we have it
    metadata: {
      orderId: order._id.toString(),
      accessKey: order.accessKey,
    },
  });
};

export const createPaymentIntent = async (
  amount,
  currency = "usd",
  metadata = {},
) => {
  return await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
  });
};

export const retrievePaymentIntent = async (id) => {
  return await stripe.paymentIntents.retrieve(id);
};

export const verifyWebhookSignature = (payload, sig, endpointSecret) => {
  return stripe.webhooks.constructEvent(payload, sig, endpointSecret);
};

export default stripe;
