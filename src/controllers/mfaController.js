const mfaService = require('../services/mfaService');

class MfaController {
  async getUserMfaMethods(req, res, next) {
    try {
      const { page, limit, status } = req.query;
      const result = await mfaService.getUserMfaMethods(req.params.userId, req.auth.tenantUuid, { page, limit, status });
      return res.status(200).json(result);
    } catch (err) { next(err); }
  }

  async registerMfaMethod(req, res, next) {
    try {
      const method = await mfaService.registerMfaMethod(req.params.userId, req.auth.tenantUuid, req.body, req.auth.userId);
      return res.status(201).json(method);
    } catch (err) { next(err); }
  }

  async verifyMfaMethod(req, res, next) {
    try {
      const result = await mfaService.verifyMfaMethod(req.params.userId, req.params.mfaId, req.body.code);
      return res.status(200).json(result);
    } catch (err) { next(err); }
  }

  async deactivateMfaMethod(req, res, next) {
    try {
      const result = await mfaService.deactivateMfaMethod(req.params.userId, req.params.mfaId, req.auth.userId);
      return res.status(200).json(result);
    } catch (err) { next(err); }
  }

  async reactivateMfaMethod(req, res, next) {
    try {
      const result = await mfaService.reactivateMfaMethod(req.params.userId, req.params.mfaId, req.auth.userId);
      return res.status(200).json(result);
    } catch (err) { next(err); }
  }

  async revokeMfaMethod(req, res, next) {
    try {
      const result = await mfaService.revokeMfaMethod(req.params.userId, req.params.mfaId, req.auth.tenantUuid, req.auth.userId);
      return res.status(200).json(result);
    } catch (err) { next(err); }
  }

  async rotateMfaSecret(req, res, next) {
    try {
      const result = await mfaService.rotateMfaSecret(req.params.userId, req.params.mfaId, req.auth.userId);
      return res.status(200).json(result);
    } catch (err) { next(err); }
  }
}

module.exports = new MfaController();
