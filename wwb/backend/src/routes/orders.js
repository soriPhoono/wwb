import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  createOrderPaymentIntent,
  placeOrder,
  getOrderHistory,
} from "../controllers/orderController.js";

const router = Router();

/**
 * POST /api/orders/payment-intent
 * Creates a Stripe PaymentIntent for the user's current cart.
 */
router.post("/payment-intent", requireAuth, createOrderPaymentIntent);

/**
 * POST /api/orders
 * Places a new order based on the user's current cart.
 */
router.post("/", requireAuth, placeOrder);

/**
 * GET /api/orders
 * Returns the order history for the current user.
 */
router.get("/", requireAuth, getOrderHistory);

export default router;
