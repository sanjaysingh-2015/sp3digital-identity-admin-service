const { Users, Roles, UserRoles } = require('../models');
const { v4: uuidv4 } = require('uuid');

class UserService {
  // GET /api/v1/identity-admin/users
  async getUsers() {
    const users = await Users.findAll({
      attributes: [
        ['user_id', 'userId'],
        ['user_uuid', 'userUuid'],
        'username',
        'email',
        ['first_name', 'firstName'],
        ['middle_name', 'middleName'],
        ['last_name', 'lastName'],
        ['user_type', 'userType'],
        'status',
        ['created_on', 'createdOn']
      ]
    });
    return users;
  }

  // GET /api/v1/identity-admin/users/:userId
  async getUserById(userId) {
    const user = await Users.findByPk(userId, {
      attributes: [
        ['user_id', 'userId'],
        ['user_uuid', 'userUuid'],
        'username',
        'email',
        ['first_name', 'firstName'],
        ['last_name', 'lastName'],
        'status'
      ]
    });

    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  // POST /api/v1/identity-admin/users
  async createUser(userData) {
    const userUuid = uuidv4();
    const { username, email, firstName, lastName, userType = 'USER' } = userData;

    const newUser = await Users.create({
      user_uuid: userUuid,
      username,
      email,
      first_name: firstName,
      last_name: lastName,
      user_type: userType
    });

    return {
      userId: newUser.user_id,
      userUuid: newUser.user_uuid,
      username: newUser.username,
      email: newUser.email,
      firstName: newUser.first_name,
      lastName: newUser.last_name,
      status: newUser.status || 'ACTIVE'
    };
  }

  // POST /api/v1/identity-admin/users/:userId/roles
  async assignRole(userId, roleId, effectiveFrom = null, effectiveTo = null) {
    // Verify user exists
    await this.getUserById(userId);

    const userRole = await UserRoles.create({
      user_id: userId,
      role_id: roleId,
      effective_from: effectiveFrom,
      effective_to: effectiveTo
    });

    return {
      userRoleId: userRole.user_role_id,
      userId: Number(userId),
      roleId: Number(roleId),
      status: userRole.status || 'ACTIVE'
    };
  }

  // GET /api/v1/identity-admin/users/:userId/roles
  async getUserRoles(userId) {
    const userRoles = await UserRoles.findAll({
      where: { user_id: userId },
      attributes: [
        ['user_role_id', 'userRoleId'],
        'status'
      ],
      include: [
        {
          model: Roles,
          attributes: [
            ['role_id', 'roleId'],
            ['role_code', 'roleCode'],
            ['role_name', 'roleName']
          ]
        }
      ]
    });

    // Flattening the Sequelize payload to match original API response format
    return userRoles.map(ur => ({
      userRoleId: ur.get('userRoleId'),
      roleId: ur.Role ? ur.Role.get('roleId') : null,
      roleCode: ur.Role ? ur.Role.get('roleCode') : null,
      roleName: ur.Role ? ur.Role.get('roleName') : null,
      status: ur.status
    }));
  }
}

module.exports = new UserService();