import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireContentCreator } from "../middleware/admin.js";
import upload from "../middleware/upload.js";
import {
  getProducts,
  getProductById,
  uploadProductImage,
  createProduct,
  updateProduct,
  deleteProduct,
  getTopProducts,
} from "../controllers/productController.js";

const router = Router();

// GET /api/products
router.get("/", getProducts);
router.get("/top", getTopProducts);

// GET /api/products/:id
router.get("/:id", getProductById);

// POST /api/products/upload
router.post(
  "/upload",
  requireAuth,
  requireContentCreator,
  upload.single("image"),
  uploadProductImage,
);

// POST /api/products
router.post("/", requireAuth, requireContentCreator, createProduct);

// PATCH /api/products/:id
router.patch("/:id", requireAuth, requireContentCreator, updateProduct);

// DELETE /api/products/:id
router.delete("/:id", requireAuth, requireContentCreator, deleteProduct);

export default router;
