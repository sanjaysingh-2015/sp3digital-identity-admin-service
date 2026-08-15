const { ApiClient } = require('../models');
const crypto = require('crypto');

class ApiClientService {
  async getApiClients() {
    return await ApiClient.findAll({
      attributes: ['api_client_id', 'client_key', 'client_name', 'rate_limit', 'status']
    });
  }

  async createApiClient(data) {
    const generatedKey = `ak_${crypto.randomBytes(24).toString('hex')}`;

    const client = await ApiClient.create({
      client_key: generatedKey,
      client_name: data.clientName,
      ip_whitelist: data.ipWhitelist || [],
      rate_limit: data.rateLimit || 1000,
      status: 'ACTIVE'
    });

    return client;
  }

  async revokeApiClient(apiClientId) {
    const [affected] = await ApiClient.update(
      { status: 'REVOKED' },
      { where: { api_client_id: apiClientId } }
    );
    if (affected === 0) throw new Error('API Client not found');
    return { apiClientId: Number(apiClientId), status: 'REVOKED' };
  }
}

module.exports = new ApiClientService();