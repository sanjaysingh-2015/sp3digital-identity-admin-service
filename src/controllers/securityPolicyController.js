const securityPolicyService = require('../services/securityPolicyService');

class SecurityPolicyController {
  async getActivePolicy(req, res, next) {
    try {
      const policy = await securityPolicyService.getActivePolicy(req.auth.tenantUuid);
      return res.status(200).json(policy);
    } catch (error) {
      next(error);
    }
  }

  async updatePolicy(req, res, next) {
    try {
      const policy = await securityPolicyService.updatePolicy(req.auth.tenantUuid, req.body, req.auth.userId);
      return res.status(200).json(policy);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SecurityPolicyController();
