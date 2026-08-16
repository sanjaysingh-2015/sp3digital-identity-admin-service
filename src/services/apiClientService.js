const { ApiClients, AccessTokens, sequelize } = require('../models');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { toSequelizePage, buildEnvelope } = require('../utils/pagination');
const { STATUS, notFound, isExpired, effectiveStatus, assertMutable, assertNotRevoked } = require('../utils/lifecycle');
const { Op } = require('sequelize');

const PUBLIC_ATTRIBUTES = [
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
  ['secret_rotated_on', 'secretRotatedOn'],
  ['created_on', 'createdOn'],
  ['modified_on', 'modifiedOn']
];

function toResponse(client) {
  const item = client.get ? client.get({ plain: true }) : client;
  return {
    apiClientId: Number(item.api_client_id),
    clientUuid: item.client_uuid,
    clientCode: item.client_code,
    clientName: item.client_name,
    description: item.description,
    clientType: item.client_type,
    allowedIps: item.allowed_ips,
    allowedOrigins: item.allowed_origins,
    status: effectiveStatus(item), // reports EXPIRED even if the stored status is still ACTIVE
    expiresOn: item.expires_on,
    secretRotatedOn: item.secret_rotated_on,
    createdOn: item.created_on,
    modifiedOn: item.modified_on
  };
}

class ApiClientService {
  /** Paginated + filterable list: status, clientType, search (name/code), tenant scoped. */
  async getApiClients(tenantUuid, { page, limit, status, clientType, search } = {}) {
    const { limit: safeLimit, offset, page: safePage } = toSequelizePage({ page, limit });
    const where = {};
    if (tenantUuid) where.tenant_uuid = tenantUuid;
    if (clientType) where.client_type = clientType;
    if (search) {
      where[Op.or] = [
        { client_name: { [Op.like]: `%${search}%` } },
        { client_code: { [Op.like]: `%${search}%` } }
      ];
    }
    // EXPIRED is derived, not stored, so filter for it by expires_on rather than status.
    if (status === STATUS.EXPIRED) {
      where.expires_on = { [Op.lte]: new Date() };
    } else if (status) {
      where.status = status;
    }

    const result = await ApiClients.findAndCountAll({
      where,
      attributes: PUBLIC_ATTRIBUTES,
      order: [['created_on', 'DESC']],
      limit: safeLimit,
      offset
    });

    return buildEnvelope(
      { rows: result.rows.map(toResponse), count: result.count },
      { page: safePage, limit: safeLimit }
    );
  }

  async getApiClientById(apiClientId, tenantUuid) {
    const client = await ApiClients.findOne({ where: scopedWhere(apiClientId, tenantUuid) });
    if (!client) throw notFound('API Client');
    return toResponse(client);
  }

  async createApiClient(data, tenantUuid, actorUserId) {
    const clientUuid = uuidv4();
    const rawSecret = crypto.randomBytes(32).toString('hex');
    const secretHash = hashSecret(rawSecret);
    const now = new Date();

    const client = await ApiClients.create({
      tenant_uuid: tenantUuid,
      client_uuid: clientUuid,
      client_code: data.clientCode || `AC_${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      client_name: data.clientName,
      description: data.description || null,
      client_type: data.clientType || 'CONFIDENTIAL',
      client_secret_hash: secretHash,
      organization_id: data.organizationId || null,
      allowed_ips: data.allowedIps || [],
      allowed_origins: data.allowedOrigins || [],
      status: STATUS.ACTIVE,
      expires_on: data.expiresOn || null,
      secret_rotated_on: now,
      created_by: actorUserId,
      created_on: now
    });

    return { ...toResponse(client), clientSecret: rawSecret }; // plain secret exposed once, at creation only
  }

  /** Mutable, non-secret fields: name, description, network allow-lists, expiry. */
  async updateApiClient(apiClientId, tenantUuid, data, actorUserId) {
    const client = await ApiClients.findOne({ where: scopedWhere(apiClientId, tenantUuid) });
    if (!client) throw notFound('API Client');
    assertMutable(client, 'API Client');

    const values = { modified_by: actorUserId, modified_on: new Date() };
    if (data.clientName !== undefined) values.client_name = data.clientName;
    if (data.description !== undefined) values.description = data.description;
    if (data.allowedIps !== undefined) values.allowed_ips = data.allowedIps;
    if (data.allowedOrigins !== undefined) values.allowed_origins = data.allowedOrigins;
    if (data.expiresOn !== undefined) values.expires_on = data.expiresOn;

    await client.update(values);
    return toResponse(client);
  }

  /** Reversible: temporarily disables the client without losing its configuration/secret. */
  async deactivateApiClient(apiClientId, tenantUuid, actorUserId) {
    const client = await ApiClients.findOne({ where: scopedWhere(apiClientId, tenantUuid) });
    if (!client) throw notFound('API Client');
    assertNotRevoked(client, 'API Client');

    await client.update({ status: STATUS.SUSPENDED, deactivated_on: new Date(), modified_by: actorUserId, modified_on: new Date() });
    return { apiClientId: Number(apiClientId), status: STATUS.SUSPENDED };
  }

  async reactivateApiClient(apiClientId, tenantUuid, actorUserId) {
    const client = await ApiClients.findOne({ where: scopedWhere(apiClientId, tenantUuid) });
    if (!client) throw notFound('API Client');
    if (client.status !== STATUS.SUSPENDED) {
      const error = new Error('Only a suspended API Client can be reactivated');
      error.statusCode = 409; error.code = 'LIFECYCLE_CONFLICT'; error.expose = true;
      throw error;
    }
    if (isExpired(client)) {
      const error = new Error('Cannot reactivate an expired API Client; extend expiresOn first');
      error.statusCode = 409; error.code = 'LIFECYCLE_CONFLICT'; error.expose = true;
      throw error;
    }

    await client.update({ status: STATUS.ACTIVE, deactivated_on: null, modified_by: actorUserId, modified_on: new Date() });
    return { apiClientId: Number(apiClientId), status: STATUS.ACTIVE };
  }

  /** Permanent, terminal state. Also revokes every outstanding access token for this client. */
  async revokeApiClient(apiClientId, tenantUuid, actorUserId) {
    return sequelize.transaction(async (transaction) => {
      const client = await ApiClients.findOne({ where: scopedWhere(apiClientId, tenantUuid), transaction, lock: transaction.LOCK.UPDATE });
      if (!client) throw notFound('API Client');

      const now = new Date();
      await client.update({ status: STATUS.REVOKED, revoked_on: now, modified_by: actorUserId, modified_on: now }, { transaction });
      await AccessTokens.update(
        { status: STATUS.REVOKED, revoked_on: now },
        { where: { api_client_id: apiClientId, status: { [Op.ne]: STATUS.REVOKED } }, transaction }
      );

      return { apiClientId: Number(apiClientId), status: STATUS.REVOKED };
    });
  }

  /** Issues a new secret, invalidates the old one, and revokes tokens minted under it. */
  async rotateSecret(apiClientId, tenantUuid, actorUserId) {
    return sequelize.transaction(async (transaction) => {
      const client = await ApiClients.findOne({ where: scopedWhere(apiClientId, tenantUuid), transaction, lock: transaction.LOCK.UPDATE });
      if (!client) throw notFound('API Client');
      assertMutable(client, 'API Client');

      const rawSecret = crypto.randomBytes(32).toString('hex');
      const now = new Date();
      await client.update(
        { client_secret_hash: hashSecret(rawSecret), secret_rotated_on: now, modified_by: actorUserId, modified_on: now },
        { transaction }
      );
      await AccessTokens.update(
        { status: STATUS.REVOKED, revoked_on: now },
        { where: { api_client_id: apiClientId, status: { [Op.ne]: STATUS.REVOKED } }, transaction }
      );

      return { apiClientId: Number(apiClientId), clientSecret: rawSecret, secretRotatedOn: now };
    });
  }
}

function scopedWhere(apiClientId, tenantUuid) {
  const where = { api_client_id: apiClientId };
  if (tenantUuid) where.tenant_uuid = tenantUuid;
  return where;
}

function hashSecret(rawSecret) {
  return crypto.createHash('sha256').update(rawSecret).digest('hex');
}

module.exports = new ApiClientService();
