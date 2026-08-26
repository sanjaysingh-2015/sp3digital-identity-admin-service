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
 * @swagger
 * tags:
 *   name: User Administration
 *   description: Administrative APIs for users and user role assignments
 */

/**
 * @swagger
 * /api/v1/identity-admin/users:
 *   get:
 *     summary: Retrieve list of users
 *     tags: [User Administration]
 *     responses:
 *       200:
 *         description: List of registered system users
 *   post:
 *     summary: Create a new user
 *     tags: [User Administration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - firstName
 *               - lastName
 *             properties:
 *               username:
 *                 type: string
 *                 example: "jdoe"
 *               email:
 *                 type: string
 *                 example: "jdoe@example.com"
 *               firstName:
 *                 type: string
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               userType:
 *                 type: string
 *                 example: "USER"
 *     responses:
 *       201:
 *         description: User created successfully
 */
router.get('/', validate(userListQuerySchema, 'query'), userController.getUsers);
router.post('/', validate(userSchema), userController.createUser);
router.patch('/:userId', validate(userSchema), userController.updateUser);
router.patch('/:userId/status',  userController.deleteUser)

/**
 * @swagger
 * /api/v1/identity-admin/users/{userId}:
 *   get:
 *     summary: Get user details by user ID
 *     tags: [User Administration]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User detail object
 *       404:
 *         description: User not found
 */
router.get('/:userId', userController.getUserById);

/**
 * @swagger
 * /api/v1/identity-admin/users/{userId}/roles:
 *   get:
 *     summary: Get roles assigned to a user
 *     tags: [User Administration]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of roles associated with the user
 *   post:
 *     summary: Assign a role to a user
 *     tags: [User Administration]
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
 *               - roleId
 *             properties:
 *               roleId:
 *                 type: integer
 *                 example: 10
 *               effectiveFrom:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-08-14T00:00:00Z"
 *               effectiveTo:
 *                 type: string
 *                 format: date-time
 *                 example: null
 *     responses:
 *       200:
 *         description: Role assigned successfully
 */
router.get('/:userId/roles', userController.getUserRoles);
router.post('/:userId/roles', validate(roleAssignmentSchema), userController.assignRole);
router.patch('/:userId/roles/:userRoleId', validate(userRoleParamSchema, 'params'), validate(roleUpdateSchema), userController.updateUserRole);

/**
 * @openapi
 * /api/v1/identity-admin/users/{userId}/password:
 *   put:
 *     summary: Set/change a user's password
 *     tags: [Credentials]
 *   delete:
 *     summary: Revoke the user's password credential (blocks password login)
 *     tags: [Credentials]
 * /api/v1/identity-admin/users/{userId}/password/rotate:
 *   post:
 *     summary: Administrative forced password rotation (flags rotation_required)
 *     tags: [Credentials]
 * /api/v1/identity-admin/users/{userId}/password/status:
 *   get:
 *     summary: Get password credential lifecycle status (expiry, lock, rotation flag)
 *     tags: [Credentials]
 */
router.put('/:userId/password', validate(passwordSchema), credentialController.setPassword);
router.post('/:userId/password/rotate', validate(passwordSchema), credentialController.rotatePassword);
router.delete('/:userId/password', credentialController.revokeCredential);
router.get('/:userId/password/status', credentialController.getCredentialStatus);

module.exports = router;
