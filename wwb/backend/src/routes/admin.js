import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin, requireContentCreator } from "../middleware/admin.js";

const router = Router();

// Test route for anyone authenticated
router.get("/test", requireAuth, (req, res) => {
  res.json({ message: "You are authenticated!", userId: req.userId });
});

// Test route for content creators (or admins)
router.get("/content-test", requireAuth, requireContentCreator, (req, res) => {
  res.json({
    message: "You have content creator permissions!",
    roles: req.user.roles,
  });
});

// Test route for admins only
router.get("/admin-test", requireAuth, requireAdmin, (req, res) => {
  res.json({ message: "You have admin permissions!", roles: req.user.roles });
});

export default router;
