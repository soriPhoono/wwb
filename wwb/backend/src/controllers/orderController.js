import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import {
  createPaymentIntent,
  retrievePaymentIntent,
} from "../services/stripe.js";
import { sendOrderConfirmation } from "../services/email.js";
import crypto from "crypto";

export const createOrderPaymentIntent = async (req, res) => {
  let items = [];
  if (req.userId) {
    const user = await User.findById(req.userId);
    if (!user || !user.cart || user.cart.length === 0) {
      return res.status(400).json({ error: "Cart is empty." });
    }
    items = user.cart;
  } else {
    items = req.body.items;
    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Cart is empty." });
    }
  }

  // Calculate total amount
  const productIds = items.map((item) => item.productId);
  const products = await Product.find({ productId: { $in: productIds } });

  const productMap = {};
  products.forEach((p) => {
    productMap[p.productId] = p;
  });

  let totalAmount = 0;
  for (const item of items) {
    const product = productMap[item.productId];
    if (product && product.isActive) {
      totalAmount += product.price * item.quantity;
    }
  }

  if (totalAmount <= 0) {
    return res.status(400).json({ error: "Invalid order total." });
  }

  const paymentIntent = await createPaymentIntent(totalAmount, "usd", {
    userId: req.userId || "guest",
  });

  res.json({ clientSecret: paymentIntent.client_secret });
};

export const placeOrder = async (req, res) => {
  const { shippingDetails, paymentIntentId, items } = req.body;

  if (!shippingDetails || !paymentIntentId) {
    return res
      .status(400)
      .json({ error: "Missing required order information." });
  }

  // 1. Verify payment with Stripe
  const bypassMode = process.env.BYPASS_PAYMENT_VERIFICATION === "true";
  const isMockPayment = paymentIntentId === "pi_test_bypass";

  if (bypassMode && isMockPayment) {
    console.log("Payment verification bypassed for test order.");
  } else {
    const paymentIntent = await retrievePaymentIntent(paymentIntentId);
    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({ error: "Payment not confirmed." });
    }
  }

  let itemsToProcess = [];
  let user = null;

  if (req.userId) {
    user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found." });
    itemsToProcess = user.cart;
  } else {
    itemsToProcess = items;
  }

  if (!itemsToProcess || itemsToProcess.length === 0) {
    return res.status(400).json({ error: "Your cart is empty." });
  }

  // 2. Fetch full product details for items
  const productIds = itemsToProcess.map((item) => item.productId);
  const products = await Product.find({ productId: { $in: productIds } });

  const productMap = {};
  products.forEach((p) => {
    productMap[p.productId] = p;
  });

  // 3. Validate availability and calculate total
  const orderItems = [];
  let totalAmount = 0;

  for (const item of itemsToProcess) {
    const product = productMap[item.productId];

    if (!product || !product.isActive) {
      return res.status(400).json({
        error: `Product with ID ${item.productId} is no longer available.`,
      });
    }

    if (product.stock < item.quantity) {
      return res.status(400).json({
        error: `Insufficient stock for ${product.name}. Requested: ${item.quantity}, Available: ${product.stock}.`,
      });
    }

    const price = product.price;
    const amount = price * item.quantity;
    totalAmount += amount;

    orderItems.push({
      productId: product.productId,
      name: product.name,
      price: price,
      quantity: item.quantity,
      image: product.image,
    });
  }

  // 4. Create the order
  const order = new Order({
    user: req.userId || null,
    items: orderItems,
    totalAmount,
    shippingDetails,
    status: "completed",
    paymentMethod: "stripe",
    accessKey: crypto.randomBytes(16).toString("hex"),
  });

  // 5. Update stock and clear cart (Note: In production, use a transaction)
  for (const item of orderItems) {
    await Product.findOneAndUpdate(
      { productId: item.productId, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } },
    );
  }

  // Clear user cart if logged in
  if (user) {
    user.cart = [];
    await user.save();
  }

  await order.save();

  // Send confirmation email asynchronously (don't block the response)
  sendOrderConfirmation(order).catch((err) =>
    console.error("Delayed email error:", err),
  );

  res.status(201).json({
    message: "Order placed successfully.",
    orderId: order._id,
    accessKey: order.accessKey,
  });
};

export const getOrderHistory = async (req, res) => {
  const orders = await Order.find({ user: req.userId }).sort({
    createdAt: -1,
  });
  res.json(orders);
};

export const getGuestOrder = async (req, res) => {
  const { id } = req.params;
  const { accessKey } = req.query;

  if (!id || !accessKey) {
    return res.status(400).json({ error: "Missing order ID or access key." });
  }

  try {
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    if (order.accessKey !== accessKey) {
      return res
        .status(403)
        .json({ error: "Unauthorized access to this order." });
    }

    res.json(order);
  } catch (err) {
    res.status(400).json({ error: "Invalid order ID format." });
  }
};
