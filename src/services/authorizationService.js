const { Roles, Permissions, RolePermissions, sequelize } = require('../models');

class AuthorizationService {
  async getRoles() {
    return await Roles.findAll({
      attributes: [
        ['role_id', 'roleId'],
        ['role_code', 'roleCode'],
        ['role_name', 'roleName'],
        'description',
        'status'
      ]
    });
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
        permission_id: permId
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

module.exports = new AuthorizationService();