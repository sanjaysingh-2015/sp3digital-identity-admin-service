const express = require('express');
const router = express.Router();
const controller = require('../controllers/securityPolicyController');
const { Joi, validate, id } = require('../middleware/validate');
const { paginationQuerySchema } = require('../utils/pagination');

const historyQuerySchema = paginationQuerySchema({
  status: Joi.string().valid('ACTIVE', 'INACTIVE')
});

const policySchema = Joi.object({
  minPasswordLength: Joi.number().integer().min(8).max(128),
  requireUppercase: Joi.boolean(), requireLowercase: Joi.boolean(),
  requireNumber: Joi.boolean(), requireSpecialCharacter: Joi.boolean(),
  passwordHistoryCount: Joi.number().integer().min(0).max(24),
  passwordMaxAgeDays: Joi.number().integer().min(1).max(3650).allow(null),
  maxFailedAttempts: Joi.number().integer().min(1).max(20),
  lockoutDurationMinutes: Joi.number().integer().min(1).max(1440),
  accessTokenLifetimeMinutes: Joi.number().integer().min(5).max(1440),
  refreshTokenLifetimeDays: Joi.number().integer().min(1).max(365),
  maxSessionDurationMinutes: Joi.number().integer().min(5).max(43200),
  maxConcurrentSessions: Joi.number().integer().min(1).max(100).allow(null),
  mfaRequired: Joi.boolean()
}).min(1);

/**
 * @openapi
 * /api/v1/identity-admin/security-policy:
 *   get:
 *     summary: Get active password & security policy settings
 *     tags: [Security Policy]
 *     responses:
 *       200:
 *         description: Active security policy details
 *   post:
 *     summary: Update system security policy configuration
 *     tags: [Security Policy]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               minPasswordLength: { type: integer, example: 12 }
 *               requireUppercase: { type: boolean, example: true }
 *               requireNumbers: { type: boolean, example: true }
 *               maxFailedAttempts: { type: integer, example: 5 }
 *               tokenLifetimeMinutes: { type: integer, example: 120 }
 *     responses:
 *       200:
 *         description: Policy updated successfully
 */
router.get('/', controller.getActivePolicy);
router.post('/', validate(policySchema), controller.updatePolicy);

/**
 * @openapi
 * /api/v1/identity-admin/security-policy/history:
 *   get:
 *     summary: List all historical versions of the tenant's security policy (paginated)
 *     tags: [Security Policy]
 * /api/v1/identity-admin/security-policy/history/{version}:
 *   get:
 *     summary: Get a specific historical version of the security policy
 *     tags: [Security Policy]
 */
router.get('/history', validate(historyQuerySchema, 'query'), controller.getPolicyHistory);
router.get('/history/:version', validate(Joi.object({ version: id }), 'params'), controller.getPolicyVersion);

module.exports = router;
