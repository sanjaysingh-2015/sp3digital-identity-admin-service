const sessionService = require('../services/sessionService');

class SessionController {
  async getSessions(req, res, next) {
    try {
      const { page, limit, status, ipAddress } = req.query;
      const sessions = await sessionService.getSessions(req.params.userId, { page, limit, status, ipAddress });
      return res.status(200).json(sessions);
    } catch (err) { next(err); }
  }

  async revokeSession(req, res, next) {
    try {
      const result = await sessionService.revokeSession(req.params.sessionId);
      return res.status(200).json(result);
    } catch (err) { next(err); }
  }

  async revokeAllSessions(req, res, next) {
    try {
      const result = await sessionService.revokeAllSessionsForUser(req.params.userId);
      return res.status(200).json(result);
    } catch (err) { next(err); }
  }
}

module.exports = new SessionController();
