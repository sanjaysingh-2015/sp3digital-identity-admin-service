const authConfigService = require('../services/authConfigService');

class AuthConfigController {
  async getConfig(req, res, next) {
    try {
      const config = await authConfigService.getConfigByTenant(req.params.tenantUuid);
      return res.status(200).json(config);
    } catch (error) {
      return next(error);
    }
  }

  async updateConfig(req, res, next) {
    try {
      const config = await authConfigService.updateConfig(req.params.tenantUuid, req.body);
      return res.status(200).json(config);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthConfigController();