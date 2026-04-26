import User from "../models/User.js";
import { hash } from "bcryptjs";
import fs from "fs";

function getSecret(envVar, defaultVal) {
  const filePath = process.env[envVar];
  if (filePath) {
    try {
      return fs.readFileSync(filePath, "utf8").trim();
    } catch (e) {
      console.error(`Could not read secret from ${filePath}:`, e.message);
    }
  }
  return defaultVal;
}

/**
 * Automatically creates a default admin account if no users exist in the database.
 * Uses environment variables for initial credentials.
 */
export async function initializeAdmin() {
  try {
    const userCount = await User.countDocuments();

    if (userCount === 0) {
      const email = getSecret(
        "DEFAULT_ADMIN_EMAIL_FILE",
        process.env.DEFAULT_ADMIN_EMAIL || "admin@example.com",
      );
      const password = getSecret(
        "DEFAULT_ADMIN_PASSWORD_FILE",
        process.env.DEFAULT_ADMIN_PASSWORD || "admin123456",
      );

      console.log(`No users found. Creating default admin account: ${email}`);

      const passwordHash = await hash(password, 12);

      await User.create({
        email: email.toLowerCase().trim(),
        passwordHash,
        roles: ["admin"],
        mfaEnabled: false, // Default admin doesn't have MFA until they set it up
      });

      console.log("Default admin account created successfully.");
    }
  } catch (err) {
    console.error("Failed to initialize default admin:", err);
  }
}
