const express = require('express');
const router = express.Router();
const controller = require('../controllers/serviceAccountController');
const { Joi, validate } = require('../middleware/validate');

const serviceAccountSchema = Joi.object({
  accountName: Joi.string().trim().min(3).max(150).required(),
  serviceCode: Joi.string().trim().pattern(/^[A-Z0-9_]+$/).max(100),
  description: Joi.string().trim().max(500).allow('', null),
  organizationId: Joi.number().integer().positive(),
  expiresOn: Joi.date().iso().greater('now')
});

/**
 * @openapi
 * /api/v1/identity-admin/service-accounts:
 *   get:
 *     summary: List service accounts
 *     tags: [Service Accounts]
 *     responses:
 *       200:
 *         description: List of backend service identities
 *   post:
 *     summary: Create new Service Account
 *     tags: [Service Accounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [accountName]
 *             properties:
 *               accountName: { type: string, example: "Analytics-Sync-Service" }
 *               description: { type: string, example: "Machine-to-machine sync service" }
 *     responses:
 *       201:
 *         description: Service account created
 */
router.get('/', controller.getAccounts);
router.post('/', validate(serviceAccountSchema), controller.createAccount);

module.exports = router;
