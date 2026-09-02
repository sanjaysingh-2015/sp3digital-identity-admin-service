const express = require("express");
const router = express.Router();
const tenantController = require("../controllers/tenantController");
const { paginationQuerySchema } = require('../utils/pagination');

// Route path relative to /api/v1/identity-admin

/**
 * @openapi
 * /api/v1/identity-admin/tenants/list:
 *   get:
 *     summary: List active tenants for dropdowns (always status=ACTIVE; not paginated)
 *     tags: [Tenants]
 *     responses:
 *       200:
 *         description: List of active tenants
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 count: { type: integer, example: 3 }
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
router.get("/list", tenantController.getTenants);

/**
 * @openapi
 * /api/v1/identity-admin/tenants:
 *   get:
 *     summary: List tenants (paginated, filterable by status, searchable)
 *     tags: [Tenants]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ACTIVE, INACTIVE, DISABLED, DELETED] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated list of tenants
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
 *                       tenantUuid: { type: string }
 *                       tenantCode: { type: string }
 *                       tenantName: { type: string }
 *                       status: { type: string, example: "ACTIVE" }
 *                       createdOn: { type: string, format: date-time }
 *                       modifiedOn: { type: string, format: date-time }
 *                 pagination: { $ref: '#/components/schemas/PaginationMeta' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *   post:
 *     summary: Create a tenant
 *     tags: [Tenants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenantName
 *             properties:
 *               tenantName:
 *                 type: string
 *                 maxLength: 250
 *                 example: "Acme Health"
 *     responses:
 *       201:
 *         description: Tenant created
 *       400: { $ref: '#/components/responses/ValidationError' }
 */
router.get("/", tenantController.getTenantList);
router.post("", tenantController.createTenant);

/**
 * @openapi
 * /api/v1/identity-admin/tenants/{tenantUuid}:
 *   get:
 *     summary: Get a tenant by UUID
 *     tags: [Tenants]
 *     parameters:
 *       - in: path
 *         name: tenantUuid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Tenant detail object
 *       404: { $ref: '#/components/responses/NotFound' }
 *   put:
 *     summary: Update a tenant's name
 *     tags: [Tenants]
 *     parameters:
 *       - in: path
 *         name: tenantUuid
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tenantName: { type: string, maxLength: 250 }
 *     responses:
 *       200:
 *         description: Tenant updated
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     summary: Delete a tenant
 *     tags: [Tenants]
 *     parameters:
 *       - in: path
 *         name: tenantUuid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Tenant deleted
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/:tenantUuid", tenantController.getTenantById);
router.put("/:tenantUuid", tenantController.updateTenant);
router.delete("/:tenantUuid", tenantController.deleteTenant);

/**
 * @openapi
 * /api/v1/identity-admin/tenants/{tenantUuid}/status:
 *   patch:
 *     summary: Update a tenant's status
 *     tags: [Tenants]
 *     parameters:
 *       - in: path
 *         name: tenantUuid
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [ACTIVE, INACTIVE, DISABLED, DELETED] }
 *     responses:
 *       200:
 *         description: Tenant status updated
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch("/:tenantUuid/status", tenantController.updateStatus);

module.exports = router;
