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
 *     summary: Retrieve all roles
 *     tags: [Authorization]
 *     responses:
 *       200:
 *         description: List of defined roles
 *   post:
 *     summary: Create a new system role
 *     tags: [Authorization]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roleCode, roleName]
 *             properties:
 *               roleCode: { type: string, example: "ROLE_TENANT_ADMIN" }
 *               roleName: { type: string, example: "Tenant Administrator" }
 *               description: { type: string, example: "Full access within tenant boundary" }
 *     responses:
 *       201:
 *         description: Role created successfully
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
 *     summary: Retrieve system permissions and scopes
 *     tags: [Authorization]
 *     responses:
 *       200:
 *         description: List of permissions
 */
router.get('/permissions', validate(permissionListQuerySchema, 'query'), controller.getPermissions);
router.get('/permissions/:permissionId', controller.getPermissionById);
router.post('/permissions', validate(permissionSchema), controller.createPermission);
router.patch('/permissions/:permissionId', validate(permissionEditSchema), controller.updatePermission);
router.patch('/permissions/:permissionId/status',  controller.deletePermission)
/**
 * @openapi
 * /api/v1/identity-admin/roles/{roleId}/permissions:
 *   post:
 *     summary: Assign permissions to a role
 *     tags: [Authorization]
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
 *             properties:
 *               permissionIds:
 *                 type: array
 *                 items: { type: integer }
 *                 example: [1, 2, 5]
 *     responses:
 *       200:
 *         description: Permissions successfully assigned
 */
router.post('/roles/:roleId/permissions', validate(permissionAssignmentSchema), controller.assignPermissionsToRole);
router.patch('/roles/:roleId/permissions', validate(permissionAssignmentUpdateSchema), controller.revokePermissionsToRole);
router.get('/roles/:roleId/permissions', controller.getRolePermissions);

module.exports = router;
