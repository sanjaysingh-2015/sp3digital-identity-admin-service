const apiClientService = require('../services/apiClientService');

class ApiClientController {
  async getApiClients(req, res, next) {
    try {
      const { page, limit, status, clientType, search } = req.query;
      const clients = await apiClientService.getApiClients(req.auth.tenantUuid, { page, limit, status, clientType, search });
      return res.status(200).json(clients);
    } catch (error) { next(error); }
  }

  async getApiClientById(req, res, next) {
    try {
      const client = await apiClientService.getApiClientById(req.params.id, req.auth.tenantUuid);
      return res.status(200).json(client);
    } catch (error) { next(error); }
  }

  async createApiClient(req, res, next) {
    try {
      const client = await apiClientService.createApiClient(req.body, req.auth.tenantUuid, req.auth.userId);
      return res.status(201).json(client);
    } catch (error) { next(error); }
  }

  async updateApiClient(req, res, next) {
    try {
      const client = await apiClientService.updateApiClient(req.params.id, req.auth.tenantUuid, req.body, req.auth.userId);
      return res.status(200).json(client);
    } catch (error) { next(error); }
  }

  async deactivateApiClient(req, res, next) {
    try {
      const result = await apiClientService.deactivateApiClient(req.params.id, req.auth.tenantUuid, req.auth.userId);
      return res.status(200).json(result);
    } catch (error) { next(error); }
  }

  async reactivateApiClient(req, res, next) {
    try {
      const result = await apiClientService.reactivateApiClient(req.params.id, req.auth.tenantUuid, req.auth.userId);
      return res.status(200).json(result);
    } catch (error) { next(error); }
  }

  async revokeApiClient(req, res, next) {
    try {
      const result = await apiClientService.revokeApiClient(req.params.id, req.auth.tenantUuid, req.auth.userId);
      return res.status(200).json(result);
    } catch (error) { next(error); }
  }

  async rotateSecret(req, res, next) {
    try {
      const result = await apiClientService.rotateSecret(req.params.id, req.auth.tenantUuid, req.auth.userId);
      return res.status(200).json(result);
    } catch (error) { next(error); }
  }
}

module.exports = new ApiClientController();
