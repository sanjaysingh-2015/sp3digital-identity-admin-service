const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const controller = require('../controllers/authController');
const { Joi, validate } = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/authentication');

/**
 * These endpoints are how a caller *gets* a token in the first place, so
 * (unlike every other route in this service) they must NOT go through
 * authentication.js's bearer-token check. Brute-force protection instead
 * comes from: this rate limiter (IP-based), plus the per-account lockout
 * enforced inside credentialService/mfaService (failed_verification_count /
 * locked_until), which survives even if the caller rotates IPs.
 */
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 'RATE_LIMITED', message: 'Too many login attempts. Try again later.' }
});

const loginSchema = Joi.object({
  usernameOrEmail: Joi.string().trim().min(3).max(150).required(),
  password: Joi.string().min(1).max(256).required(),
  tenantUuid: Joi.string().uuid().required()
});

const mfaLoginSchema = Joi.object({
  mfaToken: Joi.string().required(),
  code: Joi.string().pattern(/^\d{6}$/).required()
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required()
});

const changePasswordSchema = Joi.object({
  usernameOrEmail: Joi.string().trim().min(3).max(150).required(),
  tenantUuid: Joi.string().uuid().required(),
  // Required unless forceChange=true — see the .when() below.
  oldPassword: Joi.string().min(1).max(256).when('forceChange', { is: true, then: Joi.optional(), otherwise: Joi.required() }),
  newPassword: Joi.string().min(8).max(256).required(),
  forceChange: Joi.boolean().default(false)
});

/**
 * forceChange=true skips the oldPassword check entirely (that's what
 * forceChange means — an admin overriding a user's password without
 * knowing it). Without a check here, that's a full account-takeover
 * primitive: anyone who knows usernameOrEmail + tenantUuid (both
 * discoverable, the latter via the public tenant-search endpoint) could
 * set any user's password with zero proof of identity.
 *
 * self-service changes (forceChange omitted/false) stay fully public —
 * they're already protected by the oldPassword check inside authService.
 * Only the forceChange=true path needs a real caller, so this middleware
 * is a no-op for everything else.
 */
function requireAdminForForceChange(req, res, next) {
  if (req.body?.forceChange !== true) return next();

  return authenticate(req, res, (err) => {
    if (err) return next(err);
    // Using the existing blanket permission for now since that's what
    // current admin roles actually carry — tighten this to a granular
    // 'users:write' once the RBAC-granularity work lands (see roadmap
    // Week 6) so force-change specifically requires user-management
    // rights rather than any admin-write permission.
    return authorize('identity-admin:write')(req, res, next);
  });
}

/**
 * @openapi
 * /api/v1/identity-admin/auth/login:
 *   post:
 *     summary: Authenticate with username/email + password. Returns tokens directly, or an MFA challenge if the user has MFA enrolled.
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: >
 *           Either { tokenType, accessToken, idToken, refreshToken, expiresIn }
 *           or { mfaRequired: true, mfaToken, expiresIn } if MFA verification is needed next.
 *       401:
 *         description: Invalid credentials
 *       423:
 *         description: Account locked due to repeated failed attempts
 */
router.post('/login', loginRateLimiter, validate(loginSchema), controller.login);

/**
 * @openapi
 * /api/v1/identity-admin/auth/login/mfa:
 *   post:
 *     summary: Completes login by exchanging an MFA challenge token + TOTP code for real tokens.
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: "{ tokenType, accessToken, idToken, refreshToken, expiresIn }"
 *       401:
 *         description: Invalid code or expired/invalid challenge
 */
router.post('/login/mfa', loginRateLimiter, validate(mfaLoginSchema), controller.completeMfaLogin);

/**
 * @openapi
 * /api/v1/identity-admin/auth/token/refresh:
 *   post:
 *     summary: Exchanges a refresh token for a new access/id/refresh token triad. Refresh tokens are single-use (rotated on every call).
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: "{ tokenType, accessToken, idToken, refreshToken, expiresIn }"
 *       401:
 *         description: Refresh token invalid, expired, or already used (reuse revokes the session)
 */
router.post('/token/refresh', loginRateLimiter, validate(refreshSchema), controller.refresh);

/**
 * @openapi
 * /api/v1/identity-admin/auth/logout:
 *   post:
 *     summary: Revokes a refresh token and its session. Idempotent.
 *     tags: [Authentication]
 */
router.post('/logout', validate(refreshSchema), controller.logout);

/**
 * @openapi
 * /api/v1/identity-admin/auth/change-password:
 *   post:
 *     summary: >
 *       Sets a new password for a user identified by usernameOrEmail + tenantUuid.
 *       Self-service (forceChange omitted/false) is public and requires oldPassword
 *       to match. forceChange=true (admin override, skips oldPassword) requires a
 *       valid bearer token with identity-admin:write — see requireAdminForForceChange above.
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: "{ userId, passwordUpdated: true, forceChange, passwordExpiresOn, rotationRequired }"
 *       401:
 *         description: Invalid oldPassword, account locked (forceChange=false), or missing/invalid bearer token (forceChange=true)
 *       403:
 *         description: Authenticated caller lacks identity-admin:write (forceChange=true only)
 *       422:
 *         description: New password fails the tenant's security policy (complexity/reuse)
 */
router.post(
  '/change-password',
  loginRateLimiter,
  validate(changePasswordSchema),
  requireAdminForForceChange,
  controller.changePassword
);

module.exports = router;
