const express = require('express');
const router = express.Router();
const controller = require('../controllers/auditController');
const { Joi, validate } = require('../middleware/validate');
const { paginationQuerySchema } = require('../utils/pagination');

const auditListQuerySchema = paginationQuerySchema({
  search: Joi.string().trim().max(150)
});

/**
 * @openapi
 * /api/v1/identity-admin/audit-logs:
 *   get:
 *     summary: List audit log entries for the caller's tenant (paginated, searchable by actor username)
 *     tags: [Audit]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Matches against the acting user's username
 *     responses:
 *       200:
 *         description: Paginated list of audit entries, each joined with the acting user's username and the tenant's name
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       auditId: { type: integer, example: 123 }
 *                       tenantUuid: { type: string, example: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d" }
 *                       tenantName: { type: string, example: "Default Enterprise Tenant" }
 *                       actorUserId: { type: integer, example: 1 }
 *                       username: { type: string, example: "superadmin" }
 *                       action: { type: string, example: "LOGIN" }
 *                       targetResource: { type: string, example: "11111111-2222-3333-4444-555555555555" }
 *                       changes: { type: object, nullable: true }
 *                       ipAddress: { type: string, example: "::1" }
 *                       createdOn: { type: string, format: date-time }
 *                 pagination: { $ref: '#/components/schemas/PaginationMeta' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 */
router.get('/', validate(auditListQuerySchema, 'query'), controller.getAuditLogs);

module.exports = router;
