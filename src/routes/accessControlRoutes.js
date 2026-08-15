const express = require('express');
const router = express.Router();
const controller = require('../controllers/accessControlController');

/**
 * @openapi
 * /api/v1/identity-admin/users/{userId}/organizations:
 *   post:
 *     summary: Assign user to Organization
 *     tags: [Organization Access]
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
 *             properties:
 *               organizationId: { type: integer, example: 101 }
 *     responses:
 *       201:
 *         description: Organization access granted
 */
router.post('/users/:userId/organizations', controller.assignOrganization);

/**
 * @openapi
 * /api/v1/identity-admin/users/{userId}/facilities:
 *   post:
 *     summary: Assign user to Facility
 *     tags: [Facility Access]
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
 *             properties:
 *               facilityId: { type: integer, example: 501 }
 *     responses:
 *       201:
 *         description: Facility access granted
 */
router.post('/users/:userId/facilities', controller.assignFacility);

module.exports = router;