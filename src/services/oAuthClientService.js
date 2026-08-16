const { OauthClients, AccessTokens, RefreshTokens, sequelize } = require('../models');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { toSequelizePage, buildEnvelope } = require('../utils/pagination');
const { STATUS, notFound, isExpired, effectiveStatus, assertMutable, assertNotRevoked } = require('../utils/lifecycle');

function toResponse(client) {
  const item = client.get ? client.get({ plain: true }) : client;
  return {
    id: Number(item.oauth_client_id),
    clientUuid: item.client_uuid,
    clientId: item.client_id,
    clientName: item.client_name,
    clientType: item.client_type,
    grantTypes: item.grant_types,
    redirectUris: item.redirect_uris,
    status: effectiveStatus(item),
    expiresOn: item.expires_on,
    secretRotatedOn: item.secret_rotated_on,
    createdOn: item.created_on
  };
}

class OAuthClientService {
  async getClients(tenantUuid, { page, limit, status, clientType, search } = {}) {
    const { limit: safeLimit, offset, page: safePage } = toSequelizePage({ page, limit });
    const where = {};
    if (tenantUuid) where.tenant_uuid = tenantUuid;
    if (clientType) where.client_type = clientType;
    if (search) where.client_name = { [Op.like]: `%${search}%` };
    if (status === STATUS.EXPIRED) where.expires_on = { [Op.lte]: new Date() };
    else if (status) where.status = status;

    const result = await OauthClients.findAndCountAll({ where, order: [['created_on', 'DESC']], limit: safeLimit, offset });
    return buildEnvelope({ rows: result.rows.map(toResponse), count: result.count }, { page: safePage, limit: safeLimit });
  }

  async getClientById(clientId, tenantUuid) {
    const client = await OauthClients.findOne({ where: scopedWhere(clientId, tenantUuid) });
    if (!client) throw notFound('OAuth Client');
    return toResponse(client);
  }

  async createClient(clientData, tenantUuid, actorUserId) {
    const clientUuid = uuidv4();
    const rawSecret = crypto.randomBytes(32).toString('hex');
    const now = new Date();

    const newClient = await OauthClients.create({
      tenant_uuid: tenantUuid,
      client_uuid: clientUuid,
      client_id: clientUuid,
      client_name: clientData.clientName,
      client_type: clientData.clientType || 'CONFIDENTIAL',
      grant_types: clientData.grantTypes || ['authorization_code'],
      redirect_uris: clientData.redirectUris || [],
      client_secret_hash: hashSecret(rawSecret),
      status: STATUS.ACTIVE,
      expires_on: clientData.expiresOn || null,
      secret_rotated_on: now,
      created_by: actorUserId,
      created_on: now
    });

    return { ...toResponse(newClient), clientSecret: rawSecret };
  }

  async updateClient(clientId, tenantUuid, data, actorUserId) {
    const client = await OauthClients.findOne({ where: scopedWhere(clientId, tenantUuid) });
    if (!client) throw notFound('OAuth Client');
    assertMutable(client, 'OAuth Client');

    const values = { modified_by: actorUserId, modified_on: new Date() };
    if (data.clientName !== undefined) values.client_name = data.clientName;
    if (data.grantTypes !== undefined) values.grant_types = data.grantTypes;
    if (data.redirectUris !== undefined) values.redirect_uris = data.redirectUris;
    if (data.expiresOn !== undefined) values.expires_on = data.expiresOn;

    await client.update(values);
    return toResponse(client);
  }

  async deactivateClient(clientId, tenantUuid, actorUserId) {
    const client = await OauthClients.findOne({ where: scopedWhere(clientId, tenantUuid) });
    if (!client) throw notFound('OAuth Client');
    assertNotRevoked(client, 'OAuth Client');

    await client.update({ status: STATUS.SUSPENDED, deactivated_on: new Date(), modified_by: actorUserId, modified_on: new Date() });
    return { clientId: Number(clientId), status: STATUS.SUSPENDED };
  }

  async reactivateClient(clientId, tenantUuid, actorUserId) {
    const client = await OauthClients.findOne({ where: scopedWhere(clientId, tenantUuid) });
    if (!client) throw notFound('OAuth Client');
    if (client.status !== STATUS.SUSPENDED) throw conflictError('Only a suspended OAuth Client can be reactivated');
    if (isExpired(client)) throw conflictError('Cannot reactivate an expired OAuth Client; extend expiresOn first');

    await client.update({ status: STATUS.ACTIVE, deactivated_on: null, modified_by: actorUserId, modified_on: new Date() });
    return { clientId: Number(clientId), status: STATUS.ACTIVE };
  }

  async revokeClient(clientId, tenantUuid, actorUserId) {
    return sequelize.transaction(async (transaction) => {
      const client = await OauthClients.findOne({ where: scopedWhere(clientId, tenantUuid), transaction, lock: transaction.LOCK.UPDATE });
      if (!client) throw notFound('OAuth Client');

      const now = new Date();
      await client.update({ status: STATUS.REVOKED, revoked_on: now, modified_by: actorUserId, modified_on: now }, { transaction });
      await AccessTokens.update({ status: STATUS.REVOKED, revoked_on: now }, { where: { oauth_client_id: clientId, status: { [Op.ne]: STATUS.REVOKED } }, transaction });
      await RefreshTokens.update({ status: STATUS.REVOKED, revoked_on: now }, { where: { oauth_client_id: clientId, status: { [Op.ne]: STATUS.REVOKED } }, transaction });

      return { clientId: Number(clientId), status: STATUS.REVOKED };
    });
  }

  async rotateSecret(clientId, tenantUuid, actorUserId) {
    return sequelize.transaction(async (transaction) => {
      const client = await OauthClients.findOne({ where: scopedWhere(clientId, tenantUuid), transaction, lock: transaction.LOCK.UPDATE });
      if (!client) throw notFound('OAuth Client');
      assertMutable(client, 'OAuth Client');

      const rawSecret = crypto.randomBytes(32).toString('hex');
      const now = new Date();
      await client.update({ client_secret_hash: hashSecret(rawSecret), secret_rotated_on: now, modified_by: actorUserId, modified_on: now }, { transaction });
      await AccessTokens.update({ status: STATUS.REVOKED, revoked_on: now }, { where: { oauth_client_id: clientId, status: { [Op.ne]: STATUS.REVOKED } }, transaction });
      await RefreshTokens.update({ status: STATUS.REVOKED, revoked_on: now }, { where: { oauth_client_id: clientId, status: { [Op.ne]: STATUS.REVOKED } }, transaction });

      return { clientId: Number(clientId), clientSecret: rawSecret, secretRotatedOn: now };
    });
  }
}

function scopedWhere(clientId, tenantUuid) {
  const where = { oauth_client_id: clientId };
  if (tenantUuid) where.tenant_uuid = tenantUuid;
  return where;
}

function hashSecret(rawSecret) {
  return crypto.createHash('sha256').update(rawSecret).digest('hex');
}

function conflictError(message) {
  const error = new Error(message);
  error.statusCode = 409;
  error.code = 'LIFECYCLE_CONFLICT';
  error.expose = true;
  return error;
}

module.exports = new OAuthClientService();
