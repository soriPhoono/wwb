import { Router } from "express";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { requireContentCreator } from "../middleware/admin.js";
import upload from "../middleware/upload.js";

const router = Router();

// ── Public Routes ──────────────────────────────────────────────────

/**
 * GET /api/products
 * Returns all active products
 */
router.get("/", async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).sort({
      createdAt: -1,
    });

    // Aggregate claimed counts from all users' carts
    const claimedCounts = await User.aggregate([
      { $unwind: "$cart" },
      {
        $group: {
          _id: "$cart.productId",
          totalClaimed: { $sum: "$cart.quantity" },
        },
      },
    ]);

    // Map counts for easy lookup
    const countsMap = {};
    claimedCounts.forEach((c) => {
      countsMap[c._id] = c.totalClaimed;
    });

    // Attach claimedCount to each product
    const enrichedProducts = products.map((p) => {
      const productObj = p.toObject();
      productObj.claimedCount = countsMap[p.productId || p._id] || 0;
      return productObj;
    });

    res.json(enrichedProducts);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: "Failed to fetch products." });
  }
});

/**
 * GET /api/products/:id
 * Returns details of a specific product
 */
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }
    res.json(product);
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).json({ error: "Failed to fetch product details." });
  }
});

// ── Staff Routes (Restricted) ──────────────────────────────────────
/**
 * POST /api/products/upload
 * Handle product image upload
 */
router.post(
  "/upload",
  requireAuth,
  requireContentCreator,
  upload.single("image"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }
    // Return the public URL path
    const filePath = `/uploads/products/${req.file.filename}`;
    res.json({ url: filePath });
  },
);

/**
 * POST /api/products
 * Create a new product
 */
router.post("/", requireAuth, requireContentCreator, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      image,
      category,
      stock,
      productId,
      isActive,
    } = req.body;

    const product = new Product({
      name,
      description,
      price,
      image,
      category,
      stock,
      productId,
      isActive,
    });

    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.error("Error creating product:", err);
    res.status(500).json({ error: "Failed to create product." });
  }
});

/**
 * PATCH /api/products/:id
 * Update an existing product
 */
router.patch("/:id", requireAuth, requireContentCreator, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    res.json(product);
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({ error: "Failed to update product." });
  }
});

/**
 * DELETE /api/products/:id
 * Remove a product from the database
 */
router.delete("/:id", requireAuth, requireContentCreator, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    res.json({ message: "Product deleted successfully." });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ error: "Failed to delete product." });
  }
});

export default router;
