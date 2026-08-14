const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

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
router.get('/', userController.getUsers);
router.post('/', userController.createUser);

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
router.post('/:userId/roles', userController.assignRole);

module.exports = router;