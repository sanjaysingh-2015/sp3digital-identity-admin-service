const { Op } = require("sequelize");
const { IdentityTenants, sequelize } = require("../models");
const { toSequelizePage, buildEnvelope } = require("../utils/pagination");
const UuidUtil = require("../utils/uuid.util");
const SecretCipher = require("../utils/secretCipher.util");
const {
  STATUS,
  notFound,
  assertMutable,
  assertNotRevoked,
} = require("../utils/lifecycle");
const { ConflictError } = require("../validations/tenant.validation");
const CodeUtil = require("../utils/code.util");

// Response shape: client_secret_encrypted itself is never returned — only
// derived, non-sensitive metadata about whether a secret is set.
const TENANT_ATTRIBUTES = [
  ["tenant_uuid", "tenantUuid"],
  ["tenant_code", "tenantCode"],
  ["tenant_name", "tenantName"],
  "status",
  ["created_on", "createdOn"],
  ["modified_on", "modifiedOn"],
];

function toResponseShape(record) {
  if (!record) return null;
  const plain =
    typeof record.get === "function" ? record.get({ plain: true }) : record;
  return {
    tenantUuid: plain.tenantUuid ?? plain.tenant_uuid,
    tenantCode: plain.tenantCode ?? plain.tenant_code,
    tenantName: plain.tenantName ?? plain.tenant_name,
    status: plain.status,
    createdOn: plain.createdOn ?? plain.created_on,
    modifiedOn: plain.modifiedOn ?? plain.modified_on,
  };
}
class TenantService {
  async searchByName(tenantName) {
    const whereClause = {
      status: "ACTIVE", // Returns active tenants by default
    };

    if (tenantName) {
      whereClause.tenant_name = {
        [Op.like]: `%${tenantName.trim()}%`,
      };
    }

    const tenants = await IdentityTenants.findAll({
      where: whereClause,
      attributes: [
        ["tenant_uuid", "tenantUuid"],
        ["tenant_code", "tenantCode"],
        ["tenant_name", "tenantName"],
        "status",
        ["created_on", "createdOn"],
        ["modified_on", "modifiedOn"],
      ],
      order: [["tenant_name", "ASC"]],
      raw: true,
    });

    return tenants;
  }

  async getTenants() {
    const whereClause = {
      status: "ACTIVE", // Returns active tenants by default
    };

    const tenants = await IdentityTenants.findAll({
      where: whereClause,
      attributes: [
        ["tenant_uuid", "tenantUuid"],
        ["tenant_code", "tenantCode"],
        ["tenant_name", "tenantName"],
        "status",
        ["created_on", "createdOn"],
        ["modified_on", "modifiedOn"],
      ],
      order: [["tenant_name", "ASC"]],
      raw: true,
    });

    return tenants;
  }

  /** GET /api/v1/identity-admin/identity-tenants — paginated + filterable (status, search on name/type). */
  async getTenantList({ page, limit, status, search } = {}) {
    const {
      limit: safeLimit,
      offset,
      page: safePage,
    } = toSequelizePage({ page, limit });
    const where = {};
    if (status) where.status = status;
    if (search) where.tenant_name = { [Op.like]: `%${search}%` } 
    
    const result = await IdentityTenants.findAndCountAll({
      where,
      attributes: TENANT_ATTRIBUTES,
      order: [["created_on", "DESC"]],
      limit: safeLimit,
      offset,
    });

    return buildEnvelope(
      { rows: result.rows.map(toResponseShape), count: result.count },
      { page: safePage, limit: safeLimit },
    );
  }

  async getTenantById(tenantUuid) {
    const where = { tenant_uuid: tenantUuid };
    const tenant = await IdentityTenants.findOne({
      where,
      attributes: TENANT_ATTRIBUTES,
    });

    if (!tenant) throw notFound("Tenant");
    return toResponseShape(tenant);
  }

  /** Internal: fetch raw model row (with secret column) for update/delete/status flows. */
  async _findEntityOrThrow(tenantUuid, transaction) {
    const where = { tenant_uuid: tenantUuid };
    const tenant = await IdentityTenants.findOne({
      where: {
        tenant_uuid: tenantUuid,
      },
      transaction,
    });

    if (!tenant) {
      throw notFound("Tenant");
    }

    if (!tenant) throw notFound("Tenant");
    return tenant;
  }

  async _assertNoDuplicate({ tenantName, excludeId } = {}) {
    const orConditions = [];
    if (tenantName) {
      // tenant_name isn't DB-unique, but we still guard against duplicates
      // within the same tenant, consistent with how other resources dedupe.
      orConditions.push({
        tenant_name: tenantName,
      });
    }
    if (!orConditions.length) return;

    const where = { [Op.or]: orConditions };
    if (excludeId) where.tenant_uuid = { [Op.ne]: excludeId };

    const existing = await IdentityTenants.findOne({
      where,
      attributes: ["tenant_uuid", "tenant_code", "tenant_name"],
    });
    if (existing) {
      const field = "tenantName";
      throw new ConflictError(
        `Identity tenant with this ${field} already exists`,
        [{ field, message: "must be unique" }],
      );
    }
  }

  async createTenant(data, actorUserId) {
    await this._assertNoDuplicate({
      tenantName: data.tenantName,
    });

    const now = new Date();
    const createPayload = {
      tenantUuid: UuidUtil.generate(),
      tenantCode: CodeUtil.generateCode("TENANT", data.tenantName),
      tenantName: data.tenantName,
      status: "ACTIVE",
      createdBy: actorUserId,
      createdOn: now,
    };

    const created = await IdentityTenants.create(createPayload);
    return this.getTenantById(created.tenantUuid);
  }

  async updateTenant(tenantUuid, data, actorUserId) {
    return sequelize.transaction(async (transaction) => {
      const tenant = await this._findEntityOrThrow(tenantUuid, transaction);

      assertNotRevoked(tenant, "Tenant");
      assertMutable(tenant, "Tenant");

      // Validate duplicate tenant name
      if (data.tenantName !== undefined) {
        await this._assertNoDuplicate({
          tenantName: data.tenantName,
          excludeId: tenantUuid,
          transaction,
        });
      }

      const values = {
        modifiedOn: new Date(),
      };

      if (data.tenantName !== undefined) {
        values.tenantName = data.tenantName;
      }

      // Update
      await tenant.update(values, {
        transaction,
      });

      return tenant;
    });
  }

  /** Soft delete: sets status to DELETED, never removes the row. */
  async deleteTenant(tenantUuid, actorUserId) {
    const tenant = await this._findEntityOrThrow(tenantUuid);
    assertNotRevoked(tenant, "Tenant");

    await tenant.update({
      status: STATUS.DELETED,
      modified_by: actorUserId,
      modified_on: new Date(),
    });

    return tenant;
  }

  /** PATCH .../:id/status — dedicated lifecycle transition endpoint. */
  async updateStatus(tenantUuid, status, actorUserId) {
    return sequelize.transaction(async (transaction) => {
      const tenant = await this._findEntityOrThrow(tenantUuid, transaction);
      assertNotRevoked(tenant, "Tenant");
      assertMutable(tenant, "Tenant");

      await tenant.update(
        { status, modified_by: actorUserId, modified_on: new Date() },
        { transaction },
      );

      return tenant;
    });
  }
}

module.exports = new TenantService();
