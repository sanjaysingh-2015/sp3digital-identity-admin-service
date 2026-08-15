const express = require('express');
const router = express.Router({ mergeParams: true });
const controller = require('../controllers/mfaController');
const { Joi, validate } = require('../middleware/validate');

const mfaRegistrationSchema = Joi.object({
  mfaType: Joi.string().valid('TOTP').required()
});
const mfaVerificationSchema = Joi.object({ code: Joi.string().pattern(/^\d{6}$/).required() });

/**
 * @openapi
 * /api/v1/identity-admin/users/{userId}/mfa:
 *   get:
 *     summary: Retrieve user registered MFA methods
 *     tags: [MFA]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: List of MFA methods
 *   post:
 *     summary: Register a new MFA method for a user
 *     tags: [MFA]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mfaType, secret]
 *             properties:
 *               mfaType: { type: string, example: "TOTP" }
 *               secret: { type: string, example: "JBSWY3DPEHPK3PXP" }
 *     responses:
 *       201:
 *         description: MFA registered successfully
 */
router.get('/', controller.getUserMfaMethods);
router.post('/', validate(mfaRegistrationSchema), controller.registerMfaMethod);
router.post('/:mfaId/verify', validate(mfaVerificationSchema), controller.verifyMfaMethod);

/**
 * @openapi
 * /api/v1/identity-admin/users/{userId}/mfa/{mfaId}/revoke:
 *   patch:
 *     summary: Revoke an MFA method
 *     tags: [MFA]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: mfaId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: MFA revoked successfully
 */
router.patch('/:mfaId/revoke', controller.revokeMfaMethod);

module.exports = router;
