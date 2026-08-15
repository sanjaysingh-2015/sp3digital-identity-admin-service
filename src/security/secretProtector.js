const crypto = require('crypto');

function encryptionKey() {
  const encoded = process.env.MFA_ENCRYPTION_KEY;
  if (!encoded) throw new Error('MFA_ENCRYPTION_KEY is not configured');

  const key = Buffer.from(encoded, 'base64');
  if (key.length !== 32) throw new Error('MFA_ENCRYPTION_KEY must be a base64-encoded 32-byte key');
  return key;
}

function encrypt(plaintext) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const keyVersion = process.env.MFA_ENCRYPTION_KEY_VERSION || 'v1';

  return `${keyVersion}.${iv.toString('base64url')}.${tag.toString('base64url')}.${ciphertext.toString('base64url')}`;
}

function decrypt(payload) {
  const [keyVersion, ivValue, tagValue, ciphertextValue] = String(payload).split('.');
  if (!keyVersion || !ivValue || !tagValue || !ciphertextValue) throw new Error('Encrypted secret has an invalid format');

  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivValue, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextValue, 'base64url')),
    decipher.final()
  ]).toString('utf8');
}

module.exports = { encrypt, decrypt };
