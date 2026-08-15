const { UserSession, AccessTokens } = require('../models');

class SessionService {
  async getActiveSessions(userId) {
    return await UserSession.findAll({
      where: { user_id: userId, status: 'ACTIVE' },
      attributes: [
        ['session_id', 'sessionId'],
        ['ip_address', 'ipAddress'],
        ['user_agent', 'userAgent'],
        ['created_on', 'createdOn'],
        ['expires_on', 'expiresOn']
      ]
    });
  }

  async revokeSession(sessionId) {
    const [affected] = await UserSession.update(
      { status: 'REVOKED', revoked_on: new Date() },
      { where: { session_id: sessionId } }
    );
    if (affected === 0) throw new Error('Session not found');

    // Revoke corresponding access tokens bound to session
    await AccessTokens.update(
      { status: 'REVOKED', revoked_on: new Date() },
      { where: { session_id: sessionId } }
    );

    return { sessionId: Number(sessionId), status: 'REVOKED' };
  }
}

module.exports = new SessionService();