import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
import {
  getRoles,
  getUsers,
  updateUserRoles,
  deleteUser,
} from "../controllers/adminController.js";

const router = Router();

// ── Role Metadata ──────────────────────────────────────────────────

/**
 * GET /api/admin/roles
 * Returns the list of available roles and their metadata
 */
router.get("/roles", requireAuth, requireAdmin, getRoles);

// ── User Management ──────────────────────────────────────────────────

/**
 * GET /api/admin/users
 * Returns all users (Admins only)
 */
router.get("/users", requireAuth, requireAdmin, getUsers);

/**
 * PATCH /api/admin/users/:id/roles
 * Update a user's roles (Admins only)
 */
router.patch("/users/:id/roles", requireAuth, requireAdmin, updateUserRoles);

/**
 * DELETE /api/admin/users/:id
 * Delete a user account (Admins only)
 */
router.delete("/users/:id", requireAuth, requireAdmin, deleteUser);

export default router;
