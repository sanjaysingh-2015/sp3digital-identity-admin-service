const { AuditLogs, sequelize } = require('../models');

class AuditService {
  async writeEvent({ actorUserId, action, targetResource, changes, ipAddress }) {
    return AuditLogs.create({
      actor_user_id: actorUserId,
      action,
      target_resource: targetResource,
      changes,
      ip_address: ipAddress
    });
  }

  async getAuditLogs(tenantUuid, limit = 100, offset = 0) {
    return await AuditLogs.findAll({
      where: sequelize.where(
        sequelize.fn('JSON_UNQUOTE', sequelize.fn('JSON_EXTRACT', sequelize.col('changes'), '$.tenantUuid')),
        tenantUuid
      ),
      limit: Number(limit),
      offset: Number(offset),
      order: [['created_on', 'DESC']]
    });
  }
}

module.exports = new AuditService();
