const { OauthClients } = require('../models');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

class OAuthClientService {
  async getClients() {
    return await OauthClients.findAll({
      attributes: [
        ['oauth_client_id', 'id'],
        ['client_uuid', 'clientUuid'],
        ['client_name', 'clientName'],
        ['client_type', 'clientType'],
        'status',
        ['created_on', 'createdOn']
      ]
    });
  }

  async createClient(clientData) {
    const clientUuid = uuidv4();
    const rawSecret = crypto.randomBytes(32).toString('hex');

    const newClient = await OauthClients.create({
      client_uuid: clientUuid,
      client_name: clientData.clientName,
      client_type: clientData.clientType || 'CONFIDENTIAL',
      grant_types: clientData.grantTypes || ['authorization_code'],
      redirect_uris: clientData.redirectUris || [],
      client_secret_hash: crypto.createHash('sha256').update(rawSecret).digest('hex'),
      status: 'ACTIVE'
    });

    return {
      id: newClient.oauth_client_id,
      clientUuid: newClient.client_uuid,
      clientName: newClient.client_name,
      clientSecret: rawSecret, // Return plain text secret once on creation
      status: newClient.status
    };
  }

  async revokeClient(clientId) {
    const [affected] = await OauthClients.update(
      { status: 'REVOKED' },
      { where: { oauth_client_id: clientId } }
    );

    if (affected === 0) {
      throw new Error('OAuth Client not found');
    }
    return { clientId: Number(clientId), status: 'REVOKED' };
  }
}

module.exports = new OAuthClientService();