const auditService = require('../services/auditService');

class AuditController {
  async getAuditLogs(req, res, next) {
    try {
      const { page, limit, status, userType, search } = req.query;
      const logs = await auditService.getAuditLogs(req.auth.tenantUuid, { page, limit, status, userType, search });
      return res.status(200).json(logs);
    } catch (err) { next(err); }
  }
}

module.exports = new AuditController();
