const express = require('express');
const router = express.Router();
const controller = require('../controllers/sessionController');
const { Joi, validate } = require('../middleware/validate');
const { paginationQuerySchema } = require('../utils/pagination');

const userIdParams = Joi.object({ userId: Joi.number().integer().positive().required() });
const sessionIdParams = Joi.object({ sessionId: Joi.number().integer().positive().required() });
const sessionListQuerySchema = paginationQuerySchema({
  status: Joi.string().valid('ACTIVE', 'EXPIRED', 'REVOKED'),
  ipAddress: Joi.string().ip()
});

/**
 * @openapi
 * /api/v1/identity-admin/users/{userId}/sessions:
 *   get:
 *     summary: List a user's sessions (paginated, filterable by status/ip; defaults to status=ACTIVE)
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ACTIVE, EXPIRED, REVOKED], default: ACTIVE }
 *       - in: query
 *         name: ipAddress
 *         schema: { type: string, format: ipv4 }
 *     responses:
 *       200:
 *         description: Paginated list of sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: array, items: { type: object } }
 *                 pagination: { $ref: '#/components/schemas/PaginationMeta' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 */
router.get('/users/:userId/sessions', validate(userIdParams, 'params'), validate(sessionListQuerySchema, 'query'), controller.getSessions);

/**
 * @openapi
 * /api/v1/identity-admin/users/{userId}/sessions/revoke-all:
 *   post:
 *     summary: Revoke every active session for a user (e.g. after a credential compromise)
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: All active sessions revoked
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post('/users/:userId/sessions/revoke-all', validate(userIdParams, 'params'), controller.revokeAllSessions);

/**
 * @openapi
 * /api/v1/identity-admin/sessions/{sessionId}/revoke:
 *   post:
 *     summary: Terminate/revoke a single active session
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Session revoked
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post('/sessions/:sessionId/revoke', validate(sessionIdParams, 'params'), controller.revokeSession);

module.exports = router;
