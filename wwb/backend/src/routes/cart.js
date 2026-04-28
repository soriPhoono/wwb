import { Router } from "express";
import User from "../models/User.js";
import Product from "../models/Product.js";
import { requireAuth } from "../middleware/auth.js";
import { getRoleIds } from "../config/roles.js";

const router = Router();

// GET /api/cart
// Returns the current user's cart
router.get("/", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found." });

    // Check if user has administrative roles
    const staffRoles = getRoleIds();
    const isStaff = user.roles.some((role) => staffRoles.includes(role));
    if (isStaff) {
      return res
        .status(403)
        .json({ error: "Staff members cannot use the cart system." });
    }

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
      productId: String(item.productId),
      quantity: Number(item.quantity),
    }))
    .filter((item) => item.productId && !isNaN(item.quantity));

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found." });

    // Check if user has administrative roles
    const staffRoles = getRoleIds();
    const isStaff = user.roles.some((role) => staffRoles.includes(role));
    if (isStaff) {
      return res
        .status(403)
        .json({ error: "Staff members cannot use the cart system." });
    }

    // ── Stock Validation ──────────────────────────────────────────
    // Get total claimed by OTHER users
    const othersClaimed = await User.aggregate([
      { $match: { _id: { $ne: user._id } } },
      { $unwind: "$cart" },
      {
        $group: {
          _id: "$cart.productId",
          total: { $sum: "$cart.quantity" },
        },
      },
    ]);

    const othersMap = {};
    othersClaimed.forEach((c) => {
      if (c._id) othersMap[c._id] = c.total;
    });

    // Get all products to check stock
    const productIds = validCart.map((i) => i.productId);
    const validObjectIds = productIds.filter((id) =>
      /^[0-9a-fA-F]{24}$/.test(id),
    );

    const products = await Product.find({
      $or: [
        { productId: { $in: productIds } },
        { _id: { $in: validObjectIds } },
      ],
    }).lean();

    const productMap = {};
    products.forEach((p) => {
      if (p.productId) productMap[p.productId] = p;
      productMap[p._id.toString()] = p;
    });

    // Check each item
    for (const item of validCart) {
      const product = productMap[item.productId];
      if (!product) continue;

      const claimedByOthers = othersMap[item.productId] || 0;
      const available = Math.max(0, product.stock - claimedByOthers);

      if (item.quantity > available) {
        return res.status(400).json({
          error: `Insufficient stock for ${product.name}. Only ${available} units available (considering other users' carts).`,
        });
      }
    }

    user.cart = validCart;
    await user.save();

    res.json({ message: "Cart synced successfully.", cart: user.cart });
  } catch (err) {
    console.error("Sync cart error:", err);
    res
      .status(500)
      .json({ error: "Server error during cart synchronization." });
  }
});

export default router;
