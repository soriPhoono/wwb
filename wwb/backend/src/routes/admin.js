import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin, requireContentCreator } from "../middleware/admin.js";

import User from "../models/User.js";
import { AVAILABLE_ROLES } from "../config/roles.js";

const router = Router();

// ── Role Metadata ──────────────────────────────────────────────────

/**
 * GET /api/admin/roles
 * Returns the list of available roles and their metadata
 */
router.get("/roles", requireAuth, requireAdmin, (req, res) => {
  res.json(AVAILABLE_ROLES);
});

// ── User Management ──────────────────────────────────────────────────

/**
 * GET /api/admin/users
 * Returns all users (Admins only)
 */
router.get("/users", requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({})
      .select("-passwordHash")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users." });
  }
});

/**
 * PATCH /api/admin/users/:id/roles
 * Update a user's roles (Admins only)
 */
router.patch(
  "/users/:id/roles",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const { id } = req.params;
    const { roles } = req.body;

    if (!Array.isArray(roles)) {
      return res.status(400).json({ error: "Roles must be an array." });
    }

    try {
      // Prevent self-demotion: If target is self, roles must still include 'admin'
      if (id === req.userId && !roles.includes("admin")) {
        return res.status(400).json({
          error: "Safety check: You cannot remove your own admin role.",
        });
      }

      const user = await User.findByIdAndUpdate(
        id,
        { roles },
        { new: true, runValidators: true },
      ).select("-passwordHash");

      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }

      res.json(user);
    } catch (err) {
      console.error("Error updating user roles:", err);
      res.status(500).json({ error: "Failed to update user roles." });
    }
  },
);

/**
 * DELETE /api/admin/users/:id
 * Delete a user account (Admins only)
 */
router.delete("/users/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    // Prevent self-deletion
    if (id === req.userId) {
      return res.status(400).json({
        error: "Safety check: You cannot delete your own account from here.",
      });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    res.json({ message: "User deleted successfully." });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Failed to delete user." });
  }
});

export default router;
