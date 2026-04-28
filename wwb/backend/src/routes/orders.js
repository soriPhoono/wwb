import { Router } from "express";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import {
  createOrderPaymentIntent,
  placeOrder,
  getOrderHistory,
  getGuestOrder,
} from "../controllers/orderController.js";

const router = Router();

/**
 * POST /api/orders/payment-intent
 * Creates a Stripe PaymentIntent. Supports guest checkout.
 */
router.post("/payment-intent", optionalAuth, createOrderPaymentIntent);

/**
 * POST /api/orders
 * Places a new order. Supports guest checkout.
 */
router.post("/", optionalAuth, placeOrder);

/**
 * GET /api/orders/guest/:id
 * Retrieves order details for a guest using an access key.
 */
router.get("/guest/:id", getGuestOrder);

/**
 * GET /api/orders
 * Returns the order history for the current user.
 */
router.get("/", requireAuth, getOrderHistory);

export default router;
