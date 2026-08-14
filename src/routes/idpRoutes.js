const express = require('express');
const router = express.Router();
const idpController = require('../controllers/idpController');

/**
 * @swagger
 * tags:
 *   name: Identity Providers
 *   description: Management of Auth0, Okta, Cognito, SAML, and OIDC Identity Providers
 */

/**
 * @swagger
 * /api/v1/identity-admin/identity-providers:
 *   get:
 *     summary: Get all identity providers
 *     tags: [Identity Providers]
 *     responses:
 *       200:
 *         description: List of configured identity providers
 *   post:
 *     summary: Create a new identity provider
 *     tags: [Identity Providers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *               - type
 *             properties:
 *               code:
 *                 type: string
 *                 example: "AUTH0_PRIMARY"
 *               name:
 *                 type: string
 *                 example: "Primary Auth0"
 *               type:
 *                 type: string
 *                 example: "OIDC"
 *               configuration:
 *                 type: object
 *                 properties:
 *                   issuerUrl:
 *                     type: string
 *                     example: "https://example.us.auth0.com/"
 *                   authorizationUrl:
 *                     type: string
 *                     example: "https://example.us.auth0.com/authorize"
 *                   tokenUrl:
 *                     type: string
 *                     example: "https://example.us.auth0.com/oauth/token"
 *                   jwksUrl:
 *                     type: string
 *                     example: "https://example.us.auth0.com/.well-known/jwks.json"
 *                   clientId:
 *                     type: string
 *                     example: "client_12345"
 *                   scopes:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["openid", "profile", "email"]
 *     responses:
 *       201:
 *         description: Identity provider created successfully
 */
router.get('/', idpController.getProviders);
router.post('/', idpController.createProvider);

/**
 * @swagger
 * /api/v1/identity-admin/identity-providers/{id}/test:
 *   post:
 *     summary: Test identity provider configuration connectivity
 *     tags: [Identity Providers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Test results indicating status of issuer, configuration, and JWKS
 */
router.post('/:id/test', idpController.testProvider);

/**
 * @swagger
 * /api/v1/identity-admin/identity-providers/{id}/status:
 *   patch:
 *     summary: Activate or deactivate an identity provider
 *     tags: [Identity Providers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *                 example: "ACTIVE"
 *     responses:
 *       200:
 *         description: Provider status updated successfully
 */
router.patch('/:id/status', idpController.updateStatus);

module.exports = router;