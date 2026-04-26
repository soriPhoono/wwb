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

function signToken(userId, roles = []) {
  return sign({ userId: userId.toString(), roles }, getJwtSecret(), {
    expiresIn: "7d",
  });
}

/**
 * Create a short-lived token that proves the user passed step 1 (password)
 * but still needs to complete MFA. Contains a `mfaPending` flag so it
 * cannot be confused with a real session token.
 */
function signMfaToken(userId, context = "auth", metadata = {}) {
  return sign(
    { userId: userId.toString(), mfaPending: true, context, ...metadata },
    getJwtSecret(),
    {
      expiresIn: "10m",
    },
  );
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

    // Create new user immediately
    const user = await User.create({
      email: email.toLowerCase().trim(),
      passwordHash,
      mfaEnabled: !!normalizedPhone,
      phone: normalizedPhone || null,
    });

    // If phone number was provided, initiate verification
    if (normalizedPhone) {
      try {
        // Send verification code via Twilio
        await sendVerificationCode(normalizedPhone);

        // Create a short-lived MFA token for the verification step
        const mfaToken = signMfaToken(user._id);

        // Mask the phone number for the response (e.g., +1555123****)
        const masked =
          normalizedPhone.slice(0, -4).replace(/./g, "*") +
          normalizedPhone.slice(-4);

        // Return a response requiring MFA/Verification
        return res.status(200).json({
          mfaRequired: true,
          mfaToken,
          phoneMasked: masked,
        });
      } catch (twilioErr) {
        // Log error — the user is created but MFA might be broken
        console.error("Twilio send error during registration:", twilioErr);
        // We still return 200/201 but maybe with a warning or just let them try to resend later
        // For simplicity, we'll return an error so they can try again (user will exist but email uniqueness will block next try)
        // Actually, better to catch this and allow them to proceed or fix.
        return res.status(400).json({
          error:
            "Account created but failed to send verification code. Please log in to try again.",
        });
      }
    }

    // No phone provided — direct login
    const token = signToken(user._id, user.roles);
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
    // Trigger MFA if the phone is present and MFA is enabled
    if (user.mfaEnabled && user.phone) {
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
    const token = signToken(user._id, user.roles);
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
  // Use phone from token if this is a profile update verification
  const phoneToVerify =
    payload.context === "profile_update" ? payload.newPhone : user.phone;

  if (!phoneToVerify) {
    return res.status(400).json({ error: "No phone number to verify." });
  }

  try {
    const approved = await checkVerificationCode(phoneToVerify, code);
    if (!approved) {
      return res.status(401).json({ error: "Incorrect verification code." });
    }
  } catch (twilioErr) {
    console.error("Twilio verify error:", twilioErr);
    return res
      .status(502)
      .json({ error: "Verification service error. Try again." });
  }

  // 4. Verification passed
  // If this was a profile update, "commit" the new phone number
  if (payload.context === "profile_update" && payload.newPhone) {
    user.phone = payload.newPhone;
    user.mfaEnabled = true;
    await user.save();
  }

  // Issue the real session (or refresh it)
  const token = signToken(user._id, user.roles);
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
  const phoneToResend =
    payload.context === "profile_update" ? payload.newPhone : user?.phone;

  if (!user || !phoneToResend) {
    return res.status(404).json({ error: "User or phone number not found." });
  }

  try {
    await sendVerificationCode(phoneToResend);
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
    const newPhone = normalizePhoneNumber(phone) || null;
    if (newPhone !== user.phone) {
      if (newPhone) {
        // We no longer store pendingPhone in DB.
        // Instead, we pass it in the MFA token so it's verified first.
        try {
          await sendVerificationCode(newPhone);
          const mfaToken = signMfaToken(user._id, "profile_update", {
            newPhone,
          });
          const masked =
            newPhone.slice(0, -4).replace(/./g, "*") + newPhone.slice(-4);

          return res.json({
            mfaRequired: true,
            mfaToken,
            phoneMasked: masked,
          });
        } catch (twilioErr) {
          console.error("Twilio send error during profile update:", twilioErr);
          return res.status(502).json({
            error: "Failed to send verification code. Please try again.",
          });
        }
      } else {
        // Removing phone number entirely — no verification needed for removal
        user.phone = null;
        user.mfaEnabled = false;
      }
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
