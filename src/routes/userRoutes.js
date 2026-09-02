const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const credentialController = require('../controllers/credentialController');
const { Joi, validate, id } = require('../middleware/validate');
const { paginationQuerySchema } = require('../utils/pagination');

const userListQuerySchema = paginationQuerySchema({
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED'),
  userType: Joi.string().trim().max(50),
  search: Joi.string().trim().max(150)
});
const userRoleParamSchema = Joi.object({ userId: id, userRoleId: id });

const userSchema = Joi.object({
  tenantUuid: Joi.string().trim().min(3).max(200).required(), 
  username: Joi.string().trim().min(3).max(100).required(),
  email: Joi.string().email().max(320).required(),
  firstName: Joi.string().trim().max(100).required(),
  lastName: Joi.string().trim().max(100).required(),
  middleName: Joi.string().trim().max(100).allow("").optional(),
  displayName: Joi.string().trim().max(100).required(),
  phoneCountryCode: Joi.string().trim().max(5).required(),
  phoneNumber: Joi.string().trim().max(20).required(),
  userType: Joi.string().trim().max(50).default('USER')
});

const roleAssignmentSchema = Joi.object({
  roleIds: Joi.array().items(Joi.number().integer().positive()).unique().min(1).required(),
  effectiveFrom: Joi.date().iso().allow(null),
  effectiveTo: Joi.date().iso().min(Joi.ref('effectiveFrom')).allow(null)
});
const passwordSchema = Joi.object({ password: Joi.string().min(8).max(256).required() });
const roleUpdateSchema = Joi.object({
  status: Joi.string().valid('ACTIVE', 'INACTIVE'),
  effectiveFrom: Joi.date().iso().allow(null),
  effectiveTo: Joi.date().iso().min(Joi.ref('effectiveFrom')).allow(null)
}).min(1);

/**
 * @openapi
 * /api/v1/identity-admin/users:
 *   get:
 *     summary: List users for the caller's tenant (paginated, filterable, searchable)
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ACTIVE, INACTIVE, SUSPENDED] }
 *       - in: query
 *         name: userType
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Matches against username, name, and email
 *     responses:
 *       200:
 *         description: Paginated list of users
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
 *     summary: Create a user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tenantUuid, username, email, firstName, lastName, displayName, phoneCountryCode, phoneNumber]
 *             properties:
 *               tenantUuid: { type: string, example: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d" }
 *               username: { type: string, example: "jdoe" }
 *               email: { type: string, format: email, example: "jdoe@example.com" }
 *               firstName: { type: string, example: "John" }
 *               lastName: { type: string, example: "Doe" }
 *               middleName: { type: string, example: "" }
 *               displayName: { type: string, example: "John Doe" }
 *               phoneCountryCode: { type: string, example: "+1" }
 *               phoneNumber: { type: string, example: "5551234567" }
 *               userType: { type: string, default: "USER", example: "USER" }
 *     responses:
 *       201:
 *         description: User created
 *       400: { $ref: '#/components/responses/ValidationError' }
 */
router.get('/', validate(userListQuerySchema, 'query'), userController.getUsers);
router.post('/', validate(userSchema), userController.createUser);

/**
 * @openapi
 * /api/v1/identity-admin/users/{userId}:
 *   patch:
 *     summary: Update a user's profile fields
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tenantUuid, username, email, firstName, lastName, displayName, phoneCountryCode, phoneNumber]
 *             properties:
 *               tenantUuid: { type: string }
 *               username: { type: string }
 *               email: { type: string, format: email }
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               middleName: { type: string }
 *               displayName: { type: string }
 *               phoneCountryCode: { type: string }
 *               phoneNumber: { type: string }
 *               userType: { type: string }
 *     responses:
 *       200:
 *         description: User updated
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/:userId', validate(userSchema), userController.updateUser);

/**
 * @openapi
 * /api/v1/identity-admin/users/{userId}/status:
 *   patch:
 *     summary: Deactivate/soft-delete a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: User status updated
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/:userId/status',  userController.deleteUser)

/**
 * @openapi
 * /api/v1/identity-admin/users/{userId}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User detail object
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:userId', userController.getUserById);

/**
 * @openapi
 * /api/v1/identity-admin/users/{userId}/roles:
 *   get:
 *     summary: Get roles assigned to a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of roles associated with the user
 *       404: { $ref: '#/components/responses/NotFound' }
 *   post:
 *     summary: Assign a role to a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleIds
 *             properties:
 *               roleIds:
 *                 type: array
 *                 items: { type: integer }
 *                 example: [10]
 *               effectiveFrom:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 example: "2026-08-14T00:00:00Z"
 *               effectiveTo:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 example: null
 *     responses:
 *       200:
 *         description: Role(s) assigned successfully
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:userId/roles', userController.getUserRoles);
router.post('/:userId/roles', validate(roleAssignmentSchema), userController.assignRole);

/**
 * @openapi
 * /api/v1/identity-admin/users/{userId}/roles/{userRoleId}:
 *   patch:
 *     summary: Update a user's role assignment (status or effective dates)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: userRoleId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               status: { type: string, enum: [ACTIVE, INACTIVE] }
 *               effectiveFrom: { type: string, format: date-time, nullable: true }
 *               effectiveTo: { type: string, format: date-time, nullable: true }
 *     responses:
 *       200:
 *         description: Role assignment updated
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/:userId/roles/:userRoleId', validate(userRoleParamSchema, 'params'), validate(roleUpdateSchema), userController.updateUserRole);

/**
 * @openapi
 * /api/v1/identity-admin/users/{userId}/password:
 *   put:
 *     summary: Set/change a user's password
 *     tags: [Credentials]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password: { type: string, format: password, minLength: 8, example: "S3curePass!23" }
 *     responses:
 *       200:
 *         description: Password updated
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       422:
 *         description: Password fails the tenant's security policy (complexity/reuse)
 *   delete:
 *     summary: Revoke the user's password credential (blocks password login)
 *     tags: [Credentials]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Credential revoked
 *       404: { $ref: '#/components/responses/NotFound' }
 * /api/v1/identity-admin/users/{userId}/password/rotate:
 *   post:
 *     summary: Administrative forced password rotation (flags rotation_required)
 *     tags: [Credentials]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password: { type: string, format: password, minLength: 8 }
 *     responses:
 *       200:
 *         description: Password rotated; rotation_required flag set
 *       400: { $ref: '#/components/responses/ValidationError' }
 * /api/v1/identity-admin/users/{userId}/password/status:
 *   get:
 *     summary: Get password credential lifecycle status (expiry, lock, rotation flag)
 *     tags: [Credentials]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: "{ expiresOn, locked, lockedUntil, rotationRequired }"
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.put('/:userId/password', validate(passwordSchema), credentialController.setPassword);
router.post('/:userId/password/rotate', validate(passwordSchema), credentialController.rotatePassword);
router.delete('/:userId/password', credentialController.revokeCredential);
router.get('/:userId/password/status', credentialController.getCredentialStatus);

module.exports = router;
