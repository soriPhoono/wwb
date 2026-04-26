import { Router } from "express";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// GET /api/cart
// Returns the current user's cart
router.get("/", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found." });

    res.json({ cart: user.cart || [] });
  } catch (err) {
    console.error("Fetch cart error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// POST /api/cart
// Overwrites the current user's cart
router.post("/", requireAuth, async (req, res) => {
  const { cart } = req.body;

  if (!Array.isArray(cart)) {
    return res.status(400).json({ error: "Cart must be an array." });
  }

  // Validate cart items
  const validCart = cart
    .map((item) => ({
      productId: Number(item.productId),
      quantity: Number(item.quantity),
    }))
    .filter((item) => !isNaN(item.productId) && !isNaN(item.quantity));

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found." });

    user.cart = validCart;
    await user.save();

    res.json({ message: "Cart synced successfully.", cart: user.cart });
  } catch (err) {
    console.error("Sync cart error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

export default router;
