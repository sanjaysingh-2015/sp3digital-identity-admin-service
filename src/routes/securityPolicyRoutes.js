const express = require('express');
const router = express.Router();
const controller = require('../controllers/securityPolicyController');

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
router.post('/', controller.updatePolicy);

module.exports = router;