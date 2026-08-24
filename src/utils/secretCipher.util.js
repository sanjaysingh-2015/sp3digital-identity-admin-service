/**
 * secretCipher.util.js
 *
 * Minimal AES-256-GCM helper for encrypting/decrypting the
 * `client_secret_encrypted` (varbinary) column on identity_provider.
 *
 * ASSUMPTION: no existing secret-encryption utility was shown in the
 * provided code, so this is a self-contained implementation. Wire
 * IDENTITY_PROVIDER_SECRET_KEY (32-byte, base64) into your secrets
 * manager / env config, and swap this out for your org's existing
 * KMS-backed util if one already exists.
 */
const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // recommended for GCM
const KEY_VERSION = process.env.IDENTITY_PROVIDER_SECRET_KEY_VERSION || "v1";

function getKey() {
  const raw = process.env.IDENTITY_PROVIDER_SECRET_KEY;
  if (!raw) {
    throw new Error(
      "IDENTITY_PROVIDER_SECRET_KEY is not configured; cannot encrypt/decrypt client secrets",
    );
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("IDENTITY_PROVIDER_SECRET_KEY must decode to 32 bytes");
  }
  return key;
}

/** Encrypts a plaintext client secret. Returns a Buffer suitable for varbinary storage. */
function encrypt(plaintext) {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plaintext), "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Stored layout: [iv (12)] [authTag (16)] [ciphertext (n)]
  return {
    buffer: Buffer.concat([iv, authTag, encrypted]),
    keyVersion: KEY_VERSION,
  };
}

/** Decrypts a varbinary Buffer previously produced by encrypt(). */
function decrypt(buffer) {
  const key = getKey();
  const iv = buffer.subarray(0, IV_LENGTH);
  const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + 16);
  const ciphertext = buffer.subarray(IV_LENGTH + 16);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

module.exports = { encrypt, decrypt, KEY_VERSION };
