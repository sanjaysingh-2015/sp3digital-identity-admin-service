const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const controller = require('../controllers/authController');
const { Joi, validate } = require('../middleware/validate');

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
 * ⚠️ SECURITY NOTE: forceChange=true is fully public — no authentication is
 * required. Anyone who knows a user's usernameOrEmail + tenantUuid can set
 * that user's password with zero proof of identity. This was an explicit,
 * deliberate choice (not the original design — see git history) and should
 * be revisited before this service handles real user accounts. At minimum,
 * consider replacing this with a proper reset-token flow (emailed/SMS'd
 * short-lived token proving inbox/phone ownership) rather than leaving
 * password-reset fully open on the network.
 */

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
 *       Fully public — no authentication required for either mode.
 *       Self-service (forceChange omitted/false) requires oldPassword to match.
 *       forceChange=true skips oldPassword entirely (see security note above router.post below).
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: "{ userId, passwordUpdated: true, forceChange, passwordExpiresOn, rotationRequired }"
 *       401:
 *         description: Invalid oldPassword or account locked (forceChange=false only)
 *       422:
 *         description: New password fails the tenant's security policy (complexity/reuse)
 */
router.post(
  '/change-password',
  loginRateLimiter,
  validate(changePasswordSchema),
  controller.changePassword
);

module.exports = router;
