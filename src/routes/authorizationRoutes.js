const express = require('express');
const router = express.Router();
const controller = require('../controllers/authorizationController');

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
router.get('/roles', controller.getRoles);
router.post('/roles', controller.createRole);

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
router.get('/permissions', controller.getPermissions);

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
router.post('/roles/:roleId/permissions', controller.assignPermissionsToRole);

module.exports = router;