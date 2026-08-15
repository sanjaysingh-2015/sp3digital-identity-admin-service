const mfaService = require('../services/mfaService');

class MfaController {
  async getUserMfaMethods(req, res, next) {
    try {
      const methods = await mfaService.getUserMfaMethods(req.params.userId);
      return res.status(200).json(methods);
    } catch (err) { next(err); }
  }

  async registerMfaMethod(req, res, next) {
    try {
      const method = await mfaService.registerMfaMethod(req.params.userId, req.body);
      return res.status(201).json(method);
    } catch (err) { next(err); }
  }

  async revokeMfaMethod(req, res, next) {
    try {
      const result = await mfaService.revokeMfaMethod(req.params.userId, req.params.mfaId);
      return res.status(200).json(result);
    } catch (err) { next(err); }
  }
}

module.exports = new MfaController();