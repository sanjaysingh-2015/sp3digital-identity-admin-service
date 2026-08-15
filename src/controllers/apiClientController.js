const apiClientService = require('../services/apiClientService');

class ApiClientController {
  async getApiClients(req, res, next) {
    try {
      const clients = await apiClientService.getApiClients();
      return res.status(200).json(clients);
    } catch (error) {
      next(error);
    }
  }

  async createApiClient(req, res, next) {
    try {
      const client = await apiClientService.createApiClient(req.body);
      return res.status(201).json(client);
    } catch (error) {
      next(error);
    }
  }

  async revokeApiClient(req, res, next) {
    try {
      const result = await apiClientService.revokeApiClient(req.params.id);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ApiClientController();