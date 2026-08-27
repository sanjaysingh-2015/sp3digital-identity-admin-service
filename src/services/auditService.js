const { AuditLogs, Users, IdentityTenants } = require("../models");
const { Op } = require('sequelize');
const { toSequelizePage, buildEnvelope } = require("../utils/pagination");

class AuditService {
  // tenantUuid is required: every audit entry must be attributable to a
  // tenant so cross-tenant queries/filtering (getAuditLogs below) stay a
  // simple indexed column lookup instead of reaching into the changes JSON.
  async writeEvent({
    tenantUuid,
    actorUserId,
    action,
    targetResource,
    changes,
    ipAddress,
  }) {
    if (!tenantUuid) {
      throw new Error("auditService.writeEvent requires tenantUuid");
    }

    return AuditLogs.create({
      tenant_uuid: tenantUuid,
      actor_user_id: actorUserId,
      action,
      target_resource: targetResource,
      changes,
      ip_address: ipAddress,
    });
  }

  // async getAuditLogs(tenantUuid,  { page, limit, status, userType, search } = {}) {
  //   const {
  //     limit: safeLimit,
  //     offset,
  //     page: safePage,
  //   } = toSequelizePage({ page, limit });
  //   const result = await AuditLogs.findAndCountAll({
  //     // where: { tenant_uuid: tenantUuid },
  //     limit: Number(limit),
  //     offset: Number(offset),
  //     order: [["created_on", "DESC"]],
  //   });
  //   return buildEnvelope(
  //     { rows: result.rows, count: result.count },
  //     { page: safePage, limit: safeLimit },
  //   );
  // }

  async getAuditLogs(tenantUuid, { page, limit, search } = {}) {
    const {
      limit: safeLimit,
      offset,
      page: safePage,
    } = toSequelizePage({ page, limit });
    let where = null;
    if (tenantUuid) {
      where = { tenant_uuid: tenantUuid };
    }
    const result = await AuditLogs.findAndCountAll({
      where,
      include: [
        {
          model: Users,
          as: "actor",
          attributes: ["username"],
          required: false,
          // Only constrains rows when `search` is present: an inner join
          // would otherwise silently drop entries with no matching/deleted
          // actor (e.g. system-triggered events) once a where is attached.
          ...(search
            ? {
                required: true,
                where: { username: { [Op.like]: `%${search}%` } },
              }
            : {}),
        },
        {
          model: IdentityTenants,
          as: "tenant",
          attributes: ["tenantName"],
          required: false,
        },
      ],
      limit: safeLimit,
      offset,
      order: [["created_on", "DESC"]],
    });

    return buildEnvelope(
      { rows: result.rows.map(toResponse), count: result.count },
      { page: safePage, limit: safeLimit },
    );
  }
}

function toResponse(auditLog) {
  const item = auditLog.get ? auditLog.get({ plain: true }) : auditLog;
  return {
    auditId: Number(item.audit_id),
    tenantUuid: item.tenant_uuid,
    tenantName: item.tenant?.tenantName ?? null,
    actorUserId: item.actor_user_id,
    username: item.actor?.username ?? null,
    action: item.action,
    targetResource: item.target_resource,
    changes: item.changes,
    ipAddress: item.ip_address,
    createdOn: item.created_on,
  };
}

module.exports = new AuditService();
