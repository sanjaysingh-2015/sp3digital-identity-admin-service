const express = require('express');
const router = express.Router();
const controller = require('../controllers/auditController');

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
router.get('/', controller.getAuditLogs);

module.exports = router;