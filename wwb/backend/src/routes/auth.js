import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  register,
  login,
  verifyMfa,
  resendMfa,
  logout,
  getMe,
  updateProfile,
  changePassword,
} from "../controllers/authController.js";

const router = Router();

// POST /api/auth/register
router.post("/register", register);

// POST /api/auth/login
router.post("/login", login);

// POST /api/auth/mfa/verify
router.post("/mfa/verify", verifyMfa);

// POST /api/auth/mfa/resend
router.post("/mfa/resend", resendMfa);

// POST /api/auth/logout
router.post("/logout", logout);

// GET /api/auth/me
router.get("/me", requireAuth, getMe);

// PATCH /api/auth/profile
router.patch("/profile", requireAuth, updateProfile);

// POST /api/auth/change-password
router.post("/change-password", requireAuth, changePassword);

export default router;
