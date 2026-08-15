const express = require('express');
const router = express.Router();
const controller = require('../controllers/oAuthClientController');

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
router.post('/clients', controller.createClient);

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