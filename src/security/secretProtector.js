const crypto = require('crypto');

/**
 * Keys are configured as MFA_ENCRYPTION_KEY (current) and, optionally,
 * MFA_ENCRYPTION_KEY_<VERSION> for older versions still needed to decrypt
 * secrets that haven't been re-encrypted yet. This allows key rotation
 * without a big-bang re-encryption migration: new writes use the current
 * key/version, old rows keep decrypting under their original version until
 * rotateSecret() (see mfaService) re-wraps them.
 */
function currentKeyVersion() {
  return process.env.MFA_ENCRYPTION_KEY_VERSION || 'v1';
}

function keyForVersion(version) {
  const envVar = version === currentKeyVersion() ? 'MFA_ENCRYPTION_KEY' : `MFA_ENCRYPTION_KEY_${version}`;
  const encoded = process.env[envVar];
  if (!encoded) throw new Error(`${envVar} is not configured`);

  const key = Buffer.from(encoded, 'base64');
  if (key.length !== 32) throw new Error(`${envVar} must be a base64-encoded 32-byte key`);
  return key;
}

function encrypt(plaintext, version = currentKeyVersion()) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyForVersion(version), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    payload: `${version}.${iv.toString('base64url')}.${tag.toString('base64url')}.${ciphertext.toString('base64url')}`,
    keyVersion: version
  };
}

function decrypt(payload) {
  const [keyVersion, ivValue, tagValue, ciphertextValue] = String(payload).split('.');
  if (!keyVersion || !ivValue || !tagValue || !ciphertextValue) throw new Error('Encrypted secret has an invalid format');

  const decipher = crypto.createDecipheriv('aes-256-gcm', keyForVersion(keyVersion), Buffer.from(ivValue, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextValue, 'base64url')),
    decipher.final()
  ]).toString('utf8');
}

/** Re-encrypts an existing payload under the current key version. */
function rotate(payload) {
  return encrypt(decrypt(payload));
}

module.exports = { encrypt, decrypt, rotate, currentKeyVersion };
