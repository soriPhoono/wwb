import User from "../models/User.js";

/**
 * Higher-order middleware to check for specific roles.
 * Access is granted if the user has the 'admin' role OR the targetRole.
 */
export function requireRole(targetRole) {
  return async (req, res, next) => {
    try {
      // Assuming requireAuth has already set req.userId
      const user = await User.findById(req.userId);

      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }

      // 'admin' is a master role that bypasses all specific checks
      const hasPermission =
        user.roles.includes("admin") || user.roles.includes(targetRole);

      if (!hasPermission) {
        return res
          .status(403)
          .json({ error: "Forbidden: Insufficient permissions." });
      }

      // Attach user to request for downstream use if needed
      req.user = user;
      next();
    } catch (err) {
      console.error("RBAC middleware error:", err);
      return res
        .status(500)
        .json({ error: "Internal server error during permission check." });
    }
  };
}

// Helper middlewares
export const requireAdmin = requireRole("admin");
export const requireContentCreator = requireRole("content-creator");
