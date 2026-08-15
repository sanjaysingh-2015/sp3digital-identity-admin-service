const { ApiClients } = require('../models');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

class ApiClientService {
  async getApiClients() {
    return await ApiClients.findAll({
      attributes: [
        ['api_client_id', 'apiClientId'],
        ['client_uuid', 'clientUuid'],
        ['client_code', 'clientCode'],
        ['client_name', 'clientName'],
        'description',
        ['client_type', 'clientType'],
        ['allowed_ips', 'allowedIps'],
        ['allowed_origins', 'allowedOrigins'],
        'status',
        ['expires_on', 'expiresOn'],
        ['created_on', 'createdOn']
      ]
    });
  }

  async createApiClient(data) {
    const clientUuid = uuidv4();
    const rawSecret = crypto.randomBytes(32).toString('hex');
    const secretHash = crypto.createHash('sha256').update(rawSecret).digest('hex');

    const client = await ApiClients.create({
      client_uuid: clientUuid,
      client_code: data.clientCode || `AC_${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      client_name: data.clientName,
      description: data.description || null,
      client_type: data.clientType || 'CONFIDENTIAL',
      client_secret_hash: secretHash,
      organization_id: data.organizationId || null,
      allowed_ips: data.allowedIps || [],
      allowed_origins: data.allowedOrigins || [],
      status: 'ACTIVE',
      expires_on: data.expiresOn || null
    });

    const response = client.toJSON();
    response.clientSecret = rawSecret; // Expose plain secret once upon creation
    return response;
  }

  async revokeApiClient(apiClientId) {
    const [affected] = await ApiClients.update(
      { 
        status: 'REVOKED',
        modified_on: new Date()
      },
      { where: { api_client_id: apiClientId } }
    );

    if (affected === 0) throw new Error('API Client not found');
    return { apiClientId: Number(apiClientId), status: 'REVOKED' };
  }
}

module.exports = new ApiClientService();