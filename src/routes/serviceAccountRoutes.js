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
 *     summary: List service accounts (paginated, filterable)
 *     tags: [Service Accounts]
 *   post:
 *     summary: Create new Service Account (provisions a backing API client)
 *     tags: [Service Accounts]
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
 * /api/v1/identity-admin/service-accounts/{id}/reactivate:
 *   patch:
 *     summary: Reactivate a suspended service account
 *     tags: [Service Accounts]
 * /api/v1/identity-admin/service-accounts/{id}/revoke:
 *   patch:
 *     summary: Permanently revoke a service account and its backing client
 *     tags: [Service Accounts]
 * /api/v1/identity-admin/service-accounts/{id}/rotate-secret:
 *   post:
 *     summary: Rotate the backing API client's secret; revokes outstanding tokens
 *     tags: [Service Accounts]
 */
router.patch('/:id/deactivate', controller.deactivateAccount);
router.patch('/:id/reactivate', controller.reactivateAccount);
router.patch('/:id/revoke', controller.revokeAccount);
router.post('/:id/rotate-secret', controller.rotateSecret);

module.exports = router;
