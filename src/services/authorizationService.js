const { Roles, Permissions, RolePermissions, sequelize } = require('../models');
const UuidUtil = require('../utils/uuid.util');
const CodeUtil = require('../utils/code.util');
const { STATUS, notFound, isExpired, effectiveStatus, assertMutable, assertNotRevoked } = require('../utils/lifecycle');

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

class AuthorizationService {
  async getRoles({ page, limit, status, userType, search } = {}) {
    const { limit: safeLimit, offset, page: safePage } = toSequelizePage({ page, limit });
    const where = {};
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { role_name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const result = await Roles.findAndCountAll({
      where,
      attributes: [
        ['role_id', 'roleId'],
        ['role_code', 'roleCode'],
        ['role_type', 'roleType'],
        ['role_name', 'roleName'],
        'description',
        'status'
      ],
      order: [['created_on', 'DESC']],
      limit: safeLimit,
      offset
    });

    return buildEnvelope({ rows: result.rows, count: result.count }, { page: safePage, limit: safeLimit });
  }

  async getRoleById(roleId) {
    const role = await Roles.findByPk(roleId, {
      attributes: [
        ['role_id', 'roleId'],
        ['role_code', 'roleCode'],
        ['role_type', 'roleType'],
        ['role_name', 'roleName'],
        'description',
        'status'
      ],
    });

    if (!role) throw notFound("Role");
    return role;
  }

  async createRole(roleData) {
    const role = await Roles.create({
      role_code: CodeUtil.generateCode('ROLE', roleData.roleName),
      role_name: roleData.roleName,
      description: roleData.description,
      role_uuid: UuidUtil.generate(),
      role_type: roleData.roleType,
      status: roleData.status || 'ACTIVE'
    });
    return role;
  }

  async updateRole(roleId, roleData, actorUserId) {
    const role = await Roles.findOne({ where: { role_id: roleId } });
    if (!role) throw notFound('Role');
    assertNotRevoked(roleData, 'Role');
    await role.update({
      role_name: roleData.roleName,
      description: roleData.description,
      role_type: roleData.roleType
    });
    return role;
  }

  async deleteRole(roleId, roleData, actorUserId) {
    const role = await Roles.findOne({ where: { role_id: roleId } });
    if (!role) throw notFound('Role');
    assertNotRevoked(roleData, 'Role');
    
    await role.update({ status: STATUS.DELETED, deactivated_on: new Date(), modified_by: actorUserId, modified_on: new Date() });

    return role;
  }

  async getPermissions({ page, limit, status, userType, search } = {}) {
    const { limit: safeLimit, offset, page: safePage } = toSequelizePage({ page, limit });
    const where = {};
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { role_name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const result = await Permissions.findAndCountAll({
      where,
      attributes: [
        ['permission_id', 'permissionId'],
        ['permission_code', 'permissionCode'],
        ['permission_name', 'permissionName'],
        'description',
        'resource',
        'action',
        'status'
      ],
      order: [['created_on', 'DESC']],
      limit: safeLimit,
      offset
    });

    return buildEnvelope({ rows: result.rows, count: result.count }, { page: safePage, limit: safeLimit });
  }

  async getPermissionById(roleId) {
    const permission = await Permissions.findByPk(roleId, {
      attributes: [
        ['permission_id', 'permissionId'],
        ['permission_code', 'permissionCode'],
        ['permission_name', 'permissionName'],
        'description',
        'resource',
        'action',
        'status'
      ],
    });

    if (!permission) throw notFound("Permission");
    return permission;
  }

  async createPermission(permissionData) {
    const permission = await Permissions.create({
      permission_code: CodeUtil.generateCode('PERMISSION', permissionData.permissionName),
      permission_uuid: UuidUtil.generate(),
      permission_name: permissionData.permissionName,
      resource: permissionData.resource,
      action: permissionData.action,
      description: roleData.description,
      permission_uuid: UuidUtil.generate(),
      status: roleData.status || 'ACTIVE'
    });
    return permission;
  }

  async updatePermission(permissionId, permissionData, actorUserId) {
    const permission = await Permissions.findOne({ where: { permission_id: permissionId } });
    if (!permission) throw notFound('Permission');
    assertNotRevoked(permissionData, 'Permission');
    await role.update({
      permission_name: permissionData.permissionName,
      description: permissionData.description,
      resource: permissionData.resource,
      action: permissionData.action
    });
    return permission;
  }

  async deletePermission(permissionId, permissionData, actorUserId) {
    const permission = await Permissions.findOne({ where: { permission_id: permissionId } });
    if (!permission) throw notFound('Permission');
    assertNotRevoked(permissionData, 'Permission');
    
    await permission.update({ status: STATUS.DELETED, deactivated_on: new Date(), modified_by: actorUserId, modified_on: new Date() });

    return permission;
  }

  async assignPermissionsToRole(roleId, permissionIds) {
    const transaction = await sequelize.transaction();
    try {
      // Clear existing associations
      await RolePermissions.destroy({ where: { role_id: roleId }, transaction });

      // Bulk create new permission mappings
      const records = permissionIds.map(permId => ({
        role_id: roleId,
        permission_id: permId,
        status: 'ACTIVE'
      }));

      await RolePermissions.bulkCreate(records, { transaction });
      await transaction.commit();

      return { roleId: Number(roleId), permissionsAssigned: permissionIds.length };
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
  return { limit: safeLimit, offset: (safePage - 1) * safeLimit, page: safePage };
}

function buildEnvelope({ rows, count }, { page, limit }) {
  return {
    data: rows,
    pagination: {
      page,
      limit,
      totalItems: count,
      totalPages: limit > 0 ? Math.ceil(count / limit) : 0
    }
  };
}

module.exports = new AuthorizationService();
