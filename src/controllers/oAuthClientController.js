const oAuthClientService = require('../services/oAuthClientService');

class OAuthClientController {
  async getClients(req, res, next) {
    try {
      const { page, limit, status, clientType, search } = req.query;
      const clients = await oAuthClientService.getClients(req.auth.tenantUuid, { page, limit, status, clientType, search });
      return res.status(200).json(clients);
    } catch (error) { next(error); }
  }

  async getClientById(req, res, next) {
    try {
      const client = await oAuthClientService.getClientById(req.params.id, req.auth.tenantUuid);
      return res.status(200).json(client);
    } catch (error) { next(error); }
  }

  async createClient(req, res, next) {
    try {
      const client = await oAuthClientService.createClient(req.body, req.auth.tenantUuid, req.auth.userId);
      return res.status(201).json(client);
    } catch (error) { next(error); }
  }

  async updateClient(req, res, next) {
    try {
      const client = await oAuthClientService.updateClient(req.params.id, req.auth.tenantUuid, req.body, req.auth.userId);
      return res.status(200).json(client);
    } catch (error) { next(error); }
  }

  async deactivateClient(req, res, next) {
    try {
      const result = await oAuthClientService.deactivateClient(req.params.id, req.auth.tenantUuid, req.auth.userId);
      return res.status(200).json(result);
    } catch (error) { next(error); }
  }

  async reactivateClient(req, res, next) {
    try {
      const result = await oAuthClientService.reactivateClient(req.params.id, req.auth.tenantUuid, req.auth.userId);
      return res.status(200).json(result);
    } catch (error) { next(error); }
  }

  async revokeClient(req, res, next) {
    try {
      const { id } = req.params;
      const result = await oAuthClientService.revokeClient(id, req.auth.tenantUuid, req.auth.userId);
      return res.status(200).json(result);
    } catch (error) { next(error); }
  }

  async rotateSecret(req, res, next) {
    try {
      const result = await oAuthClientService.rotateSecret(req.params.id, req.auth.tenantUuid, req.auth.userId);
      return res.status(200).json(result);
    } catch (error) { next(error); }
  }
}

module.exports = new OAuthClientController();
