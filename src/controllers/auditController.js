const auditService = require('../services/auditService');

class AuditController {
  async getAuditLogs(req, res, next) {
    try {
      const { limit, offset } = req.query;
      const logs = await auditService.getAuditLogs(req.auth.tenantUuid, limit, offset);
      return res.status(200).json(logs);
    } catch (err) { next(err); }
  }
}

module.exports = new AuditController();
