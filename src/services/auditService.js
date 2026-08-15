const { AuditLogs } = require('../models');

class AuditService {
  async getAuditLogs(limit = 100, offset = 0) {
    return await AuditLogs.findAll({
      limit: Number(limit),
      offset: Number(offset),
      order: [['created_on', 'DESC']]
    });
  }
}

module.exports = new AuditService();