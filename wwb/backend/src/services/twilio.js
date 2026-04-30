import twilio from "twilio";
import { readSecret } from "../utils/secrets.js";

// Cached instance of the Twilio client to avoid re-initializing on every call
let _client = null;

/**
 * Initializes and returns a singleton Twilio client.
 * Uses cached client if already initialized.
 *
 * @throws {Error} If Twilio credentials (SID or Auth Token) are missing.
 * @returns {import('twilio').Twilio} The initialized Twilio client.
 */
function getClient() {
  if (!_client) {
    // Retrieve credentials using the readSecret helper
    const accountSid = readSecret("TWILIO_ACCOUNT_SID");
    const authToken = readSecret("TWILIO_AUTH_TOKEN");

    // Validate that credentials were provided
    if (!accountSid || !authToken) {
      throw new Error(
        "Twilio credentials missing. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN " +
          "(or their _FILE variants for Docker Swarm secrets).",
      );
    }
    // Instantiate the Twilio client with the SID and Token
    _client = twilio(accountSid, authToken);
  }
  // Return the active client instance
  return _client;
}

/**
 * Retrieves the Twilio Verify Service SID from environment or secrets.
 *
 * @throws {Error} If the Verify Service SID is missing.
 * @returns {string} The Service SID.
 */
function getVerifyServiceSid() {
  // Retrieve the Service SID using the readSecret helper
  const sid = readSecret("TWILIO_VERIFY_SERVICE_SID");
  // Validate that the SID was provided
  if (!sid) {
    throw new Error(
      "TWILIO_VERIFY_SERVICE_SID (or _FILE variant) is required.",
    );
  }
  // Return the valid SID
  return sid;
}

/**
 * Normalizes a phone number to the E.164 format.
 * E.164 is a standardized format (+[country code][number]) required by Twilio.
 *
 * @param {string} phoneNumber - The raw phone number input from the user.
 * @returns {string} The normalized phone number in E.164 format.
 */
export function normalizePhoneNumber(phoneNumber) {
  // If the phone number is empty, return it as-is
  if (!phoneNumber) return phoneNumber;

  // Remove all non-numeric characters (spaces, dashes, parentheses, etc.)
  const digits = phoneNumber.replace(/\D/g, "");

  // If the number is exactly 10 digits, assume it's a US number and prefix with +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // Otherwise, ensure the resulting number starts with a '+'
  return `+${digits}`;
}

/**
 * Sends a multi-factor authentication (MFA) verification code to a phone number.
 * This utilizes Twilio's Verify API.
 *
 * @param {string} phoneNumber - The recipient's phone number.
 * @returns {Promise<string>} The status of the verification request (usually "pending").
 */
export async function sendVerificationCode(phoneNumber) {
  try {
    // Get the initialized Twilio client
    const client = getClient();
    // Get the specific Verify Service SID
    const serviceSid = getVerifyServiceSid();
    // Format the phone number to E.164 standards
    const formatted = normalizePhoneNumber(phoneNumber);

    // Use the Twilio Verify API to create a verification request
    const verification = await client.verify.v2
      .services(serviceSid)
      .verifications.create({
        to: formatted, // Recipient number
        channel: "sms", // Delivery method
      });

    // Return the status of the request (e.g., 'pending')
    return verification.status;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Twilio send failed, using mock mode:", err.message);
      return "pending";
    }
    throw err;
  }
}

/**
 * Verifies an MFA code provided by a user against their phone number.
 *
 * @param {string} phoneNumber - The phone number the code was sent to.
 * @param {string} code - The 6-digit code provided by the user.
 * @returns {Promise<boolean>} True if the code is valid and approved, false otherwise.
 */
export async function checkVerificationCode(phoneNumber, code) {
  try {
    // Get the initialized Twilio client
    const client = getClient();
    // Get the specific Verify Service SID
    const serviceSid = getVerifyServiceSid();
    // Format the phone number to E.164 standards
    const formatted = normalizePhoneNumber(phoneNumber);

    // Use the Twilio Verify API to check the user-provided code
    const check = await client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({
        to: formatted, // Recipient number
        code, // The code to verify
      });

    // Return true only if the status is specifically 'approved'
    return check.status === "approved";
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Twilio check failed, using mock mode:", err.message);
      // In mock mode, any 6-digit code starting with 123 is valid
      return code.startsWith("123");
    }
    throw err;
  }
}
