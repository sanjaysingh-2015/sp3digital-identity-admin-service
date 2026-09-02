const express = require('express');
const router = express.Router();
const controller = require('../controllers/serviceAccountController');
const { Joi, validate, id } = require('../middleware/validate');
const { paginationQuerySchema } = require('../utils/pagination');

const serviceAccountSchema = Joi.object({
  accountName: Joi.string().trim().min(3).max(150).required(),
  serviceCode: Joi.string().trim().pattern(/^[A-Z0-9_]+$/).max(100),
  description: Joi.string().trim().max(500).allow('', null),
  organizationId: Joi.number().integer().positive(),
  expiresOn: Joi.date().iso().greater('now')
});

const serviceAccountUpdateSchema = Joi.object({
  accountName: Joi.string().trim().min(3).max(150),
  description: Joi.string().trim().max(500).allow('', null),
  expiresOn: Joi.date().iso().greater('now').allow(null)
}).min(1);

const listQuerySchema = paginationQuerySchema({
  status: Joi.string().valid('ACTIVE', 'SUSPENDED', 'EXPIRED', 'REVOKED'),
  search: Joi.string().trim().max(150)
});
const idParamSchema = Joi.object({ id });

/**
 * @openapi
 * /api/v1/identity-admin/service-accounts:
 *   get:
 *     summary: List service accounts (paginated, filterable, searchable)
 *     tags: [Service Accounts]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ACTIVE, SUSPENDED, EXPIRED, REVOKED] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated list of service accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: array, items: { type: object } }
 *                 pagination: { $ref: '#/components/schemas/PaginationMeta' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *   post:
 *     summary: Create a service account (provisions a backing API client)
 *     tags: [Service Accounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [accountName]
 *             properties:
 *               accountName: { type: string, minLength: 3, maxLength: 150, example: "Nightly Reconciliation Job" }
 *               serviceCode: { type: string, pattern: '^[A-Z0-9_]+$', example: "NIGHTLY_RECON" }
 *               description: { type: string, nullable: true }
 *               organizationId: { type: integer, example: 101 }
 *               expiresOn: { type: string, format: date-time, description: Must be in the future }
 *     responses:
 *       201:
 *         description: Service account created, along with its backing API client credentials (secret returned once)
 *       400: { $ref: '#/components/responses/ValidationError' }
 * /api/v1/identity-admin/service-accounts/{id}:
 *   get:
 *     summary: Get a service account by ID
 *     tags: [Service Accounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Service account detail object
 *       404: { $ref: '#/components/responses/NotFound' }
 *   patch:
 *     summary: Update a service account's metadata
 *     tags: [Service Accounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               accountName: { type: string, minLength: 3, maxLength: 150 }
 *               description: { type: string, nullable: true }
 *               expiresOn: { type: string, format: date-time, nullable: true }
 *     responses:
 *       200:
 *         description: Service account updated
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/', validate(listQuerySchema, 'query'), controller.getAccounts);
router.post('/', validate(serviceAccountSchema), controller.createAccount);
router.get('/:id', validate(idParamSchema, 'params'), controller.getAccountById);
router.patch('/:id', validate(idParamSchema, 'params'), validate(serviceAccountUpdateSchema), controller.updateAccount);

/**
 * @openapi
 * /api/v1/identity-admin/service-accounts/{id}/deactivate:
 *   patch:
 *     summary: Temporarily suspend a service account (reversible)
 *     tags: [Service Accounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Service account suspended
 *       404: { $ref: '#/components/responses/NotFound' }
 * /api/v1/identity-admin/service-accounts/{id}/reactivate:
 *   patch:
 *     summary: Reactivate a suspended service account
 *     tags: [Service Accounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Service account reactivated
 *       404: { $ref: '#/components/responses/NotFound' }
 * /api/v1/identity-admin/service-accounts/{id}/revoke:
 *   patch:
 *     summary: Permanently revoke a service account and its backing client (irreversible)
 *     tags: [Service Accounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Service account revoked
 *       404: { $ref: '#/components/responses/NotFound' }
 * /api/v1/identity-admin/service-accounts/{id}/rotate-secret:
 *   post:
 *     summary: Rotate the backing API client's secret; revokes outstanding tokens
 *     tags: [Service Accounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Secret rotated. The new secret is returned once, only in this response.
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/:id/deactivate', controller.deactivateAccount);
router.patch('/:id/reactivate', controller.reactivateAccount);
router.patch('/:id/revoke', controller.revokeAccount);
router.post('/:id/rotate-secret', controller.rotateSecret);

module.exports = router;
