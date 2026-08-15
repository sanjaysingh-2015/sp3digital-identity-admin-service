const express = require('express');
const router = express.Router();
const controller = require('../controllers/oAuthClientController');
const { Joi, validate } = require('../middleware/validate');

const oauthClientSchema = Joi.object({
  clientName: Joi.string().trim().min(3).max(150).required(),
  clientType: Joi.string().valid('CONFIDENTIAL', 'PUBLIC').default('CONFIDENTIAL'),
  grantTypes: Joi.array().items(Joi.string().valid('authorization_code', 'refresh_token', 'client_credentials')).unique().min(1).default(['authorization_code']),
  redirectUris: Joi.array().items(Joi.string().uri({ scheme: ['https'] })).unique().max(20).default([])
});

/**
 * @openapi
 * /api/v1/identity-admin/oauth/clients:
 *   get:
 *     summary: Retrieve registered OAuth & API Clients
 *     tags: [OAuth/OIDC Clients]
 *     responses:
 *       200:
 *         description: List of registered clients
 *   post:
 *     summary: Register a new OAuth/OIDC client application
 *     tags: [OAuth/OIDC Clients]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [clientName]
 *             properties:
 *               clientName: { type: string, example: "Patient Portal Web App" }
 *               clientType: { type: string, example: "CONFIDENTIAL" }
 *               grantTypes: { type: array, items: { type: string }, example: ["authorization_code", "refresh_token"] }
 *               redirectUris: { type: array, items: { type: string }, example: ["https://app.example.com/callback"] }
 *     responses:
 *       201:
 *         description: OAuth Client created successfully
 */
router.get('/clients', controller.getClients);
router.post('/clients', validate(oauthClientSchema), controller.createClient);

/**
 * @openapi
 * /api/v1/identity-admin/oauth/clients/{id}/revoke:
 *   patch:
 *     summary: Revoke an OAuth client
 *     tags: [OAuth/OIDC Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Client revoked successfully
 */
router.patch('/clients/:id/revoke', controller.revokeClient);

module.exports = router;
