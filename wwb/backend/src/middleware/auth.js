import jwt from "jsonwebtoken";
import { readSecret } from "../utils/secrets.js";

export function getJwtSecret() {
  return readSecret("JWT_SECRET") || "dev-secret-change-in-production";
}

export function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  try {
    const payload = jwt.verify(token, getJwtSecret());
    req.userId = payload.userId;
    req.userRoles = payload.roles || [];
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function optionalAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    return next();
  }
  try {
    const payload = jwt.verify(token, getJwtSecret());
    req.userId = payload.userId;
    req.userRoles = payload.roles || [];
    next();
  } catch (err) {
    next();
  }
}
