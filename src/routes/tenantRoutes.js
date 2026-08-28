const express = require("express");
const router = express.Router();
const tenantController = require("../controllers/tenantController");
const { paginationQuerySchema } = require('../utils/pagination');

// Route path relative to /api/v1/identity-admin
/**
 * @openapi
 * /api/v1/identity-admin/tenants/list:
 *   get:
 *     summary: List active tenants (always status=ACTIVE; no query filters are currently applied)
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
 *     summary: List tenant entries for the caller's tenant (paginated, searchable by actor username)
 *     tags: [Tenants]
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
 *                       tenantUuid: { type: string }
 *                       tenantCode: { type: string }
 *                       tenantName: { type: string }
 *                       status: { type: string, example: "ACTIVE" }
 *                       createdOn: { type: string, format: date-time }
 *                       modifiedOn: { type: string, format: date-time }
 *                 pagination: { $ref: '#/components/schemas/PaginationMeta' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 */
router.get("/", tenantController.getTenantList);

/**
 * @openapi 
 * /api/v1/identity-admin/tenants/{tenantUuid}:
 *   get:
 *     summary: Get an identity provider by ID
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
 */
router.get("/:tenantUuid", tenantController.getTenantById);

/**
 * @openapi
 * /api/v1/identity-admin/tenants:
 *   post:
 *     summary: Create an identity provider
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
 *                 example: "Primary Auth0"
 *     responses:
 *       201:
 *         description: Tenant created
 *       400: { $ref: '#/components/responses/ValidationError' }
 */
router.post("", tenantController.createTenant);

/** 
 * @openapi
 * /api/v1/identity-admin/tenants/{tenantUuid}:
 *   put:
 *     summary: Replace an tenant's info
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
 *             required: [code, name, type]
 *             properties:
 *               tenantCode: { type: string, pattern: '^[A-Z0-9_]+$' }
 *               tenantName: { type: string }
  *     responses:
 *       200:
 *         description: Tenant updated
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.put("/:tenantUuid", tenantController.updateTenant);

/** 
 * @openapi
 * /api/v1/identity-admin/tenants/{tenantUuid}:
 *   delete:
 *     summary: Delete an tenant
 *     tags: [Tenants]
 *     parameters:
 *       - in: path
 *         name: tenantUuid
 *         required: true
 *         schema: { type: string}
 *     responses:
 *       200:
 *         description: Tenant deleted
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete("/:tenantUuid", tenantController.deleteTenant);

/** 
 * @openapi
 * /api/v1/identity-admin/tenants/{tenantUuid}/status:
 *   patch:
 *     summary: Update an tenant's status
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
 *               status: { type: string,  enum: [ACTIVE, INACTIVE, DISABLED] }
  *     responses:
 *       200:
 *         description: Tenant updated
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch("/:tenantUuid/status", tenantController.updateStatus);

module.exports = router;
