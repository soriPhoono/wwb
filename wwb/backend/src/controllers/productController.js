import Product from "../models/Product.js";
import User from "../models/User.js";

// ── Cache Configuration ────────────────────────────────────────────
let cachedClaimedCounts = null;
let lastClaimedCountsUpdate = 0;
const CLAIMED_COUNTS_TTL = 2000; // 2 seconds

async function getClaimedCountsMap() {
  const now = Date.now();
  if (
    cachedClaimedCounts &&
    now - lastClaimedCountsUpdate < CLAIMED_COUNTS_TTL
  ) {
    return cachedClaimedCounts;
  }

  // 1. Fetch all products to create a mapping between _id and productId
  const products = await Product.find({}, "_id productId").lean();
  const idToProductId = {};
  const productIdToId = {};
  products.forEach((p) => {
    const idStr = p._id.toString();
    if (p.productId) {
      idToProductId[idStr] = p.productId;
      productIdToId[p.productId] = idStr;
    }
  });

  // 2. Aggregate counts from all users
  const claimedCounts = await User.aggregate([
    { $unwind: "$cart" },
    {
      $group: {
        _id: "$cart.productId",
        totalClaimed: { $sum: "$cart.quantity" },
      },
    },
  ]);

  // 3. Consolidate counts
  // We want a map where BOTH _id and productId point to the total for that product
  const consolidated = {};
  claimedCounts.forEach((c) => {
    const key = c._id; // This could be an _id or a productId
    const normalizedKey = productIdToId[key] || key; // Convert productId to _id if possible

    if (!consolidated[normalizedKey]) {
      consolidated[normalizedKey] = 0;
    }
    consolidated[normalizedKey] += c.totalClaimed;
  });

  const finalMap = {};
  products.forEach((p) => {
    const idStr = p._id.toString();
    const count = consolidated[idStr] || 0;
    finalMap[idStr] = count;
    if (p.productId) {
      finalMap[p.productId] = count;
    }
  });

  cachedClaimedCounts = finalMap;
  lastClaimedCountsUpdate = now;
  return finalMap;
}

export const getProducts = async (req, res) => {
  const products = await Product.find({ isActive: true })
    .lean()
    .sort({ createdAt: -1 });

  const countsMap = await getClaimedCountsMap();

  const enrichedProducts = products.map((p) => {
    p.claimedCount = countsMap[p.productId || p._id] || 0;
    return p;
  });

  res.json(enrichedProducts);
};

export const getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id).lean();
  if (!product) {
    return res.status(404).json({ error: "Product not found." });
  }
  res.json(product);
};

export const uploadProductImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }
  const filePath = `/uploads/products/${req.file.filename}`;
  res.json({ url: filePath });
};

export const createProduct = async (req, res) => {
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
};

export const updateProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    return res.status(404).json({ error: "Product not found." });
  }

  res.json(product);
};

export const deleteProduct = async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    return res.status(404).json({ error: "Product not found." });
  }

  if (product.productId !== undefined && product.productId !== null) {
    try {
      await User.updateMany(
        { "cart.productId": product.productId },
        { $pull: { cart: { productId: product.productId } } },
      );
    } catch (err) {
      console.error("Error removing product from user carts:", err);
    }
  }

  res.json({ message: "Product deleted successfully." });
};

export const getTopProducts = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .sort({ purchaseCount: -1 })
      .limit(4)
      .lean();

    const countsMap = await getClaimedCountsMap();

    const enrichedProducts = products.map((p) => {
      p.claimedCount = countsMap[p.productId || p._id] || 0;
      return p;
    });

    res.json(enrichedProducts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch top products." });
  }
};
