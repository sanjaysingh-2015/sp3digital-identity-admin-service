const { ServiceAccounts, ApiClients, AccessTokens, sequelize } = require('../models');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { toSequelizePage, buildEnvelope } = require('../utils/pagination');
const { STATUS, notFound, isExpired, effectiveStatus, assertMutable, assertNotRevoked } = require('../utils/lifecycle');

function toResponse(account) {
  const item = account.get ? account.get({ plain: true }) : account;
  return {
    serviceAccountId: Number(item.service_account_id),
    serviceUuid: item.service_uuid,
    serviceCode: item.service_code,
    accountName: item.service_name,
    description: item.description,
    organizationId: item.organization_id,
    clientId: item.client_id,
    status: effectiveStatus(item),
    expiresOn: item.expires_on,
    createdOn: item.created_on
  };
}

class ServiceAccountService {
  async getServiceAccounts(tenantUuid, { page, limit, status, search } = {}) {
    const { limit: safeLimit, offset, page: safePage } = toSequelizePage({ page, limit });
    const where = {};
    if (tenantUuid) where.tenant_uuid = tenantUuid;
    if (search) where.service_name = { [Op.like]: `%${search}%` };
    if (status === STATUS.EXPIRED) where.expires_on = { [Op.lte]: new Date() };
    else if (status) where.status = status;

    const result = await ServiceAccounts.findAndCountAll({ where, order: [['created_on', 'DESC']], limit: safeLimit, offset });
    return buildEnvelope({ rows: result.rows.map(toResponse), count: result.count }, { page: safePage, limit: safeLimit });
  }

  async getServiceAccountById(serviceAccountId, tenantUuid) {
    const account = await ServiceAccounts.findOne({ where: scopedWhere(serviceAccountId, tenantUuid) });
    if (!account) throw notFound('Service Account');
    return toResponse(account);
  }

  /**
   * Creates the service account plus a backing confidential API client, which
   * is how the account authenticates. The client secret is only ever
   * returned here and on rotateSecret().
   */
  async createServiceAccount(data, tenantUuid, actorUserId) {
    return sequelize.transaction(async (transaction) => {
      const now = new Date();
      const rawSecret = crypto.randomBytes(32).toString('hex');

      const apiClient = await ApiClients.create({
        tenant_uuid: tenantUuid,
        client_uuid: uuidv4(),
        client_code: `${data.serviceCode || 'SA'}_CLIENT`,
        client_name: `${data.accountName} (service account)`,
        client_type: 'CONFIDENTIAL',
        client_secret_hash: hashSecret(rawSecret),
        organization_id: data.organizationId || null,
        status: STATUS.ACTIVE,
        expires_on: data.expiresOn || null,
        secret_rotated_on: now,
        created_by: actorUserId,
        created_on: now
      }, { transaction });

      const account = await ServiceAccounts.create({
        tenant_uuid: tenantUuid,
        service_uuid: uuidv4(),
        service_code: data.serviceCode || `SA_${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
        service_name: data.accountName,
        description: data.description,
        client_id: apiClient.api_client_id,
        organization_id: data.organizationId || null,
        expires_on: data.expiresOn || null,
        status: STATUS.ACTIVE,
        created_by: actorUserId,
        created_on: now
      }, { transaction });

      return { ...toResponse(account), clientSecret: rawSecret };
    });
  }

  async updateServiceAccount(serviceAccountId, tenantUuid, data, actorUserId) {
    const account = await ServiceAccounts.findOne({ where: scopedWhere(serviceAccountId, tenantUuid) });
    if (!account) throw notFound('Service Account');
    assertMutable(account, 'Service Account');

    const values = { modified_by: actorUserId, modified_on: new Date() };
    if (data.accountName !== undefined) values.service_name = data.accountName;
    if (data.description !== undefined) values.description = data.description;
    if (data.expiresOn !== undefined) values.expires_on = data.expiresOn;

    await account.update(values);
    if (data.expiresOn !== undefined && account.client_id) {
      await ApiClients.update({ expires_on: data.expiresOn }, { where: { api_client_id: account.client_id } });
    }
    return toResponse(account);
  }

  async deactivateServiceAccount(serviceAccountId, tenantUuid, actorUserId) {
    const account = await ServiceAccounts.findOne({ where: scopedWhere(serviceAccountId, tenantUuid) });
    if (!account) throw notFound('Service Account');
    assertNotRevoked(account, 'Service Account');

    const now = new Date();
    await account.update({ status: STATUS.SUSPENDED, deactivated_on: now, modified_by: actorUserId, modified_on: now });
    if (account.client_id) await ApiClients.update({ status: STATUS.SUSPENDED, deactivated_on: now }, { where: { api_client_id: account.client_id } });

    return { serviceAccountId: Number(serviceAccountId), status: STATUS.SUSPENDED };
  }

  async reactivateServiceAccount(serviceAccountId, tenantUuid, actorUserId) {
    const account = await ServiceAccounts.findOne({ where: scopedWhere(serviceAccountId, tenantUuid) });
    if (!account) throw notFound('Service Account');
    if (account.status !== STATUS.SUSPENDED) throw conflictError('Only a suspended Service Account can be reactivated');
    if (isExpired(account)) throw conflictError('Cannot reactivate an expired Service Account; extend expiresOn first');

    const now = new Date();
    await account.update({ status: STATUS.ACTIVE, deactivated_on: null, modified_by: actorUserId, modified_on: now });
    if (account.client_id) await ApiClients.update({ status: STATUS.ACTIVE, deactivated_on: null }, { where: { api_client_id: account.client_id } });

    return { serviceAccountId: Number(serviceAccountId), status: STATUS.ACTIVE };
  }

  /** Permanent. Revokes the account, its backing API client, and any outstanding tokens. */
  async revokeServiceAccount(serviceAccountId, tenantUuid, actorUserId) {
    return sequelize.transaction(async (transaction) => {
      const account = await ServiceAccounts.findOne({ where: scopedWhere(serviceAccountId, tenantUuid), transaction, lock: transaction.LOCK.UPDATE });
      if (!account) throw notFound('Service Account');

      const now = new Date();
      await account.update({ status: STATUS.REVOKED, revoked_on: now, modified_by: actorUserId, modified_on: now }, { transaction });

      if (account.client_id) {
        await ApiClients.update({ status: STATUS.REVOKED, revoked_on: now }, { where: { api_client_id: account.client_id }, transaction });
      }
      await AccessTokens.update(
        { status: STATUS.REVOKED, revoked_on: now },
        { where: { service_account_id: serviceAccountId, status: { [Op.ne]: STATUS.REVOKED } }, transaction }
      );

      return { serviceAccountId: Number(serviceAccountId), status: STATUS.REVOKED };
    });
  }

  /** Rotates the secret on the backing API client and revokes tokens issued under the old one. */
  async rotateSecret(serviceAccountId, tenantUuid, actorUserId) {
    return sequelize.transaction(async (transaction) => {
      const account = await ServiceAccounts.findOne({ where: scopedWhere(serviceAccountId, tenantUuid), transaction, lock: transaction.LOCK.UPDATE });
      if (!account) throw notFound('Service Account');
      assertMutable(account, 'Service Account');
      if (!account.client_id) throw conflictError('Service Account has no backing API client to rotate');

      const rawSecret = crypto.randomBytes(32).toString('hex');
      const now = new Date();
      await ApiClients.update(
        { client_secret_hash: hashSecret(rawSecret), secret_rotated_on: now, modified_by: actorUserId, modified_on: now },
        { where: { api_client_id: account.client_id }, transaction }
      );
      await AccessTokens.update(
        { status: STATUS.REVOKED, revoked_on: now },
        { where: { service_account_id: serviceAccountId, status: { [Op.ne]: STATUS.REVOKED } }, transaction }
      );

      return { serviceAccountId: Number(serviceAccountId), clientSecret: rawSecret, secretRotatedOn: now };
    });
  }
}

function scopedWhere(serviceAccountId, tenantUuid) {
  const where = { service_account_id: serviceAccountId };
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

module.exports = new ServiceAccountService();
