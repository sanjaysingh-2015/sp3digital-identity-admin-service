const oAuthClientService = require('../services/oAuthClientService');

class OAuthClientController {
  async getClients(req, res, next) {
    try {
      const clients = await oAuthClientService.getClients();
      return res.status(200).json(clients);
    } catch (error) {
      next(error);
    }
  }

  async createClient(req, res, next) {
    try {
      const client = await oAuthClientService.createClient(req.body);
      return res.status(201).json(client);
    } catch (error) {
      next(error);
    }
  }

  async revokeClient(req, res, next) {
    try {
      const { id } = req.params;
      const result = await oAuthClientService.revokeClient(id);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OAuthClientController();