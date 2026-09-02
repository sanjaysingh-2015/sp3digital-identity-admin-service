const express = require('express');
const router = express.Router();
const controller = require('../controllers/authorizationController');
const { Joi, validate } = require('../middleware/validate');
const { paginationQuerySchema } = require('../utils/pagination');

const roleListQuerySchema = paginationQuerySchema({
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'DELETED'),
  search: Joi.string().trim().max(150)
});

const permissionListQuerySchema = paginationQuerySchema({
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'DELETED'),
  search: Joi.string().trim().max(150)
});

const roleSchema = Joi.object({
  roleType: Joi.string().trim().pattern(/^[A-Z0-9_]+$/).max(100).required(),
  roleName: Joi.string().trim().max(150).required(),
  description: Joi.string().trim().max(500).allow('', null),
  status: Joi.string().valid('ACTIVE', 'INACTIVE').default('ACTIVE')
});

const permissionSchema = Joi.object({
  resourceCategory: Joi.string().trim().max(100).required(),
  resources: Joi.array().items(Joi.string().trim().max(100)).min(1).required(),
  actionCategory: Joi.string().trim().max(100).required(),
  actions: Joi.array().items(Joi.string().trim().max(100)).min(1).required(),
  permissionName: Joi.string().trim().max(150).required(),
  description: Joi.string().trim().max(500).allow('', null),
  status: Joi.string().valid('ACTIVE', 'INACTIVE').default('ACTIVE'),
  allowDuplicates: Joi.boolean().default(false)
});

const permissionEditSchema = Joi.object({
  resourceCategory: Joi.string().trim().max(100).required(),
  resource: Joi.string().trim().max(100).required(),
  actionCategory: Joi.string().trim().max(100).required(),
  action: Joi.string().trim().max(100).required(),
  permissionName: Joi.string().trim().max(150).required(),
  description: Joi.string().trim().max(500).allow('', null),
  status: Joi.string().valid('ACTIVE', 'INACTIVE').default('ACTIVE'),
  allowDuplicates: Joi.boolean().default(false)
});

const permissionAssignmentSchema = Joi.object({
  permissionIds: Joi.array().items(Joi.number().integer().positive()).unique().min(1).required()
});

const permissionAssignmentUpdateSchema = Joi.object({
  permissionIds: Joi.array().items(Joi.number().integer().positive()).unique().min(1).required()
});

/**
 * @openapi
 * /api/v1/identity-admin/authorization/roles:
 *   get:
 *     summary: List roles (paginated, filterable, searchable)
 *     tags: [Roles]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ACTIVE, INACTIVE, DELETED] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Matches against role name and description
 *     responses:
 *       200:
 *         description: Paginated list of roles
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
 *     summary: Create a role
 *     tags: [Roles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roleType, roleName]
 *             properties:
 *               roleType: { type: string, pattern: '^[A-Z0-9_]+$', example: "TENANT_ADMIN" }
 *               roleName: { type: string, example: "Tenant Administrator" }
 *               description: { type: string, nullable: true, example: "Full access within tenant boundary" }
 *               status: { type: string, enum: [ACTIVE, INACTIVE], default: ACTIVE }
 *     responses:
 *       201:
 *         description: Role created
 *       400: { $ref: '#/components/responses/ValidationError' }
 * /api/v1/identity-admin/authorization/roles/{roleId}:
 *   get:
 *     summary: Get a role by ID
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Role detail object
 *       404: { $ref: '#/components/responses/NotFound' }
 *   patch:
 *     summary: Update a role
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roleType, roleName]
 *             properties:
 *               roleType: { type: string, pattern: '^[A-Z0-9_]+$' }
 *               roleName: { type: string }
 *               description: { type: string, nullable: true }
 *               status: { type: string, enum: [ACTIVE, INACTIVE] }
 *     responses:
 *       200:
 *         description: Role updated
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       404: { $ref: '#/components/responses/NotFound' }
 * /api/v1/identity-admin/authorization/roles/{roleId}/status:
 *   patch:
 *     summary: Deactivate/soft-delete a role
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Role status updated
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/roles', validate(roleListQuerySchema, 'query'), controller.getRoles);
router.get('/roles/:roleId', controller.getRoleById);
router.post('/roles', validate(roleSchema), controller.createRole);
router.patch('/roles/:roleId', validate(roleSchema), controller.updateRole);
router.patch('/roles/:roleId/status',  controller.deleteRole)

/**
 * @openapi
 * /api/v1/identity-admin/authorization/permissions:
 *   get:
 *     summary: List permissions (paginated, filterable, searchable)
 *     tags: [Permissions]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ACTIVE, INACTIVE, DELETED] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Matches against permission name, description, resource, and action
 *     responses:
 *       200:
 *         description: Paginated list of permissions
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
 *     summary: >
 *       Create one or more permissions. resources × actions are combined
 *       pairwise (a "resources" array with an "actions" array creates a
 *       permission for each combination) — see allowDuplicates to control
 *       whether existing resource/action pairs are skipped or re-created.
 *     tags: [Permissions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [resourceCategory, resources, actionCategory, actions, permissionName]
 *             properties:
 *               resourceCategory: { type: string, example: "USER_MANAGEMENT" }
 *               resources:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["users"]
 *               actionCategory: { type: string, example: "CRUD" }
 *               actions:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["read", "write"]
 *               permissionName: { type: string, example: "Manage Users" }
 *               description: { type: string, nullable: true }
 *               status: { type: string, enum: [ACTIVE, INACTIVE], default: ACTIVE }
 *               allowDuplicates: { type: boolean, default: false }
 *     responses:
 *       201:
 *         description: Permission(s) created
 *       400: { $ref: '#/components/responses/ValidationError' }
 * /api/v1/identity-admin/authorization/permissions/{permissionId}:
 *   get:
 *     summary: Get a permission by ID
 *     tags: [Permissions]
 *     parameters:
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Permission detail object
 *       404: { $ref: '#/components/responses/NotFound' }
 *   patch:
 *     summary: Update a permission
 *     tags: [Permissions]
 *     parameters:
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [resourceCategory, resource, actionCategory, action, permissionName]
 *             properties:
 *               resourceCategory: { type: string }
 *               resource: { type: string }
 *               actionCategory: { type: string }
 *               action: { type: string }
 *               permissionName: { type: string }
 *               description: { type: string, nullable: true }
 *               status: { type: string, enum: [ACTIVE, INACTIVE] }
 *               allowDuplicates: { type: boolean, default: false }
 *     responses:
 *       200:
 *         description: Permission updated
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       404: { $ref: '#/components/responses/NotFound' }
 * /api/v1/identity-admin/authorization/permissions/{permissionId}/status:
 *   patch:
 *     summary: Deactivate/soft-delete a permission
 *     tags: [Permissions]
 *     parameters:
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Permission status updated
 *       404: { $ref: '#/components/responses/NotFound' }
 */
//router.get('/permissions', validate(permissionListQuerySchema, 'query'), controller.getPermissions);
router.get('/permissions', controller.getPermissions);
router.get('/permissions/:permissionId', controller.getPermissionById);
router.post('/permissions', validate(permissionSchema), controller.createPermission);
router.patch('/permissions/:permissionId', validate(permissionEditSchema), controller.updatePermission);
router.patch('/permissions/:permissionId/status',  controller.deletePermission)

/**
 * @openapi
 * /api/v1/identity-admin/authorization/roles/{roleId}/permissions:
 *   get:
 *     summary: Get permissions assigned to a role
 *     tags: [Permissions]
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: List of permissions assigned to the role
 *       404: { $ref: '#/components/responses/NotFound' }
 *   post:
 *     summary: Assign permissions to a role
 *     tags: [Permissions]
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [permissionIds]
 *             properties:
 *               permissionIds:
 *                 type: array
 *                 items: { type: integer }
 *                 example: [1, 2, 5]
 *     responses:
 *       200:
 *         description: Permissions assigned successfully
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   patch:
 *     summary: Revoke permissions from a role
 *     tags: [Permissions]
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [permissionIds]
 *             properties:
 *               permissionIds:
 *                 type: array
 *                 items: { type: integer }
 *                 example: [2]
 *     responses:
 *       200:
 *         description: Permissions revoked successfully
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post('/roles/:roleId/permissions', validate(permissionAssignmentSchema), controller.assignPermissionsToRole);
router.patch('/roles/:roleId/permissions', validate(permissionAssignmentUpdateSchema), controller.revokePermissionsToRole);
router.get('/roles/:roleId/permissions', controller.getRolePermissions);

module.exports = router;
