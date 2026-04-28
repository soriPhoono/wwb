import User from "../models/User.js";
import { AVAILABLE_ROLES } from "../config/roles.js";

export const getRoles = (req, res) => {
  res.json(AVAILABLE_ROLES);
};

export const getUsers = async (req, res) => {
  const users = await User.find({})
    .lean()
    .select("-passwordHash")
    .sort({ createdAt: -1 });
  res.json(users);
};

export const updateUserRoles = async (req, res) => {
  const { id } = req.params;
  const { roles } = req.body;

  if (!Array.isArray(roles)) {
    return res.status(400).json({ error: "Roles must be an array." });
  }

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
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;

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
};
