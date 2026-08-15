const express = require('express');
const router = express.Router();
const controller = require('../controllers/sessionController');

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
router.get('/users/:userId/sessions', controller.getActiveSessions);

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
router.post('/sessions/:sessionId/revoke', controller.revokeSession);

module.exports = router;