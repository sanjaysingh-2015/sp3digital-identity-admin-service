const serviceAccountService = require('../services/serviceAccountService');

class ServiceAccountController {
  async getAccounts(req, res, next) {
    try {
      const { page, limit, status, search } = req.query;
      const data = await serviceAccountService.getServiceAccounts(req.auth.tenantUuid, { page, limit, status, search });
      return res.status(200).json(data);
    } catch (err) { next(err); }
  }

  async getAccountById(req, res, next) {
    try {
      const data = await serviceAccountService.getServiceAccountById(req.params.id, req.auth.tenantUuid);
      return res.status(200).json(data);
    } catch (err) { next(err); }
  }

  async createAccount(req, res, next) {
    try {
      const data = await serviceAccountService.createServiceAccount(req.body, req.auth.tenantUuid, req.auth.userId);
      return res.status(201).json(data);
    } catch (err) { next(err); }
  }

  async updateAccount(req, res, next) {
    try {
      const data = await serviceAccountService.updateServiceAccount(req.params.id, req.auth.tenantUuid, req.body, req.auth.userId);
      return res.status(200).json(data);
    } catch (err) { next(err); }
  }

  async deactivateAccount(req, res, next) {
    try {
      const data = await serviceAccountService.deactivateServiceAccount(req.params.id, req.auth.tenantUuid, req.auth.userId);
      return res.status(200).json(data);
    } catch (err) { next(err); }
  }

  async reactivateAccount(req, res, next) {
    try {
      const data = await serviceAccountService.reactivateServiceAccount(req.params.id, req.auth.tenantUuid, req.auth.userId);
      return res.status(200).json(data);
    } catch (err) { next(err); }
  }

  async revokeAccount(req, res, next) {
    try {
      const data = await serviceAccountService.revokeServiceAccount(req.params.id, req.auth.tenantUuid, req.auth.userId);
      return res.status(200).json(data);
    } catch (err) { next(err); }
  }

  async rotateSecret(req, res, next) {
    try {
      const data = await serviceAccountService.rotateSecret(req.params.id, req.auth.tenantUuid, req.auth.userId);
      return res.status(200).json(data);
    } catch (err) { next(err); }
  }
}

module.exports = new ServiceAccountController();
