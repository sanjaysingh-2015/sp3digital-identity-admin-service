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
 *     summary: Retrieve registered machine-to-machine API Clients
 *     tags: [API Clients]
 *     responses:
 *       200:
 *         description: List of API clients
 *   post:
 *     summary: Register a new API Client with custom rate limits
 *     tags: [API Clients]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [clientName]
 *             properties:
 *               clientName: { type: string, example: "Billing Integration Service" }
 *               rateLimit: { type: integer, example: 5000 }
 *               ipWhitelist: { type: array, items: { type: string }, example: ["192.168.1.50"] }
 *     responses:
 *       201:
 *         description: API client registered successfully
 */
router.get('/', validate(listQuerySchema, 'query'), controller.getApiClients);
router.post('/', validate(apiClientSchema), controller.createApiClient);
router.get('/:id', validate(idParamSchema, 'params'), controller.getApiClientById);
router.patch('/:id', validate(idParamSchema, 'params'), validate(apiClientUpdateSchema), controller.updateApiClient);

/**
 * @openapi
 * /api/v1/identity-admin/api-clients/{id}/revoke:
 *   patch:
 *     summary: Revoke an API client key
 *     tags: [API Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: API key revoked successfully
 */
router.patch('/:id/revoke', controller.revokeApiClient);

/**
 * @openapi
 * /api/v1/identity-admin/api-clients/{id}/deactivate:
 *   patch:
 *     summary: Temporarily suspend an API client (reversible)
 *     tags: [API Clients]
 * /api/v1/identity-admin/api-clients/{id}/reactivate:
 *   patch:
 *     summary: Reactivate a suspended API client
 *     tags: [API Clients]
 * /api/v1/identity-admin/api-clients/{id}/rotate-secret:
 *   post:
 *     summary: Rotate the client secret; revokes tokens issued under the old secret
 *     tags: [API Clients]
 */
router.patch('/:id/deactivate', controller.deactivateApiClient);
router.patch('/:id/reactivate', controller.reactivateApiClient);
router.post('/:id/rotate-secret', controller.rotateSecret);

module.exports = router;
