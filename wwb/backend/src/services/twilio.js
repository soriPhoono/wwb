import twilio from "twilio";
import fs from "fs";

/**
 * Read a Twilio credential from an env var, falling back to a
 * Docker-Swarm-style secret file (e.g. TWILIO_ACCOUNT_SID_FILE).
 */
function readSecret(envKey) {
  if (process.env[envKey]) return process.env[envKey];

  const fileKey = `${envKey}_FILE`;
  if (process.env[fileKey]) {
    try {
      return fs.readFileSync(process.env[fileKey], "utf8").trim();
    } catch (e) {
      console.error(`Could not read ${fileKey}:`, e.message);
    }
  }
  return undefined;
}

let _client = null;

function getClient() {
  if (!_client) {
    const accountSid = readSecret("TWILIO_ACCOUNT_SID");
    const authToken = readSecret("TWILIO_AUTH_TOKEN");

    if (!accountSid || !authToken) {
      throw new Error(
        "Twilio credentials missing. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN " +
          "(or their _FILE variants for Docker Swarm secrets).",
      );
    }
    _client = twilio(accountSid, authToken);
  }
  return _client;
}

function getVerifyServiceSid() {
  const sid = readSecret("TWILIO_VERIFY_SERVICE_SID");
  if (!sid) {
    throw new Error(
      "TWILIO_VERIFY_SERVICE_SID (or _FILE variant) is required.",
    );
  }
  return sid;
}

/**
 * Send a 6-digit verification code to the given phone number via SMS.
 * @param {string} phoneNumber – E.164 format, e.g. "+15551234567"
 */
export async function sendVerificationCode(phoneNumber) {
  const client = getClient();
  const serviceSid = getVerifyServiceSid();

  const verification = await client.verify.v2
    .services(serviceSid)
    .verifications.create({ to: phoneNumber, channel: "sms" });

  return verification.status; // "pending"
}

/**
 * Check a verification code submitted by the user.
 * @param {string} phoneNumber – must match the number the code was sent to
 * @param {string} code – the 6-digit code from the user
 * @returns {boolean} true if code is valid
 */
export async function checkVerificationCode(phoneNumber, code) {
  const client = getClient();
  const serviceSid = getVerifyServiceSid();

  const check = await client.verify.v2
    .services(serviceSid)
    .verificationChecks.create({ to: phoneNumber, code });

  return check.status === "approved";
}
