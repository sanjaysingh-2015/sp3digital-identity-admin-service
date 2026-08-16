const express = require('express');
const router = express.Router();
const controller = require('../controllers/oAuthClientController');
const { Joi, validate, id } = require('../middleware/validate');
const { paginationQuerySchema } = require('../utils/pagination');

const oauthClientSchema = Joi.object({
  clientName: Joi.string().trim().min(3).max(150).required(),
  clientType: Joi.string().valid('CONFIDENTIAL', 'PUBLIC').default('CONFIDENTIAL'),
  grantTypes: Joi.array().items(Joi.string().valid('authorization_code', 'refresh_token', 'client_credentials')).unique().min(1).default(['authorization_code']),
  redirectUris: Joi.array().items(Joi.string().uri({ scheme: ['https'] })).unique().max(20).default([]),
  expiresOn: Joi.date().iso().greater('now').allow(null)
});

const oauthClientUpdateSchema = Joi.object({
  clientName: Joi.string().trim().min(3).max(150),
  grantTypes: Joi.array().items(Joi.string().valid('authorization_code', 'refresh_token', 'client_credentials')).unique().min(1),
  redirectUris: Joi.array().items(Joi.string().uri({ scheme: ['https'] })).unique().max(20),
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
 * /api/v1/identity-admin/oauth/clients:
 *   get:
 *     summary: Retrieve registered OAuth & API Clients (paginated, filterable)
 *     tags: [OAuth/OIDC Clients]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ACTIVE, SUSPENDED, EXPIRED, REVOKED] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated list of registered clients
 *   post:
 *     summary: Register a new OAuth/OIDC client application
 *     tags: [OAuth/OIDC Clients]
 *     responses:
 *       201:
 *         description: OAuth Client created successfully
 */
router.get('/clients', validate(listQuerySchema, 'query'), controller.getClients);
router.post('/clients', validate(oauthClientSchema), controller.createClient);
router.get('/clients/:id', validate(idParamSchema, 'params'), controller.getClientById);
router.patch('/clients/:id', validate(idParamSchema, 'params'), validate(oauthClientUpdateSchema), controller.updateClient);

/**
 * @openapi
 * /api/v1/identity-admin/oauth/clients/{id}/revoke:
 *   patch:
 *     summary: Revoke an OAuth client (terminal; revokes its tokens)
 *     tags: [OAuth/OIDC Clients]
 * /api/v1/identity-admin/oauth/clients/{id}/deactivate:
 *   patch:
 *     summary: Temporarily suspend an OAuth client (reversible)
 *     tags: [OAuth/OIDC Clients]
 * /api/v1/identity-admin/oauth/clients/{id}/reactivate:
 *   patch:
 *     summary: Reactivate a suspended OAuth client
 *     tags: [OAuth/OIDC Clients]
 * /api/v1/identity-admin/oauth/clients/{id}/rotate-secret:
 *   post:
 *     summary: Rotate the client secret; revokes access & refresh tokens issued under the old secret
 *     tags: [OAuth/OIDC Clients]
 */
router.patch('/clients/:id/revoke', controller.revokeClient);
router.patch('/clients/:id/deactivate', controller.deactivateClient);
router.patch('/clients/:id/reactivate', controller.reactivateClient);
router.post('/clients/:id/rotate-secret', controller.rotateSecret);

module.exports = router;
