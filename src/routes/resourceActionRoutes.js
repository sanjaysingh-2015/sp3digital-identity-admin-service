const express = require("express");

const router = express.Router();

const resourceActionController =
  require("../controllers/resourceActionController");

// const authenticate =
//   require("../middleware/authentication");

// const authorize =
//   require("../middleware/authorization");

// Tag ("Resource Actions") is registered globally in src/config/swagger.js

// =========================================================
// RESOURCE MASTER
// =========================================================

/**
 * @openapi
 * /api/v1/identity-admin/resources/categories:
 *   get:
 *     summary: Get resource categories
 *     description: Returns all distinct active resource categories.
 *     tags:
 *       - Resource Actions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resource categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *               example:
 *                 - IDENTITY
 *                 - AUTHENTICATION
 *                 - AUTHORIZATION
 *                 - USER MANAGEMENT
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/resources/categories",
  resourceActionController.getResourceCategories
);


/**
 * @openapi
 * /api/v1/identity-admin/resources:
 *   get:
 *     summary: Get resources
 *     description: Returns a paginated list of resources.
 *     tags:
 *       - Resource Actions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number.
 *
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of records per page.
 *
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           example: ACTIVE
 *         description: Resource status.
 *
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: USER
 *         description: Search resource name or description.
 *
 *     responses:
 *       200:
 *         description: Paginated list of resources.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: array, items: { type: object } }
 *                 pagination: { $ref: '#/components/schemas/PaginationMeta' }
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 */
router.get(
  "/resources",
  resourceActionController.getResources
);


/**
 * @openapi
 * /api/v1/identity-admin/resources/category/{category}:
 *   get:
 *     summary: Get resources by category
 *     description: Returns all resources belonging to a specific resource category.
 *     tags:
 *       - Resource Actions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         example: IDENTITY
 *         description: Resource category.
 *     responses:
 *       200:
 *         description: Resources retrieved successfully.
 *       404:
 *         description: Resource not found.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 */
router.get(
  "/resources/category/:category",
  resourceActionController.getResourcesByCategories
);


/**
 * @openapi
 * /api/v1/identity-admin/resources/{resourceId}:
 *   get:
 *     summary: Get resource by ID
 *     description: Returns a resource using its unique identifier.
 *     tags:
 *       - Resource Actions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resourceId
 *         required: true
 *         schema:
 *           type: string
 *         example: 8c3b9b2a-9e7e-4e2d-a1a8-123456789abc
 *     responses:
 *       200:
 *         description: Resource retrieved successfully.
 *       404:
 *         description: Resource not found.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 */
router.get(
  "/resources/:resourceId",
  resourceActionController.getResourcesById
);


/**
 * @openapi
 * /api/v1/identity-admin/resources:
 *   post:
 *     summary: Create resource
 *     description: Creates a new resource.
 *     tags:
 *       - Resource Actions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resourceCode
 *               - resourceName
 *               - resourceCategory
 *             properties:
 *               resourceCode:
 *                 type: string
 *                 example: USER
 *               resourceName:
 *                 type: string
 *                 example: User Management
 *               description:
 *                 type: string
 *                 example: Manage application users
 *               resourceCategory:
 *                 type: string
 *                 example: IDENTITY
 *               status:
 *                 type: string
 *                 example: ACTIVE
 *     responses:
 *       201:
 *         description: Resource created successfully.
 *       400:
 *         description: Invalid request.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 */
router.post(
  "/resources",
  resourceActionController.createResource
);


/**
 * @openapi
 * /api/v1/identity-admin/resources/{resourceId}:
 *   put:
 *     summary: Update resource
 *     description: Updates an existing resource.
 *     tags:
 *       - Resource Actions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resourceId
 *         required: true
 *         schema:
 *           type: string
 *         example: 8c3b9b2a-9e7e-4e2d-a1a8-123456789abc
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               resourceCode:
 *                 type: string
 *                 example: USER
 *               resourceName:
 *                 type: string
 *                 example: User Management
 *               description:
 *                 type: string
 *                 example: Manage application users
 *               resourceCategory:
 *                 type: string
 *                 example: IDENTITY
 *     responses:
 *       200:
 *         description: Resource updated successfully.
 *       404:
 *         description: Resource not found.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 */
router.put(
  "/resources/:resourceId",
  resourceActionController.updateResource
);


/**
 * @openapi
 * /api/v1/identity-admin/resources/{resourceId}:
 *   delete:
 *     summary: Delete resource
 *     description: Deactivates or deletes an existing resource.
 *     tags:
 *       - Resource Actions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resourceId
 *         required: true
 *         schema:
 *           type: string
 *         example: 8c3b9b2a-9e7e-4e2d-a1a8-123456789abc
 *     responses:
 *       200:
 *         description: Resource deleted successfully.
 *       404:
 *         description: Resource not found.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 */
router.delete(
  "/resources/:resourceId",
  resourceActionController.deleteResource
);


// =========================================================
// ACTION MASTER
// =========================================================

/**
 * @openapi
 * /api/v1/identity-admin/actions/categories:
 *   get:
 *     summary: Get action categories
 *     description: Returns all distinct active action categories.
 *     tags:
 *       - Resource Actions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Action categories retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *               example:
 *                 - USER
 *                 - ROLE
 *                 - PERMISSION
 *                 - AUTHENTICATION
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 */
router.get(
  "/actions/categories",
  resourceActionController.getActionCategories
);


/**
 * @openapi
 * /api/v1/identity-admin/actions:
 *   get:
 *     summary: Get actions
 *     description: Returns a paginated list of actions.
 *     tags:
 *       - Resource Actions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           example: ACTIVE
 *
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: CREATE
 *
 *     responses:
 *       200:
 *         description: Paginated list of actions.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: array, items: { type: object } }
 *                 pagination: { $ref: '#/components/schemas/PaginationMeta' }
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 */
router.get(
  "/actions",
  resourceActionController.getActions
);


/**
 * @openapi
 * /api/v1/identity-admin/actions/category/{category}:
 *   get:
 *     summary: Get actions by category
 *     description: Returns all actions belonging to a specific action category.
 *     tags:
 *       - Resource Actions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         example: USER
 *     responses:
 *       200:
 *         description: Actions retrieved successfully.
 *       404:
 *         description: Action not found.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 */
router.get(
  "/actions/category/:category",
  resourceActionController.getActionsByCategories
);


/**
 * @openapi
 * /api/v1/identity-admin/actions/{actionId}:
 *   get:
 *     summary: Get action by ID
 *     description: Returns an action using its unique identifier.
 *     tags:
 *       - Resource Actions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: actionId
 *         required: true
 *         schema:
 *           type: string
 *         example: 7a8b9c10-1234-5678-90ab-123456789abc
 *     responses:
 *       200:
 *         description: Action retrieved successfully.
 *       404:
 *         description: Action not found.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 */
router.get(
  "/actions/:actionId",
  resourceActionController.getActionsById
);


/**
 * @openapi
 * /api/v1/identity-admin/actions:
 *   post:
 *     summary: Create action
 *     description: Creates a new action.
 *     tags:
 *       - Resource Actions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - actionCode
 *               - actionName
 *               - actionCategory
 *             properties:
 *               actionCode:
 *                 type: string
 *                 example: CREATE_USER
 *               actionName:
 *                 type: string
 *                 example: Create User
 *               actionCategory:
 *                 type: string
 *                 example: USER
 *               description:
 *                 type: string
 *                 example: Create a new application user
 *               status:
 *                 type: string
 *                 example: ACTIVE
 *     responses:
 *       201:
 *         description: Action created successfully.
 *       400:
 *         description: Invalid request.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 */
router.post(
  "/actions",
  resourceActionController.createAction
);


/**
 * @openapi
 * /api/v1/identity-admin/actions/{actionId}:
 *   put:
 *     summary: Update action
 *     description: Updates an existing action.
 *     tags:
 *       - Resource Actions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: actionId
 *         required: true
 *         schema:
 *           type: string
 *         example: 7a8b9c10-1234-5678-90ab-123456789abc
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               actionCode:
 *                 type: string
 *                 example: CREATE_USER
 *               actionName:
 *                 type: string
 *                 example: Create User
 *               actionCategory:
 *                 type: string
 *                 example: USER
 *               description:
 *                 type: string
 *                 example: Create a new application user
 *     responses:
 *       200:
 *         description: Action updated successfully.
 *       404:
 *         description: Action not found.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 */
router.put(
  "/actions/:actionId",
  resourceActionController.updateAction
);


/**
 * @openapi
 * /api/v1/identity-admin/actions/{actionId}:
 *   delete:
 *     summary: Delete action
 *     description: Deactivates or deletes an existing action.
 *     tags:
 *       - Resource Actions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: actionId
 *         required: true
 *         schema:
 *           type: string
 *         example: 7a8b9c10-1234-5678-90ab-123456789abc
 *     responses:
 *       200:
 *         description: Action deleted successfully.
 *       404:
 *         description: Action not found.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 */
router.delete(
  "/actions/:actionId",
  resourceActionController.deleteAction
);


module.exports = router;