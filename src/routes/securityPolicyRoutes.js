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
 *     summary: Get the tenant's active password & security policy settings
 *     tags: [Security Policy]
 *     responses:
 *       200:
 *         description: Active security policy details
 *       404: { $ref: '#/components/responses/NotFound' }
 *   post:
 *     summary: Update the tenant's security policy configuration (creates a new versioned record)
 *     tags: [Security Policy]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               minPasswordLength: { type: integer, minimum: 8, maximum: 128, example: 12 }
 *               requireUppercase: { type: boolean, example: true }
 *               requireLowercase: { type: boolean, example: true }
 *               requireNumber: { type: boolean, example: true }
 *               requireSpecialCharacter: { type: boolean, example: true }
 *               passwordHistoryCount: { type: integer, minimum: 0, maximum: 24, example: 5 }
 *               passwordMaxAgeDays: { type: integer, minimum: 1, maximum: 3650, nullable: true, example: 90 }
 *               maxFailedAttempts: { type: integer, minimum: 1, maximum: 20, example: 5 }
 *               lockoutDurationMinutes: { type: integer, minimum: 1, maximum: 1440, example: 30 }
 *               accessTokenLifetimeMinutes: { type: integer, minimum: 5, maximum: 1440, example: 60 }
 *               refreshTokenLifetimeDays: { type: integer, minimum: 1, maximum: 365, example: 30 }
 *               maxSessionDurationMinutes: { type: integer, minimum: 5, maximum: 43200, example: 480 }
 *               maxConcurrentSessions: { type: integer, minimum: 1, maximum: 100, nullable: true, example: 5 }
 *               mfaRequired: { type: boolean, example: false }
 *     responses:
 *       200:
 *         description: Policy updated; a new version is recorded in the policy history
 *       400: { $ref: '#/components/responses/ValidationError' }
 */
router.get('/', controller.getActivePolicy);
router.post('/', validate(policySchema), controller.updatePolicy);

/**
 * @openapi
 * /api/v1/identity-admin/security-policy/history:
 *   get:
 *     summary: List historical versions of the tenant's security policy (paginated)
 *     tags: [Security Policy]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ACTIVE, INACTIVE] }
 *     responses:
 *       200:
 *         description: Paginated list of historical policy versions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: array, items: { type: object } }
 *                 pagination: { $ref: '#/components/schemas/PaginationMeta' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 * /api/v1/identity-admin/security-policy/history/{version}:
 *   get:
 *     summary: Get a specific historical version of the security policy
 *     tags: [Security Policy]
 *     parameters:
 *       - in: path
 *         name: version
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Security policy version detail
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/history', validate(historyQuerySchema, 'query'), controller.getPolicyHistory);
router.get('/history/:version', validate(Joi.object({ version: id }), 'params'), controller.getPolicyVersion);

module.exports = router;
