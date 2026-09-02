const express = require('express');
const router = express.Router();
const controller = require('../controllers/authConfigController');
const { Joi, validate } = require('../middleware/validate');
const { tenantMatchesPath } = require('../middleware/authentication');

const authConfigSchema = Joi.object({
  allowPasswordLogin: Joi.boolean(),
  allowSocialLogin: Joi.boolean(),
  allowMfaEnforcement: Joi.boolean(),
  maxSessionDurationMinutes: Joi.number().integer().min(5).max(43_200)
}).min(1);

/**
 * @openapi
 * /api/v1/identity-admin/auth-configs/{tenantUuid}:
 *   get:
 *     summary: Retrieve authentication policy config by Tenant
 *     tags: [Auth Config]
 *     parameters:
 *       - in: path
 *         name: tenantUuid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Tenant Auth Config details
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   put:
 *     summary: Update tenant authentication configuration
 *     tags: [Auth Config]
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
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:tenantUuid', tenantMatchesPath('tenantUuid'), controller.getConfig);
router.put('/:tenantUuid', tenantMatchesPath('tenantUuid'), validate(authConfigSchema), controller.updateConfig);

module.exports = router;
