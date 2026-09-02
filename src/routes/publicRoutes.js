const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// Route path relative to /api/v1/identity-admin
/**
 * @openapi
 * /api/v1/identity-admin/public/tenants/search:
 *   get:
 *     summary: Unauthenticated tenant lookup by name substring (always status=ACTIVE). Used by the login screen to resolve tenantUuid from a tenant name.
 *     tags: [Public]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Case-insensitive substring match against tenant name. Omit to list all active tenants.
 *     responses:
 *       200:
 *         description: Matching active tenants
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 count: { type: integer, example: 1 }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       tenantUuid: { type: string }
 *                       tenantCode: { type: string }
 *                       tenantName: { type: string }
 *                       status: { type: string, example: "ACTIVE" }
 *                       createdOn: { type: string, format: date-time }
 *                       modifiedOn: { type: string, format: date-time }
 *       500:
 *         description: Unexpected error fetching tenants
 */
router.get('/public/tenants/search', publicController.searchTenants);

module.exports = router;