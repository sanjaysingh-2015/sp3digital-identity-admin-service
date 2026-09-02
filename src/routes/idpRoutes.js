const express = require('express');
const router = express.Router();
const idpController = require('../controllers/idpController');
const { Joi, validate } = require('../middleware/validate');

const providerSchema = Joi.object({
  code: Joi.string().trim().pattern(/^[A-Z0-9_]+$/).max(100).required(),
  name: Joi.string().trim().max(150).required(),
  type: Joi.string().valid('OIDC', 'SAML', 'AUTH0', 'OKTA', 'COGNITO', 'AZURE_AD').required(),
  configuration: Joi.object({
    issuerUrl: Joi.string().uri().allow('', null),
    authorizationUrl: Joi.string().uri().allow('', null),
    tokenUrl: Joi.string().uri().allow('', null),
    jwksUrl: Joi.string().uri().allow('', null),
    clientId: Joi.string().trim().max(255).allow('', null),
    scopes: Joi.array().items(Joi.string().trim().max(100)).unique().max(50).default([])
  }).default({})
});

const statusSchema = Joi.object({ status: Joi.string().valid('ACTIVE', 'INACTIVE').required() });

/**
 * @openapi
 * /api/v1/identity-admin/identity-providers:
 *   get:
 *     summary: List identity providers (paginated, filterable, searchable)
 *     tags: [Identity Providers]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ACTIVE, INACTIVE, DISABLED] }
 *       - in: query
 *         name: providerType
 *         schema: { type: string, enum: [OIDC, SAML, OAUTH2, LDAP] }
 *       - in: query
 *         name: tenantUuid
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Matches against provider name and provider type
 *     responses:
 *       200:
 *         description: Paginated list of identity providers. client_secret_encrypted is never returned.
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
 *     summary: Create an identity provider
 *     tags: [Identity Providers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - providerName
 *               - providerType
 *             properties:
 *               tenantUuid:
 *                 type: string
 *               providerCode:
 *                 type: string
 *                 maxLength: 100
 *                 description: Auto-generated from providerName if omitted
 *                 example: "IDP_AUTH0_PRIMARY"
 *               providerName:
 *                 type: string
 *                 maxLength: 250
 *                 example: "Primary Auth0"
 *               providerType:
 *                 type: string
 *                 enum: [OIDC, SAML, OAUTH2, LDAP]
 *                 example: "OIDC"
 *               issuerUrl:
 *                 type: string
 *                 example: "https://example.us.auth0.com/"
 *               authorizationUrl:
 *                 type: string
 *                 example: "https://example.us.auth0.com/authorize"
 *               tokenUrl:
 *                 type: string
 *                 example: "https://example.us.auth0.com/oauth/token"
 *               jwksUrl:
 *                 type: string
 *                 example: "https://example.us.auth0.com/.well-known/jwks.json"
 *               clientId:
 *                 type: string
 *                 example: "client_12345"
 *               clientSecret:
 *                 type: string
 *                 description: Write-only. Encrypted at rest; never returned by any endpoint.
 *               scopes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["openid", "profile", "email"]
 *               configuration:
 *                 type: object
 *                 description: Free-form additional provider-specific settings
 *     responses:
 *       201:
 *         description: Identity provider created
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       409:
 *         description: providerCode or providerName already in use for this tenant
 * /api/v1/identity-admin/identity-providers/{identityProviderId}:
 *   get:
 *     summary: Get an identity provider by ID
 *     tags: [Identity Providers]
 *     parameters:
 *       - in: path
 *         name: identityProviderId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Identity provider detail object
 *       404: { $ref: '#/components/responses/NotFound' }
 *   put:
 *     summary: Replace an identity provider's configuration
 *     tags: [Identity Providers]
 *     parameters:
 *       - in: path
 *         name: identityProviderId
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
 *               providerCode: { type: string, maxLength: 100 }
 *               providerName: { type: string, maxLength: 250 }
 *               providerType: { type: string, enum: [OIDC, SAML, OAUTH2, LDAP] }
 *               issuerUrl: { type: string }
 *               authorizationUrl: { type: string }
 *               tokenUrl: { type: string }
 *               jwksUrl: { type: string }
 *               clientId: { type: string }
 *               clientSecret: { type: string, description: Write-only; omit to leave unchanged }
 *               scopes: { type: array, items: { type: string } }
 *               configuration: { type: object }
 *     responses:
 *       200:
 *         description: Identity provider updated
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409:
 *         description: providerCode or providerName already in use for this tenant
 *   delete:
 *     summary: Delete an identity provider
 *     tags: [Identity Providers]
 *     parameters:
 *       - in: path
 *         name: identityProviderId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Identity provider deleted
 *       404: { $ref: '#/components/responses/NotFound' }
 * /api/v1/identity-admin/identity-providers/{identityProviderId}/status:
 *   patch:
 *     summary: Activate or deactivate an identity provider
 *     tags: [Identity Providers]
 *     parameters:
 *       - in: path
 *         name: identityProviderId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [ACTIVE, INACTIVE, DISABLED], example: "ACTIVE" }
 *     responses:
 *       200:
 *         description: Provider status updated
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/', idpController.getIdentityProviders);
router.get('/:identityProviderId', idpController.getIdentityProviderById);
router.post('', idpController.createIdentityProvider);
router.put('/:identityProviderId', idpController.updateIdentityProvider);
router.delete('/:identityProviderId', idpController.deleteIdentityProvider);
router.patch('/:identityProviderId/status', idpController.updateStatus);

/**
 * @openapi
 * /api/v1/identity-admin/identity-providers/{id}/test:
 *   post:
 *     summary: Test identity provider configuration connectivity (issuer reachability, JWKS fetch)
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
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post('/:id/test', idpController.testProvider);

module.exports = router;
