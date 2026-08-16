const { UserSessions, AccessTokens } = require('../models');
const { Op } = require('sequelize');
const { toSequelizePage, buildEnvelope } = require('../utils/pagination');
const { notFound } = require('../utils/lifecycle');

function toResponse(session) {
  const item = session.get ? session.get({ plain: true }) : session;
  return {
    sessionId: Number(item.session_id),
    ipAddress: item.ip_address,
    userAgent: item.user_agent,
    status: item.status,
    createdOn: item.created_on,
    expiresOn: item.expires_on,
    lastActivityOn: item.last_activity_on,
    revokedOn: item.revoked_on
  };
}

class SessionService {
  /** Paginated + filterable (status, ip). Defaults to ACTIVE-only, matching the old behavior. */
  async getSessions(userId, { page, limit, status = 'ACTIVE', ipAddress } = {}) {
    const { limit: safeLimit, offset, page: safePage } = toSequelizePage({ page, limit });
    const where = { user_id: userId };
    if (status) where.status = status;
    if (ipAddress) where.ip_address = ipAddress;

    const result = await UserSessions.findAndCountAll({
      where,
      order: [['created_on', 'DESC']],
      limit: safeLimit,
      offset
    });

    return buildEnvelope({ rows: result.rows.map(toResponse), count: result.count }, { page: safePage, limit: safeLimit });
  }

  // Retained for backward compatibility with existing callers/tests.
  async getActiveSessions(userId) {
    const page = await this.getSessions(userId, { status: 'ACTIVE', limit: 100 });
    return page.data;
  }

  async revokeSession(sessionId) {
    const session = await UserSessions.findByPk(sessionId);
    if (!session) throw notFound('Session');

    const now = new Date();
    await session.update({ status: 'REVOKED', revoked_on: now });
    await AccessTokens.update({ status: 'REVOKED', revoked_on: now }, { where: { session_id: sessionId } });

    return { sessionId: Number(sessionId), status: 'REVOKED' };
  }

  /**
   * Revokes every active session (and their tokens) for a user. Intended to
   * be called after a password rotation/revoke or an MFA reset, since a
   * credential change should not leave old sessions valid.
   */
  async revokeAllSessionsForUser(userId) {
    const now = new Date();
    const [affected] = await UserSessions.update(
      { status: 'REVOKED', revoked_on: now },
      { where: { user_id: userId, status: { [Op.ne]: 'REVOKED' } } }
    );
    await AccessTokens.update(
      { status: 'REVOKED', revoked_on: now },
      { where: { user_id: userId, status: { [Op.ne]: 'REVOKED' } } }
    );
    return { userId: Number(userId), sessionsRevoked: affected };
  }
}

module.exports = new SessionService();
