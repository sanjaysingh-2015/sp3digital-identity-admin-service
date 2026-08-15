const crypto = require('crypto');

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function generateSecret(length = 32) {
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (byte) => alphabet[byte & 31]).join('');
}

function decodeBase32(value) {
  const normalized = value.toUpperCase().replace(/[=\s-]/g, '');
  let buffer = 0;
  let bits = 0;
  const output = [];

  for (const character of normalized) {
    const index = alphabet.indexOf(character);
    if (index === -1) throw new Error('TOTP secret contains an invalid base32 character');
    buffer = (buffer << 5) | index;
    bits += 5;
    if (bits >= 8) {
      output.push((buffer >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(output);
}

function generateCode(secret, timestamp = Date.now(), digits = 6, periodSeconds = 30) {
  const counter = Math.floor(timestamp / 1000 / periodSeconds);
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const digest = crypto.createHmac('sha1', decodeBase32(secret)).update(message).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const value = ((digest.readUInt32BE(offset) & 0x7fffffff) % (10 ** digits));
  return String(value).padStart(digits, '0');
}

function verifyCode(secret, code, timestamp = Date.now(), window = 1) {
  const supplied = String(code);
  if (!/^\d{6}$/.test(supplied)) return false;

  for (let step = -window; step <= window; step += 1) {
    const expected = generateCode(secret, timestamp + step * 30_000);
    if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))) return true;
  }
  return false;
}

module.exports = { generateSecret, generateCode, verifyCode };
