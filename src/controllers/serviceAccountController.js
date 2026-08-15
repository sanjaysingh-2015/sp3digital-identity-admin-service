const serviceAccountService = require('../services/serviceAccountService');

class ServiceAccountController {
  async getAccounts(req, res, next) {
    try {
      const data = await serviceAccountService.getServiceAccounts();
      return res.status(200).json(data);
    } catch (err) { next(err); }
  }

  async createAccount(req, res, next) {
    try {
      const data = await serviceAccountService.createServiceAccount(req.body);
      return res.status(201).json(data);
    } catch (err) { next(err); }
  }
}

module.exports = new ServiceAccountController();