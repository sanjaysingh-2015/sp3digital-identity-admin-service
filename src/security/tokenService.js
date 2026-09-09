const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * This service makes the identity-admin-service capable of *issuing* tokens
 * (RS256, so the existing authentication.js JWKS verifier can validate them
 * without any changes — see routes/wellKnownRoutes.js which exposes the
 * public half of this same key pair at /.well-known/jwks.json).
 *
 * Configure via:
 *   JWT_PRIVATE_KEY   PEM-encoded RSA private key (use \n for newlines, or mount as a file and set JWT_PRIVATE_KEY_PATH)
 *   JWT_PUBLIC_KEY    PEM-encoded RSA public key (matching JWT_PRIVATE_KEY_PATH set instead)
 *   JWT_KEY_ID         stable "kid" so token headers can be matched against the JWKS
 *   JWT_ISSUER         issuer claim; should match ADMIN_JWT_ISSUER so tokens verify against themselves
 *   ACCESS_TOKEN_TTL_SECONDS   default 900 (15 min)
 *   ID_TOKEN_TTL_SECONDS       default 900 (15 min)
 *   REFRESH_TOKEN_TTL_DAYS     default 30
 */

function loadPem(envVar, pathEnvVar) {
  const inline = process.env[envVar];

  if (inline) {
    return inline
      .trim()
      .replace(/^"(.*)"$/, '$1')
      .replace(/\\n/g, '\n')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');
  }

  const filePath = process.env[pathEnvVar];

  if (filePath) {
    return require('fs')
      .readFileSync(filePath, 'utf8')
      .trim()
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');
  }

  throw new Error(
    `Neither ${envVar} nor ${pathEnvVar} is configured`
  );
}

function privateKey() {
  return loadPem('JWT_PRIVATE_KEY', 'JWT_PRIVATE_KEY_PATH');
}

function publicKey() {
  return loadPem('JWT_PUBLIC_KEY', 'JWT_PUBLIC_KEY_PATH');
}

function keyId() {
  return process.env.JWT_KEY_ID || 'default';
}

function issuer() {
  return process.env.JWT_ISSUER || process.env.ADMIN_JWT_ISSUER || 'sp3digital-identity-admin-service';
}

function accessTokenTtlSeconds() {
  return Number(process.env.ACCESS_TOKEN_TTL_SECONDS || 900);
}

function idTokenTtlSeconds() {
  return Number(process.env.ID_TOKEN_TTL_SECONDS || 900);
}

function refreshTokenTtlDays() {
  return Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30);
}

function validateKeys() {
  try {
    const privatePem = privateKey();
    const publicPem = publicKey();

    crypto.createPrivateKey(privatePem);
    crypto.createPublicKey(publicPem);

    return true;
  } catch (error) {
    console.error('JWT key validation failed:', error.message);
    throw new Error(
      `Invalid JWT RSA key configuration: ${error.message}`
    );
  }
}

/**
 * The public JWK set, for /.well-known/jwks.json. Node's KeyObject#export
 * gives us the JWK directly from the PEM; we just attach use/alg/kid.
 */
function getJwks() {
  const publicPem = publicKey();

  if (!publicPem) {
    throw new Error('JWT public key is not configured');
  }

  let keyObject;

  try {
    keyObject = crypto.createPublicKey({
      key: publicPem,
      format: 'pem',
      type: 'spki'
    });
  } catch (error) {
    console.error('Unable to parse JWT public key:', error.message);

    throw new Error(
      `Invalid JWT public key: ${error.message}`
    );
  }

  const jwk = keyObject.export({
    format: 'jwk'
  });

  return {
    keys: [
      {
        kty: jwk.kty,
        n: jwk.n,
        e: jwk.e,
        kid: keyId(),
        use: 'sig',
        alg: 'RS256'
      }
    ]
  };
}

/**
 * Access token: short-lived, authorizes API calls. Carries the claims
 * authentication.js already expects (tenant_uuid, user_id, permissions).
 */
function signAccessToken({ userId, userUuid, userName, tenantName, tenantUuid, audience, permissions = [] }) {
  return jwt.sign(
    {
      sub: userUuid,
      user_id: userId,
      userName,
      tenant_uuid: tenantUuid,
      tenantName: tenantName,
      permissions,
      token_use: 'access'
    },
    privateKey(),
    {
      algorithm: 'RS256',
      keyid: keyId(),
      issuer: issuer(),
      audience,
      expiresIn: accessTokenTtlSeconds()
    }
  );
}

/**
 * ID token: OIDC-style identity assertion about the authenticated user.
 * Not used for authorization — callers should rely on the access token for that.
 */
function signIdToken({ userId, userUuid, tenantUuid, audience, email, username, firstName, lastName, tenantName, mfaVerified }) {
  return jwt.sign(
    {
      sub: userUuid,
      user_id: userId,
      tenant_uuid: tenantUuid,
      email,
      preferred_username: username,
      given_name: firstName,
      family_name: lastName,
      tenant_name: tenantName,
      amr: mfaVerified ? ['pwd', 'mfa'] : ['pwd'],
      token_use: 'id'
    },
    privateKey(),
    {
      algorithm: 'RS256',
      keyid: keyId(),
      issuer: issuer(),
      audience,
      expiresIn: idTokenTtlSeconds()
    }
  );
}

/** Refresh tokens are opaque random strings, never JWTs — nothing to decode/leak, and easy to revoke server-side. */
function generateRefreshToken() {
  const raw = crypto.randomBytes(48).toString('base64url');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  const expiresOn = new Date(Date.now() + refreshTokenTtlDays() * 24 * 60 * 60 * 1000);
  return { raw, hash, expiresOn };
}

function hashRefreshToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

module.exports = {
  getJwks,
  signAccessToken,
  signIdToken,
  generateRefreshToken,
  hashRefreshToken,
  accessTokenTtlSeconds,
  idTokenTtlSeconds,
  refreshTokenTtlDays,
  validateKeys
};
