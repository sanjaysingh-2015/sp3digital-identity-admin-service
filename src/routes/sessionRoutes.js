const express = require('express');
const router = express.Router();
const controller = require('../controllers/sessionController');
const { Joi, validate } = require('../middleware/validate');

const userIdParams = Joi.object({ userId: Joi.number().integer().positive().required() });
const sessionIdParams = Joi.object({ sessionId: Joi.number().integer().positive().required() });

/**
 * @openapi
 * /api/v1/identity-admin/users/{userId}/sessions:
 *   get:
 *     summary: Retrieve active user sessions
 *     tags: [Session Management]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Active sessions
 */
router.get('/users/:userId/sessions', validate(userIdParams, 'params'), controller.getActiveSessions);

/**
 * @openapi
 * /api/v1/identity-admin/sessions/{sessionId}/revoke:
 *   post:
 *     summary: Terminate/revoke an active session
 *     tags: [Session Management]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Session terminated
 */
router.post('/sessions/:sessionId/revoke', validate(sessionIdParams, 'params'), controller.revokeSession);

module.exports = router;
