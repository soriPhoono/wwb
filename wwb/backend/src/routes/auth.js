import { Router } from "express";
import { hash, compare } from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import User from "../models/User.js";
import { requireAuth, getJwtSecret } from "../middleware/auth.js";
import {
  sendVerificationCode,
  checkVerificationCode,
  normalizePhoneNumber,
} from "../services/twilio.js";

const { sign, verify } = jsonwebtoken;
const router = Router();

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  secure: true, // Should be true in production (requires HTTPS)
};

function signToken(userId) {
  return sign({ userId: userId.toString() }, getJwtSecret(), {
    expiresIn: "7d",
  });
}

/**
 * Create a short-lived token that proves the user passed step 1 (password)
 * but still needs to complete MFA. Contains a `mfaPending` flag so it
 * cannot be confused with a real session token.
 */
function signMfaToken(userId) {
  return sign({ userId: userId.toString(), mfaPending: true }, getJwtSecret(), {
    expiresIn: "10m",
  });
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  // Get body of request (user)
  const { email, password, phone } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }
  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters." });
  }

  try {
    // Check if user already exists
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res
        .status(409)
        .json({ error: "An account with that email already exists." });
    }

    // Hash the password
    const passwordHash = await hash(password, 12);

    // Normalize the phone number if provided
    const normalizedPhone = normalizePhoneNumber(phone);

    // Create new user
    const user = await User.create({
      email,
      passwordHash,
      mfaEnabled: false, // MFA is disabled until the phone is verified
      phone: normalizedPhone || null,
      phoneVerified: false,
    });

    // If phone number is present, initiate verification
    if (user.phone) {
      try {
        // Send verification code via Twilio
        await sendVerificationCode(user.phone);

        // Create a short-lived MFA token for the verification step
        const mfaToken = signMfaToken(user._id);

        // Mask the phone number for the response (e.g., +1555123****)
        const masked =
          user.phone.slice(0, -4).replace(/./g, "*") + user.phone.slice(-4);

        // Return a response requiring MFA/Verification
        return res.status(201).json({
          mfaRequired: true,
          mfaToken,
          phoneMasked: masked,
          message: "Verification code sent. Please confirm your phone number.",
        });
      } catch (twilioErr) {
        // Log error but the user is still created
        console.error("Twilio send error during registration:", twilioErr);
        // We could either return an error or let them in and ask to verify later.
        // Given the requirement, let's inform them it failed.
        return res.status(201).json({
          user: user.toSafeObject(),
          warning: "User created, but failed to send verification code.",
        });
      }
    }

    // No phone provided — direct login
    const token = signToken(user._id);
    res.cookie("token", token, COOKIE_OPTS);

    // Return user
    return res.status(201).json({ user: user.toSafeObject() });
  } catch (err) {
    // Log error
    console.error("Register error:", err);

    // Return error
    return res.status(500).json({ error: "Server error. Please try again." });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const valid = await compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // ── MFA challenge ──────────────────────────────────────────────────
    // Only trigger MFA if the phone is verified and MFA is enabled
    if (user.mfaEnabled && user.phone && user.phoneVerified) {
      try {
        await sendVerificationCode(user.phone);
      } catch (twilioErr) {
        console.error("Twilio send error:", twilioErr);
        return res.status(502).json({
          error: "Failed to send verification code. Please try again.",
        });
      }

      const mfaToken = signMfaToken(user._id);

      // Mask phone: "+1555123****"
      const masked =
        user.phone.slice(0, -4).replace(/./g, "*") + user.phone.slice(-4);

      return res.json({ mfaRequired: true, mfaToken, phoneMasked: masked });
    }

    // If phone is present but not verified, we could optionally force verification here.
    // For now, we follow the rule: only verified phones allow MFA.

    // ── Normal login (no MFA) ──────────────────────────────────────────
    const token = signToken(user._id);
    res.cookie("token", token, COOKIE_OPTS);
    return res.json({ user: user.toSafeObject() });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Server error. Please try again." });
  }
});

// POST /api/auth/mfa/verify  — complete the MFA challenge
router.post("/mfa/verify", async (req, res) => {
  const { mfaToken, code } = req.body;

  if (!mfaToken || !code) {
    return res
      .status(400)
      .json({ error: "MFA token and verification code are required." });
  }

  // 1. Validate the MFA token
  let payload;
  try {
    payload = verify(mfaToken, getJwtSecret());
  } catch (err) {
    return res
      .status(401)
      .json({ error: "MFA session expired. Please log in again." });
  }

  if (!payload.mfaPending) {
    return res.status(401).json({ error: "Invalid MFA token." });
  }

  // 2. Look up the user
  const user = await User.findById(payload.userId);
  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }

  // 3. Check the code with Twilio Verify
  try {
    const approved = await checkVerificationCode(user.phone, code);
    if (!approved) {
      return res.status(401).json({ error: "Incorrect verification code." });
    }
  } catch (twilioErr) {
    console.error("Twilio verify error:", twilioErr);
    return res
      .status(502)
      .json({ error: "Verification service error. Try again." });
  }

  // 4. MFA passed — mark as verified and issue the real session
  try {
    // If this was the first time verifying (e.g. during registration),
    // mark the phone as verified and enable MFA.
    if (!user.phoneVerified) {
      user.phoneVerified = true;
      user.mfaEnabled = true;
      await user.save();
    }
  } catch (saveErr) {
    console.error("User save error after MFA verify:", saveErr);
    return res.status(500).json({ error: "Failed to update user status." });
  }

  const token = signToken(user._id);
  res.cookie("token", token, COOKIE_OPTS);
  return res.json({ user: user.toSafeObject() });
});

// POST /api/auth/mfa/resend  — resend the verification code
router.post("/mfa/resend", async (req, res) => {
  const { mfaToken } = req.body;

  if (!mfaToken) {
    return res.status(400).json({ error: "MFA token is required." });
  }

  let payload;
  try {
    payload = verify(mfaToken, getJwtSecret());
  } catch (err) {
    return res
      .status(401)
      .json({ error: "MFA session expired. Please log in again." });
  }

  if (!payload.mfaPending) {
    return res.status(401).json({ error: "Invalid MFA token." });
  }

  const user = await User.findById(payload.userId);
  if (!user || !user.phone) {
    return res.status(404).json({ error: "User not found." });
  }

  try {
    await sendVerificationCode(user.phone);
    return res.json({ message: "Verification code resent." });
  } catch (twilioErr) {
    console.error("Twilio resend error:", twilioErr);
    return res.status(502).json({ error: "Failed to resend code. Try again." });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ message: "Logged out." });
});

// GET /api/auth/me  — hydrates session on frontend load
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found." });
    return res.json({ user: user.toSafeObject() });
  } catch (err) {
    return res.status(500).json({ error: "Server error." });
  }
});

// PATCH /api/auth/profile  — update email and/or phone
router.patch("/profile", requireAuth, async (req, res) => {
  const { email, phone } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found." });

    const normalizedEmail = email.toLowerCase().trim();

    // Check uniqueness if email changed
    if (normalizedEmail !== user.email) {
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) {
        return res
          .status(409)
          .json({ error: "An account with that email already exists." });
      }
    }

    // Handle phone change
    const newPhone = normalizePhoneNumber(phone);
    if (newPhone !== user.phone) {
      user.phone = newPhone;
      // Reset verification if phone changed or was added
      user.phoneVerified = false;
      user.mfaEnabled = false;

      // Optionally we could trigger a verification code here,
      // but for now we just require them to verify it next time they log in or similar.
      // Or we can return a flag saying verification is needed.
    }

    user.email = normalizedEmail;
    await user.save();

    return res.json({ user: user.toSafeObject() });
  } catch (err) {
    console.error("Profile update error:", err);
    return res.status(500).json({ error: "Server error. Please try again." });
  }
});

// POST /api/auth/change-password  — change password (requires current password)
router.post("/change-password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ error: "Current password and new password are required." });
  }
  if (newPassword.length < 8) {
    return res
      .status(400)
      .json({ error: "New password must be at least 8 characters." });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found." });

    const valid = await compare(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Current password is incorrect." });
    }

    user.passwordHash = await hash(newPassword, 12);
    await user.save();

    return res.json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("Change password error:", err);
    return res.status(500).json({ error: "Server error. Please try again." });
  }
});

export default router;
