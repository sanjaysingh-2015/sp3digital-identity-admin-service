const { Roles, Permissions, RolePermissions, sequelize } = require("../models");
const UuidUtil = require("../utils/uuid.util");
const CodeUtil = require("../utils/code.util");
const { Op } = require("sequelize");

const {
  STATUS,
  notFound,
  conflict,
  isExpired,
  effectiveStatus,
  assertMutable,
  assertNotRevoked,
} = require("../utils/lifecycle");

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

class AuthorizationService {
  async getRoles({ page, limit, status, userType, search } = {}) {
    const {
      limit: safeLimit,
      offset,
      page: safePage,
    } = toSequelizePage({ page, limit });
    const where = {};
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { role_name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    const result = await Roles.findAndCountAll({
      where,
      attributes: [
        ["role_id", "roleId"],
        ["role_code", "roleCode"],
        ["role_type", "roleType"],
        ["role_name", "roleName"],
        "description",
        "status",
      ],
      order: [["created_on", "DESC"]],
      limit: safeLimit,
      offset,
    });

    return buildEnvelope(
      { rows: result.rows, count: result.count },
      { page: safePage, limit: safeLimit },
    );
  }

  async getRoleById(roleId) {
    const role = await Roles.findByPk(roleId, {
      attributes: [
        ["role_id", "roleId"],
        ["role_code", "roleCode"],
        ["role_type", "roleType"],
        ["role_name", "roleName"],
        "description",
        "status",
      ],
    });

    if (!role) throw notFound("Role");
    return role;
  }

  async createRole(roleData) {
    const role = await Roles.create({
      role_code: CodeUtil.generateCode("ROLE", roleData.roleName),
      role_name: roleData.roleName,
      description: roleData.description,
      role_uuid: UuidUtil.generate(),
      role_type: roleData.roleType,
      status: roleData.status || "ACTIVE",
    });
    return role;
  }

  async updateRole(roleId, roleData, actorUserId) {
    const role = await Roles.findOne({ where: { role_id: roleId } });
    if (!role) throw notFound("Role");
    assertNotRevoked(role, "Role");
    await role.update({
      role_name: roleData.roleName,
      description: roleData.description,
      role_type: roleData.roleType,
    });
    return role;
  }

  async deleteRole(roleId, roleData, actorUserId) {
    const role = await Roles.findOne({ where: { role_id: roleId } });
    if (!role) throw notFound("Role");
    assertNotRevoked(role, "Role");

    await role.update({
      status: STATUS.DELETED,
      deactivated_on: new Date(),
      modified_by: actorUserId,
      modified_on: new Date(),
    });

    return role;
  }

  async getPermissions({ page, limit, status, userType, search } = {}) {
    const {
      limit: safeLimit,
      offset,
      page: safePage,
    } = toSequelizePage({ page, limit });
    const where = {};
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { role_name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    const result = await Permissions.findAndCountAll({
      where,
      attributes: [
        ["permission_id", "permissionId"],
        ["permission_code", "permissionCode"],
        ["permission_name", "permissionName"],
        "description",
        ["resource_category", "resourceCategory"],
        "resource",
        ["action_category", "actionCategory"],
        "action",
        "status",
      ],
      order: [["created_on", "DESC"]],
      limit: safeLimit,
      offset,
    });

    return buildEnvelope(
      { rows: result.rows, count: result.count },
      { page: safePage, limit: safeLimit },
    );
  }

  async getPermissionById(permissionId) {
    const permission = await Permissions.findByPk(permissionId, {
      attributes: [
        ["permission_id", "permissionId"],
        ["permission_code", "permissionCode"],
        ["permission_name", "permissionName"],
        "description",
        ["resource_category", "resourceCategory"],
        "resource",
        ["action_category", "actionCategory"],
        "action",
        "status",
      ],
    });

    if (!permission) throw notFound("Permission");
    return permission;
  }

  async createPermission(permissionData) {
    const {
      permissionName,
      resourceCategory,
      resources = [],
      actionCategory,
      actions = [],
      description,
      status = "ACTIVE",
      allowDuplicates = false,
    } = permissionData;

    // =========================================================
    // 1. Generate all Resource × Action combinations
    // =========================================================

    const permissions = [];

    for (const resource of resources) {
      for (const action of actions) {
        const permissionCode = `${resourceCategory}:${resource}:${action}`;

        permissions.push({
          permission_uuid: UuidUtil.generate(),
          permission_code: permissionCode,
          permission_name: permissionName,
          resource_category: resourceCategory,
          resource: resource,
          action_category: actionCategory,
          action: action,
          description: description || `Allow user ${resource} ${action} access`,
          status,
        });
      }
    }

    // =========================================================
    // 2. Remove duplicate combinations from request itself
    // =========================================================

    const uniquePermissions = [];
    const requestDuplicates = [];
    const seenCodes = new Set();

    for (const permission of permissions) {
      if (seenCodes.has(permission.permission_code)) {
        requestDuplicates.push(permission.permission_code);
      } else {
        seenCodes.add(permission.permission_code);
        uniquePermissions.push(permission);
      }
    }

    // =========================================================
    // 3. Check database for existing permissions
    // =========================================================

    const existingPermissions = await Permissions.findAll({
      where: {
        permission_code: {
          [Op.in]: uniquePermissions.map(
            (permission) => permission.permission_code,
          ),
        },
      },
      attributes: ["permission_code"],
      raw: true,
    });

    const databaseDuplicates = existingPermissions.map(
      (permission) => permission.permission_code,
    );

    // =========================================================
    // 4. Combine all duplicates
    // =========================================================

    const duplicateCodes = [
      ...new Set([...requestDuplicates, ...databaseDuplicates]),
    ];

    // =========================================================
    // 5. If duplicates exist and allowDuplicates = false
    //    DO NOT INSERT ANYTHING
    // =========================================================

    if (duplicateCodes.length > 0 && !allowDuplicates) {
      throw conflict(
        `Duplicate permission(s) found: ${duplicateCodes.join(", ")}`,
        "DUPLICATE_PERMISSION",
        { duplicates: duplicateCodes },
      );
    }

    // =========================================================
    // 6. Remove database duplicates when allowDuplicates=true
    // =========================================================

    const databaseDuplicateSet = new Set(databaseDuplicates);

    const permissionsToCreate = uniquePermissions.filter(
      (permission) => !databaseDuplicateSet.has(permission.permission_code),
    );

    // =========================================================
    // 7. Insert only unique permissions
    // =========================================================

    let createdPermissions = [];

    if (permissionsToCreate.length > 0) {
      createdPermissions = await Permissions.bulkCreate(permissionsToCreate);
    }

    // =========================================================
    // 8. Return result
    // =========================================================

    return {
      created: createdPermissions,
      createdCount: createdPermissions.length,
      duplicateCount: duplicateCodes.length,
      duplicates: duplicateCodes,
      allowDuplicates,
    };
  }

  async updatePermission(permissionId, permissionData, actorUserId) {
    const permission = await Permissions.findOne({
      where: { permission_id: permissionId },
    });
    if (!permission) throw notFound("Permission");
    assertNotRevoked(permission, "Permission");
    await permission.update({
      permission_name: permissionData.permissionName,
      description: permissionData.description,
      resource_category: permissionData.resourceCategory,
      resource: permissionData.resource,
      action_category: permissionData.actionCategory,
      action: permissionData.action,
    });
    return permission;
  }

  async deletePermission(permissionId, permissionData, actorUserId) {
    const permission = await Permissions.findOne({
      where: { permission_id: permissionId },
    });
    if (!permission) throw notFound("Permission");
    assertNotRevoked(permission, "Permission");

    await permission.update({
      status: STATUS.DELETED,
      deactivated_on: new Date(),
      modified_by: actorUserId,
      modified_on: new Date(),
    });

    return permission;
  }

  async assignPermissionsToRole(roleId, permissionIds) {
    const transaction = await sequelize.transaction();

    try {
      // Remove duplicate permission IDs
      const uniquePermissionIds = [
        ...new Set(permissionIds.map((id) => Number(id))),
      ];

      // Find existing mappings for this role
      const existingMappings = await RolePermissions.findAll({
        where: {
          role_id: roleId,
          permission_id: uniquePermissionIds,
        },
        attributes: ["role_permission_id", "permission_id", "status"],
        raw: true,
        transaction,
      });

      const existingMap = new Map(
        existingMappings.map((mapping) => [
          Number(mapping.permission_id),
          mapping,
        ]),
      );

      const toActivate = [];
      const toInsert = [];

      for (const permissionId of uniquePermissionIds) {
        const existing = existingMap.get(permissionId);

        if (existing) {
          // Existing INACTIVE mapping -> reactivate
          if (existing.status === "INACTIVE") {
            toActivate.push(permissionId);
          }

          // Existing ACTIVE mapping -> do nothing
        } else {
          // No mapping -> create new one
          toInsert.push({
            role_id: roleId,
            permission_id: permissionId,
            status: "ACTIVE",
          });
        }
      }

      // Reactivate existing mappings
      if (toActivate.length) {
        await RolePermissions.update(
          {
            status: "ACTIVE",
          },
          {
            where: {
              role_id: roleId,
              permission_id: toActivate,
              status: "INACTIVE",
            },
            transaction,
          },
        );
      }

      // Insert new mappings
      if (toInsert.length) {
        await RolePermissions.bulkCreate(toInsert, {
          transaction,
        });
      }

      await transaction.commit();

      return {
        roleId: Number(roleId),
        permissionsAssigned: uniquePermissionIds.length,
        permissionsReactivated: toActivate.length,
        permissionsCreated: toInsert.length,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async revokePermissionsToRole(roleId, permissionIds) {
    const transaction = await sequelize.transaction();

    console.log("Revoking ==> ", permissionIds);
    console.log("RoleId ==> ", roleId);

    try {
      const [updatedCount] = await RolePermissions.update(
        {
          status: "INACTIVE",
        },
        {
          where: {
            role_id: roleId,
            role_permission_id: permissionIds,
            status: "ACTIVE",
          },
          transaction,
          logging: console.log,
        },
      );

      console.log("Updated Count ==> ", updatedCount);

      await transaction.commit();

      console.log("Transaction committed");

      return {
        roleId: Number(roleId),
        permissionsRevoked: updatedCount,
      };
    } catch (error) {
      console.error("Revoke permissions failed:", error);

      await transaction.rollback();
      throw error;
    }
  }

  async getRolePermissions(roleId) {
    try {
      // Clear existing associations
      const rolePermissions = await RolePermissions.findAll({
        where: { role_id: roleId },
        attributes: [
          ["permission_id", "permissionId"],
          ["role_permission_id", "rolePermissionId"],
          "status",
        ],
      });

      return rolePermissions;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

/**
 * Turns { page, limit } into Sequelize { limit, offset } and returns a
 * pagination envelope builder.
 */
function toSequelizePage({ page = 1, limit = DEFAULT_LIMIT } = {}) {
  const safeLimit = Math.min(Number(limit) || DEFAULT_LIMIT, MAX_LIMIT);
  const safePage = Math.max(Number(page) || 1, 1);
  return {
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit,
    page: safePage,
  };
}

function buildEnvelope({ rows, count }, { page, limit }) {
  return {
    data: rows,
    pagination: {
      page,
      limit,
      totalItems: count,
      totalPages: limit > 0 ? Math.ceil(count / limit) : 0,
    },
  };
}

module.exports = new AuthorizationService();
