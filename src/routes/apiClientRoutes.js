const express = require('express');
const router = express.Router();
const controller = require('../controllers/apiClientController');

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
router.get('/', controller.getApiClients);
router.post('/', controller.createApiClient);

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

module.exports = router;