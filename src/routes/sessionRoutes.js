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
 *     summary: List a user's sessions (paginated, filterable by status/ip; defaults to ACTIVE)
 *     tags: [Session Management]
 */
router.get('/users/:userId/sessions', validate(userIdParams, 'params'), validate(sessionListQuerySchema, 'query'), controller.getSessions);

/**
 * @openapi
 * /api/v1/identity-admin/users/{userId}/sessions/revoke-all:
 *   post:
 *     summary: Revoke every active session for a user (e.g. after a credential compromise)
 *     tags: [Session Management]
 */
router.post('/users/:userId/sessions/revoke-all', validate(userIdParams, 'params'), controller.revokeAllSessions);

/**
 * @openapi
 * /api/v1/identity-admin/sessions/{sessionId}/revoke:
 *   post:
 *     summary: Terminate/revoke an active session
 *     tags: [Session Management]
 */
router.post('/sessions/:sessionId/revoke', validate(sessionIdParams, 'params'), controller.revokeSession);

module.exports = router;
