const express = require('express');
const router = express.Router();
const controller = require('../controllers/auditController');
const { Joi, validate } = require('../middleware/validate');

const paginationSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(500).default(100),
  offset: Joi.number().integer().min(0).default(0)
});

/**
 * @openapi
 * /api/v1/identity-admin/audit-logs:
 *   get:
 *     summary: Retrieve system administrative audit logs
 *     tags: [Audit]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 100 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: Audit log records
 */
router.get('/', validate(paginationSchema, 'query'), controller.getAuditLogs);

module.exports = router;
