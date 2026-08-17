const { Roles, Permissions, RolePermissions, sequelize } = require('../models');

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

  async createRole(roleData) {
    const role = await Roles.create({
      role_code: roleData.roleCode,
      role_name: roleData.roleName,
      description: roleData.description,
      status: roleData.status || 'ACTIVE'
    });
    return role;
  }

  async getPermissions() {
    return await Permissions.findAll({
      attributes: [
        ['permission_id', 'permissionId'],
        ['permission_code', 'permissionCode'],
        ['permission_name', 'permissionName'],
        'resource',
        'action'
      ]
    });
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
