const express = require('express');
const router = express.Router();
const controller = require('../controllers/authConfigController');

/**
 * @openapi
 * /api/v1/identity-admin/auth-configs/{tenantUuid}:
 *   get:
 *     summary: Retrieve authentication policy config by Tenant
 *     tags: [Authentication Configuration]
 *     parameters:
 *       - in: path
 *         name: tenantUuid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Tenant Auth Config details
 *   put:
 *     summary: Update tenant authentication configuration
 *     tags: [Authentication Configuration]
 *     parameters:
 *       - in: path
 *         name: tenantUuid
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               allowPasswordLogin: { type: boolean, example: true }
 *               allowSocialLogin: { type: boolean, example: true }
 *               allowMfaEnforcement: { type: boolean, example: true }
 *               maxSessionDurationMinutes: { type: integer, example: 480 }
 *     responses:
 *       200:
 *         description: Config updated successfully
 */
router.get('/:tenantUuid', controller.getConfig);
router.put('/:tenantUuid', controller.updateConfig);

module.exports = router;