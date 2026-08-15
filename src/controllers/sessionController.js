const sessionService = require('../services/sessionService');

class SessionController {
  async getActiveSessions(req, res, next) {
    try {
      const sessions = await sessionService.getActiveSessions(req.params.userId);
      return res.status(200).json(sessions);
    } catch (err) { next(err); }
  }

  async revokeSession(req, res, next) {
    try {
      const result = await sessionService.revokeSession(req.params.sessionId);
      return res.status(200).json(result);
    } catch (err) { next(err); }
  }
}

module.exports = new SessionController();