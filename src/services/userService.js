const { Users, Roles, UserRoles, sequelize } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { toSequelizePage, buildEnvelope } = require('../utils/pagination');
const { notFound } = require('../utils/lifecycle');

const USER_ATTRIBUTES = [
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
];

class UserService {
  /** GET /api/v1/identity-admin/users — paginated + filterable (status, userType, search). */
  async getUsers(tenantUuid, { page, limit, status, userType, search } = {}) {
    const { limit: safeLimit, offset, page: safePage } = toSequelizePage({ page, limit });
    const where = {};
    if (tenantUuid) where.tenant_uuid = tenantUuid;
    if (status) where.status = status;
    if (userType) where.user_type = userType;
    if (search) {
      where[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } }
      ];
    }

    const result = await Users.findAndCountAll({
      where,
      attributes: USER_ATTRIBUTES,
      order: [['created_on', 'DESC']],
      limit: safeLimit,
      offset
    });

    return buildEnvelope({ rows: result.rows, count: result.count }, { page: safePage, limit: safeLimit });
  }

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

    if (!user) throw notFound('User');
    return user;
  }

  async createUser(userData, tenantUuid, actorUserId) {
    const userUuid = uuidv4();
    const { username, email, firstName, lastName, userType = 'USER' } = userData;
    const now = new Date();

    const newUser = await Users.create({
      tenant_uuid: tenantUuid,
      user_uuid: userUuid,
      username,
      email,
      first_name: firstName,
      last_name: lastName,
      user_type: userType,
      status: 'ACTIVE',
      created_by: actorUserId,
      created_on: now
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

  /** POST /api/v1/identity-admin/users/:userId/roles */
  async assignRole(userId, roleId, effectiveFrom = null, effectiveTo = null, actorUserId) {
    await this.getUserById(userId);
    const now = new Date();

    const userRole = await UserRoles.create({
      user_id: userId,
      role_id: roleId,
      effective_from: effectiveFrom || now,
      effective_to: effectiveTo,
      status: 'ACTIVE',
      created_by: actorUserId,
      created_on: now
    });

    return {
      userRoleId: userRole.user_role_id,
      userId: Number(userId),
      roleId: Number(roleId),
      effectiveFrom: userRole.effective_from,
      effectiveTo: userRole.effective_to,
      status: userRole.status || 'ACTIVE'
    };
  }

  /**
   * GET /api/v1/identity-admin/users/:userId/roles
   * By default only returns roles that are effective right now
   * (effective_from <= now <= effective_to, treating a null bound as open-ended).
   * Pass includeExpired=true to see the full assignment history.
   */
  async getUserRoles(userId, { includeExpired = false } = {}) {
    const now = new Date();
    const where = { user_id: userId, status: 'ACTIVE' };
    if (!includeExpired) {
      where[Op.and] = [
        { [Op.or]: [{ effective_from: null }, { effective_from: { [Op.lte]: now } }] },
        { [Op.or]: [{ effective_to: null }, { effective_to: { [Op.gte]: now } }] }
      ];
    }

    const userRoles = await UserRoles.findAll({
      where,
      attributes: [
        ['user_role_id', 'userRoleId'],
        ['effective_from', 'effectiveFrom'],
        ['effective_to', 'effectiveTo'],
        'status'
      ],
      include: [{
        model: Roles,
        attributes: [['role_id', 'roleId'], ['role_code', 'roleCode'], ['role_name', 'roleName']]
      }]
    });

    return userRoles.map((ur) => ({
      userRoleId: ur.get('userRoleId'),
      roleId: ur.Role ? ur.Role.get('roleId') : null,
      roleCode: ur.Role ? ur.Role.get('roleCode') : null,
      roleName: ur.Role ? ur.Role.get('roleName') : null,
      effectiveFrom: ur.get('effectiveFrom'),
      effectiveTo: ur.get('effectiveTo'),
      status: ur.status
    }));
  }

  /**
   * PATCH /api/v1/identity-admin/users/:userId/roles/:userRoleId
   * Change a role assignment's effective window, or end it early
   * (status INACTIVE / effectiveTo = now) — the lifecycle equivalent of
   * "deactivate" for a role grant instead of deleting the row.
   */
  async updateUserRole(userId, userRoleId, data, actorUserId) {
    return sequelize.transaction(async (transaction) => {
      const userRole = await UserRoles.findOne({
        where: { user_role_id: userRoleId, user_id: userId },
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (!userRole) throw notFound('User role assignment');

      const now = new Date();
      const values = { modified_by: actorUserId, modified_on: now };
      if (data.effectiveFrom !== undefined) values.effective_from = data.effectiveFrom;
      if (data.effectiveTo !== undefined) values.effective_to = data.effectiveTo;
      if (data.status !== undefined) values.status = data.status;
      if (data.status === 'INACTIVE' && data.effectiveTo === undefined) {
        values.effective_to = now; // ending a grant early defaults effectiveTo to "now"
      }

      await userRole.update(values, { transaction });

      return {
        userRoleId: Number(userRoleId),
        userId: Number(userId),
        effectiveFrom: userRole.effective_from,
        effectiveTo: userRole.effective_to,
        status: userRole.status
      };
    });
  }
}

module.exports = new UserService();
