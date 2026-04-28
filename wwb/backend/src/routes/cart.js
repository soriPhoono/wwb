import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getCart, syncCart } from "../controllers/cartController.js";

const router = Router();

// GET /api/cart
// Returns the current user's cart
router.get("/", requireAuth, getCart);

// POST /api/cart
// Overwrites the current user's cart
router.post("/", requireAuth, syncCart);

export default router;
