import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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

export const verifyWebhookSignature = (payload, sig, endpointSecret) => {
  return stripe.webhooks.constructEvent(payload, sig, endpointSecret);
};

export default stripe;
