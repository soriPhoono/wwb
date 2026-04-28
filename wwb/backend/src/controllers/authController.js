import { hash, compare } from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import User from "../models/User.js";
import { getJwtSecret } from "../middleware/auth.js";
import {
  sendVerificationCode,
  checkVerificationCode,
  normalizePhoneNumber,
} from "../services/twilio.js";

const { sign, verify } = jsonwebtoken;

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

function signMfaToken(userId, context = "auth", metadata = {}) {
  return sign(
    { userId: userId.toString(), mfaPending: true, context, ...metadata },
    getJwtSecret(),
    {
      expiresIn: "10m",
    },
  );
}

export const register = async (req, res) => {
  const { email, password, phone } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }
  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters." });
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    return res
      .status(409)
      .json({ error: "An account with that email already exists." });
  }

  const passwordHash = await hash(password, 12);
  const normalizedPhone = normalizePhoneNumber(phone);

  const user = await User.create({
    email: email.toLowerCase().trim(),
    passwordHash,
    mfaEnabled: !!normalizedPhone,
    phone: normalizedPhone || null,
  });

  if (normalizedPhone) {
    try {
      await sendVerificationCode(normalizedPhone);
      const mfaToken = signMfaToken(user._id);
      const masked =
        normalizedPhone.slice(0, -4).replace(/./g, "*") +
        normalizedPhone.slice(-4);
      return res.status(200).json({
        mfaRequired: true,
        mfaToken,
        phoneMasked: masked,
      });
    } catch (twilioErr) {
      console.error("Twilio send error during registration:", twilioErr);
      return res.status(400).json({
        error:
          "Account created but failed to send verification code. Please log in to try again.",
      });
    }
  }

  const token = signToken(user._id, user.roles);
  res.cookie("token", token, COOKIE_OPTS);
  return res.status(201).json({ user: user.toSafeObject() });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const valid = await compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  if (user.mfaEnabled && user.phone) {
    try {
      await sendVerificationCode(user.phone);
    } catch (twilioErr) {
      console.error("Twilio send error:", twilioErr);
      return res
        .status(502)
        .json({ error: "Failed to send verification code. Please try again." });
    }

    const mfaToken = signMfaToken(user._id);
    const masked =
      user.phone.slice(0, -4).replace(/./g, "*") + user.phone.slice(-4);
    return res.json({ mfaRequired: true, mfaToken, phoneMasked: masked });
  }

  const token = signToken(user._id, user.roles);
  res.cookie("token", token, COOKIE_OPTS);
  return res.json({ user: user.toSafeObject() });
};

export const verifyMfa = async (req, res) => {
  const { mfaToken, code } = req.body;

  if (!mfaToken || !code) {
    return res
      .status(400)
      .json({ error: "MFA token and verification code are required." });
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
  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }

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

  if (payload.context === "profile_update" && payload.newPhone) {
    user.phone = payload.newPhone;
    user.mfaEnabled = true;
    await user.save();
  }

  const token = signToken(user._id, user.roles);
  res.cookie("token", token, COOKIE_OPTS);
  return res.json({ user: user.toSafeObject() });
};

export const resendMfa = async (req, res) => {
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
};

export const logout = (req, res) => {
  res.clearCookie("token");
  return res.json({ message: "Logged out." });
};

export const getMe = async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: "User not found." });
  return res.json({ user: user.toSafeObject() });
};

export const updateProfile = async (req, res) => {
  const { email, phone } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: "User not found." });

  const normalizedEmail = email.toLowerCase().trim();

  if (normalizedEmail !== user.email) {
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res
        .status(409)
        .json({ error: "An account with that email already exists." });
    }
  }

  const newPhone = normalizePhoneNumber(phone) || null;
  if (newPhone !== user.phone) {
    if (newPhone) {
      try {
        await sendVerificationCode(newPhone);
        const mfaToken = signMfaToken(user._id, "profile_update", { newPhone });
        const masked =
          newPhone.slice(0, -4).replace(/./g, "*") + newPhone.slice(-4);

        return res.json({ mfaRequired: true, mfaToken, phoneMasked: masked });
      } catch (twilioErr) {
        console.error("Twilio send error during profile update:", twilioErr);
        return res.status(502).json({
          error: "Failed to send verification code. Please try again.",
        });
      }
    } else {
      user.phone = null;
      user.mfaEnabled = false;
    }
  }

  user.email = normalizedEmail;
  await user.save();

  return res.json({ user: user.toSafeObject() });
};

export const changePassword = async (req, res) => {
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

  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: "User not found." });

  const valid = await compare(currentPassword, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Current password is incorrect." });
  }

  user.passwordHash = await hash(newPassword, 12);
  await user.save();

  return res.json({ message: "Password updated successfully." });
};
