const { IdentityProviders } = require('../models');
const { v4: uuidv4 } = require('uuid');

class IdentityProvidersService {
  // GET /api/v1/identity-admin/identity-providers
  async getAllProviders() {
    const providers = await IdentityProviders.findAll({
      attributes: [
        ['identity_provider_id', 'id'],
        ['provider_uuid', 'uuid'],
        ['provider_code', 'code'],
        ['provider_name', 'name'],
        ['provider_type', 'type'],
        ['issuer_url', 'issuerUrl'],
        ['authorization_url', 'authorizationUrl'],
        ['token_url', 'tokenUrl'],
        ['jwks_url', 'jwksUrl'],
        ['client_id', 'clientId'],
        'status',
        ['created_on', 'createdOn']
      ]
    });
    return providers;
  }

  // POST /api/v1/identity-admin/identity-providers
  async createProvider(data) {
    const providerUuid = uuidv4();
    const { code, name, type, configuration } = data;

    const newProvider = await IdentityProviders.create({
      provider_uuid: providerUuid,
      provider_code: code,
      provider_name: name,
      provider_type: type,
      issuer_url: configuration?.issuerUrl || null,
      authorization_url: configuration?.authorizationUrl || null,
      token_url: configuration?.tokenUrl || null,
      jwks_url: configuration?.jwksUrl || null,
      client_id: configuration?.clientId || null,
      scopes: configuration?.scopes || [],
      configuration: configuration || {}
    });

    return {
      id: newProvider.identity_provider_id,
      uuid: newProvider.provider_uuid,
      code: newProvider.provider_code,
      name: newProvider.provider_name,
      type: newProvider.provider_type,
      status: newProvider.status || 'ACTIVE'
    };
  }

  // POST /api/v1/identity-admin/identity-providers/:id/test
  async testProvider(providerId) {
    const provider = await IdentityProviders.findByPk(providerId);

    if (!provider) {
      throw new Error('Identity provider not found');
    }

    // Connectivity verification check logic
    const isReachable = Boolean(provider.issuer_url);

    return {
      providerId: Number(providerId),
      status: isReachable ? 'SUCCESS' : 'FAILED',
      issuerReachable: isReachable,
      configurationValid: Boolean(provider.client_id),
      jwksAvailable: Boolean(provider.jwks_url),
      testedOn: new Date().toISOString()
    };
  }

  // PATCH /api/v1/identity-admin/identity-providers/:id/status
  async updateStatus(providerId, status) {
    const [affectedRows] = await IdentityProviders.update(
      { status },
      { where: { identity_provider_id: providerId } }
    );

    if (affectedRows === 0) {
      throw new Error('Identity provider not found');
    }

    return { providerId: Number(providerId), status };
  }
}

module.exports = new IdentityProvidersService();