import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

const router = Router();

/**
 * POST /api/orders
 * Places a new order based on the user's current cart.
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found." });

    if (!user.cart || user.cart.length === 0) {
      return res.status(400).json({ error: "Your cart is empty." });
    }

    // 1. Fetch full product details for items in cart
    const productIds = user.cart.map((item) => item.productId);
    const products = await Product.find({ productId: { $in: productIds } });

    const productMap = {};
    products.forEach((p) => {
      productMap[p.productId] = p;
    });

    // 2. Validate availability and calculate total
    const orderItems = [];
    let totalAmount = 0;

    for (const cartItem of user.cart) {
      const product = productMap[cartItem.productId];

      if (!product || !product.isActive) {
        return res.status(400).json({
          error: `Product with ID ${cartItem.productId} is no longer available.`,
        });
      }

      if (product.stock < cartItem.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for ${product.name}. Requested: ${cartItem.quantity}, Available: ${product.stock}.`,
        });
      }

      const price = product.price;
      const amount = price * cartItem.quantity;
      totalAmount += amount;

      orderItems.push({
        productId: product.productId,
        name: product.name,
        price: price,
        quantity: cartItem.quantity,
        image: product.image,
      });
    }

    // 3. Create the order
    const order = new Order({
      user: user._id,
      items: orderItems,
      totalAmount,
      shippingDetails: req.body.shippingDetails || {}, // Frontend should provide this
      status: "completed", // For now, assume payment is handled or it's a simple flow
    });

    // 4. Update stock and clear cart (Note: In production, use a transaction)
    // Atomic stock decrement for each product
    for (const item of orderItems) {
      await Product.findOneAndUpdate(
        { productId: item.productId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
      );
    }

    // Clear user cart
    user.cart = [];
    await user.save();

    await order.save();

    res.status(201).json({
      message: "Order placed successfully.",
      orderId: order._id,
      totalAmount: order.totalAmount,
    });
  } catch (err) {
    console.error("Order placement error:", err);
    res.status(500).json({ error: "Failed to place order." });
  }
});

/**
 * GET /api/orders
 * Returns the order history for the current user.
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.userId }).sort({
      createdAt: -1,
    });
    res.json(orders);
  } catch (err) {
    console.error("Fetch orders error:", err);
    res.status(500).json({ error: "Failed to fetch orders." });
  }
});

export default router;
