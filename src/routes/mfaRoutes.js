const express = require('express');
const router = express.Router({ mergeParams: true });
const controller = require('../controllers/mfaController');
const { Joi, validate } = require('../middleware/validate');
const { paginationQuerySchema } = require('../utils/pagination');

const mfaRegistrationSchema = Joi.object({
  mfaType: Joi.string().valid('TOTP').required()
});
const mfaVerificationSchema = Joi.object({ code: Joi.string().pattern(/^\d{6}$/).required() });
const mfaListQuerySchema = paginationQuerySchema({
  status: Joi.string().valid('PENDING', 'ACTIVE', 'INACTIVE', 'REVOKED')
});

/**
 * @openapi
 * /api/v1/identity-admin/users/{userId}/mfa:
 *   get:
 *     summary: List a user's registered MFA methods (paginated, filterable by status)
 *     tags: [MFA]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, ACTIVE, INACTIVE, REVOKED] }
 *     responses:
 *       200:
 *         description: Paginated list of MFA methods
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: array, items: { type: object } }
 *                 pagination: { $ref: '#/components/schemas/PaginationMeta' }
 *   post:
 *     summary: >
 *       Begin registering a new TOTP MFA method for a user. The server
 *       generates the secret; it is returned once in the response for the
 *       user to scan/enter into their authenticator app, then must be
 *       confirmed via POST .../mfa/{mfaId}/verify before it becomes ACTIVE.
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
 *             required: [mfaType]
 *             properties:
 *               mfaType: { type: string, enum: [TOTP], example: "TOTP" }
 *     responses:
 *       201:
 *         description: "MFA method created in PENDING status. Response includes the one-time secret/QR provisioning URI."
 *       400: { $ref: '#/components/responses/ValidationError' }
 */
router.get('/', validate(mfaListQuerySchema, 'query'), controller.getUserMfaMethods);
router.post('/', validate(mfaRegistrationSchema), controller.registerMfaMethod);

/**
 * @openapi
 * /api/v1/identity-admin/users/{userId}/mfa/{mfaId}/verify:
 *   post:
 *     summary: Confirm a PENDING MFA method with a TOTP code, activating it
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string, pattern: '^\d{6}$', example: "123456" }
 *     responses:
 *       200:
 *         description: MFA method activated
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401:
 *         description: Invalid or expired code
 *       404: { $ref: '#/components/responses/NotFound' }
 * /api/v1/identity-admin/users/{userId}/mfa/{mfaId}/rotate:
 *   post:
 *     summary: Rotate the TOTP secret for an existing MFA method (re-enrollment)
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
 *         description: Secret rotated. New provisioning secret/QR returned once.
 *       404: { $ref: '#/components/responses/NotFound' }
 * /api/v1/identity-admin/users/{userId}/mfa/{mfaId}/deactivate:
 *   patch:
 *     summary: Deactivate an MFA method (reversible)
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
 *         description: MFA method deactivated
 *       404: { $ref: '#/components/responses/NotFound' }
 * /api/v1/identity-admin/users/{userId}/mfa/{mfaId}/reactivate:
 *   patch:
 *     summary: Reactivate a previously deactivated MFA method
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
 *         description: MFA method reactivated
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post('/:mfaId/verify', validate(mfaVerificationSchema), controller.verifyMfaMethod);
router.post('/:mfaId/rotate', controller.rotateMfaSecret);
router.patch('/:mfaId/deactivate', controller.deactivateMfaMethod);
router.patch('/:mfaId/reactivate', controller.reactivateMfaMethod);

/**
 * @openapi
 * /api/v1/identity-admin/users/{userId}/mfa/{mfaId}/revoke:
 *   patch:
 *     summary: Permanently revoke an MFA method (irreversible)
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
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/:mfaId/revoke', controller.revokeMfaMethod);

module.exports = router;
