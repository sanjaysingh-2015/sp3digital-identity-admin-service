const express = require('express');
const router = express.Router();
const controller = require('../controllers/apiClientController');
const { Joi, validate, id } = require('../middleware/validate');
const { paginationQuerySchema } = require('../utils/pagination');

const apiClientSchema = Joi.object({
  clientName: Joi.string().trim().min(3).max(150).required(),
  clientCode: Joi.string().trim().pattern(/^[A-Z0-9_]+$/).max(100),
  description: Joi.string().trim().max(500).allow('', null),
  clientType: Joi.string().valid('CONFIDENTIAL', 'PUBLIC').default('CONFIDENTIAL'),
  organizationId: Joi.number().integer().positive(),
  allowedIps: Joi.array().items(Joi.string().ip()).unique().max(100).default([]),
  allowedOrigins: Joi.array().items(Joi.string().uri({ scheme: ['https'] })).unique().max(100).default([]),
  expiresOn: Joi.date().iso().greater('now').allow(null)
});

const apiClientUpdateSchema = Joi.object({
  clientName: Joi.string().trim().min(3).max(150),
  description: Joi.string().trim().max(500).allow('', null),
  allowedIps: Joi.array().items(Joi.string().ip()).unique().max(100),
  allowedOrigins: Joi.array().items(Joi.string().uri({ scheme: ['https'] })).unique().max(100),
  expiresOn: Joi.date().iso().greater('now').allow(null)
}).min(1);

const listQuerySchema = paginationQuerySchema({
  status: Joi.string().valid('ACTIVE', 'SUSPENDED', 'EXPIRED', 'REVOKED'),
  clientType: Joi.string().valid('CONFIDENTIAL', 'PUBLIC'),
  search: Joi.string().trim().max(150)
});
const idParamSchema = Joi.object({ id });

/**
 * @openapi
 * /api/v1/identity-admin/api-clients:
 *   get:
 *     summary: List API clients (paginated, filterable, searchable)
 *     tags: [API Clients]
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
 *         name: clientType
 *         schema: { type: string, enum: [CONFIDENTIAL, PUBLIC] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated list of API clients (client secret is never returned)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items: { type: object }
 *                 pagination: { $ref: '#/components/schemas/PaginationMeta' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *   post:
 *     summary: Register an API client
 *     tags: [API Clients]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [clientName]
 *             properties:
 *               clientName: { type: string, minLength: 3, example: "Billing Integration Service" }
 *               clientCode: { type: string, pattern: '^[A-Z0-9_]+$', example: "BILLING_INTEGRATION" }
 *               description: { type: string, nullable: true }
 *               clientType: { type: string, enum: [CONFIDENTIAL, PUBLIC], default: CONFIDENTIAL }
 *               organizationId: { type: integer, example: 101 }
 *               allowedIps:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["192.168.1.50"]
 *               allowedOrigins:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["https://app.example.com"]
 *               expiresOn: { type: string, format: date-time, nullable: true }
 *     responses:
 *       201:
 *         description: API client registered. The client secret is returned once, only in this response.
 *       400: { $ref: '#/components/responses/ValidationError' }
 * /api/v1/identity-admin/api-clients/{id}:
 *   get:
 *     summary: Get an API client by ID
 *     tags: [API Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: API client detail object
 *       404: { $ref: '#/components/responses/NotFound' }
 *   patch:
 *     summary: Update an API client's metadata
 *     tags: [API Clients]
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
 *               clientName: { type: string, minLength: 3 }
 *               description: { type: string, nullable: true }
 *               allowedIps: { type: array, items: { type: string } }
 *               allowedOrigins: { type: array, items: { type: string } }
 *               expiresOn: { type: string, format: date-time, nullable: true }
 *     responses:
 *       200:
 *         description: API client updated
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/', validate(listQuerySchema, 'query'), controller.getApiClients);
router.post('/', validate(apiClientSchema), controller.createApiClient);
router.get('/:id', validate(idParamSchema, 'params'), controller.getApiClientById);
router.patch('/:id', validate(idParamSchema, 'params'), validate(apiClientUpdateSchema), controller.updateApiClient);

/**
 * @openapi
 * /api/v1/identity-admin/api-clients/{id}/revoke:
 *   patch:
 *     summary: Permanently revoke an API client's credentials (irreversible)
 *     tags: [API Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: API client revoked
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/:id/revoke', controller.revokeApiClient);

/**
 * @openapi
 * /api/v1/identity-admin/api-clients/{id}/deactivate:
 *   patch:
 *     summary: Temporarily suspend an API client (reversible)
 *     tags: [API Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: API client suspended
 *       404: { $ref: '#/components/responses/NotFound' }
 * /api/v1/identity-admin/api-clients/{id}/reactivate:
 *   patch:
 *     summary: Reactivate a suspended API client
 *     tags: [API Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: API client reactivated
 *       404: { $ref: '#/components/responses/NotFound' }
 * /api/v1/identity-admin/api-clients/{id}/rotate-secret:
 *   post:
 *     summary: Rotate the client secret; revokes tokens issued under the old secret
 *     tags: [API Clients]
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
router.patch('/:id/deactivate', controller.deactivateApiClient);
router.patch('/:id/reactivate', controller.reactivateApiClient);
router.post('/:id/rotate-secret', controller.rotateSecret);

module.exports = router;
