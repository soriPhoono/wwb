import fs from "fs";

/**
 * Reads a secret from an environment variable or a file.
 * If ENV_KEY exists, it returns its value.
 * If ENV_KEY_FILE exists, it reads the content of the file at that path.
 *
 * @param {string} envKey - The name of the environment variable.
 * @returns {string|undefined} - The secret value or undefined if not found.
 */
export function readSecret(envKey) {
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
