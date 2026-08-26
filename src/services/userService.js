const { Users, Roles, UserRoles, sequelize } = require("../models");
const { v4: uuidv4 } = require("uuid");
const { Op } = require("sequelize");
const { toSequelizePage, buildEnvelope } = require("../utils/pagination");
const UuidUtil = require("../utils/uuid.util");
const CodeUtil = require("../utils/code.util");
const {
  STATUS,
  notFound,
  isExpired,
  effectiveStatus,
  assertMutable,
  assertNotRevoked,
} = require("../utils/lifecycle");
const { any } = require("joi");

const USER_ATTRIBUTES = [
  ["user_id", "userId"],
  ["user_uuid", "userUuid"],
  "username",
  "email",
  ["first_name", "firstName"],
  ["middle_name", "middleName"],
  ["last_name", "lastName"],
  ["user_type", "userType"],
  ["display_name", "displayName"],
  ["phone_country_code", "phoneCountryCode"],
  ["phone_number", "phoneNumber"],
  "status",
  ["created_on", "createdOn"],
];

class UserService {
  /** GET /api/v1/identity-admin/users — paginated + filterable (status, userType, search). */
  async getUsers(tenantUuid, { page, limit, status, userType, search } = {}) {
    const {
      limit: safeLimit,
      offset,
      page: safePage,
    } = toSequelizePage({ page, limit });
    const where = {};
    if (tenantUuid) where.tenant_uuid = tenantUuid;
    if (status) where.status = status;
    if (userType) where.user_type = userType;
    if (search) {
      where[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } },
      ];
    }

    const result = await Users.findAndCountAll({
      where,
      attributes: USER_ATTRIBUTES,
      order: [["created_on", "DESC"]],
      limit: safeLimit,
      offset,
    });

    return buildEnvelope(
      { rows: result.rows, count: result.count },
      { page: safePage, limit: safeLimit },
    );
  }

  async getUserById(userId) {
    const user = await Users.findByPk(userId, {
      attributes: [
        ["user_id", "userId"],
        ["user_uuid", "userUuid"],
        "username",
        "email",
        ["first_name", "firstName"],
        ["last_name", "lastName"],
        ["user_type", "userType"],
        ["middle_name", "middleName"],
        ["display_name", "displayName"],
        ["phone_country_code", "phoneCountryCode"],
        ["phone_number", "phoneNumber"],
        "status",
      ],
    });

    if (!user) throw notFound("User");
    return user;
  }

  async createUser(userData, tenantUuid, actorUserId) {
    const userUuid = uuidv4();
    const {
      username,
      email,
      firstName,
      lastName,
      middleName,
      displayName,
      phoneCountryCode,
      phoneNumber,
      userType = "USER",
    } = userData;
    const now = new Date();

    const newUser = await Users.create({
      tenant_uuid: tenantUuid,
      user_uuid: UuidUtil.generate(),
      username,
      email,
      first_name: firstName,
      last_name: lastName,
      user_type: userType,
      middle_name: middleName,
      display_name: displayName,
      phone_country_code: phoneCountryCode,
      phone_number: phoneNumber,
      status: "ACTIVE",
      created_by: actorUserId,
      created_on: now,
    });

    return {
      userId: newUser.user_id,
      userUuid: newUser.user_uuid,
      username: newUser.username,
      email: newUser.email,
      userType: newUser.user_type,
      firstName: newUser.first_name,
      lastName: newUser.last_name,
      displayName: newUser.display_name,
      phoneCountryCode: newUser.phone_country_code,
      phoneNumber: newUser.phone_number,
      middleName: newUser.middle_name,
      status: newUser.status || "ACTIVE",
    };
  }

  async updateUser(userId, userData, actorUserId) {
    const user = await Users.findOne({ where: { user_id: userId } });
    if (!user) throw notFound("User");
    assertNotRevoked(user, "User");

    await user.update({
      first_name: userData.firstName,
      last_name: userData.lastName,
      user_type: userData.userType,
      middle_name: userData.middleName,
      display_name: userData.displayName,
      phone_country_code: userData.phoneCountryCode,
      phone_number: userData.phoneNumber,
    });
    return user;
  }

  async deleteUser(userId, userData, actorUserId) {
    const user = await Users.findOne({ where: { user_id: userId } });
    if (!user) throw notFound("User");
    assertNotRevoked(user, "User");

    await user.update({
      status: STATUS.DELETED,
      deactivated_on: new Date(),
      modified_by: actorUserId,
      modified_on: new Date(),
    });

    return user;
  }

  /** POST /api/v1/identity-admin/users/:userId/roles */
  async assignRole(userId, roleIds, effectiveFrom, effectiveTo, actorUserId) {
    const transaction = await sequelize.transaction();
     const now = new Date();
    try {
      // Remove duplicate permission IDs
      const uniqueRoleIds = [...new Set(roleIds.map((id) => Number(id)))];

      // Find existing mappings for this role
      const existingMappings = await UserRoles.findAll({
        where: {
          user_id: userId,
          role_id: uniqueRoleIds,
        },
        attributes: ["user_role_id", "role_id", "status"],
        raw: true,
        transaction,
      });

      const existingMap = new Map(
        existingMappings.map((mapping) => [Number(mapping.role_id), mapping]),
      );

      const toActivate = [];
      const toInsert = [];

      for (const roleId of uniqueRoleIds) {
        const existing = existingMap.get(roleId);

        if (existing) {
          // Existing INACTIVE mapping -> reactivate
          if (existing.status === "INACTIVE") {
            toActivate.push(roleId);
          }

          // Existing ACTIVE mapping -> do nothing
        } else {
          // No mapping -> create new one
          toInsert.push({
            user_id: userId,
            role_id: roleId,
            status: "ACTIVE",
          });
        }
      }

      // Reactivate existing mappings
      if (toActivate.length) {
        await UserRoles.update(
          {
            status: "ACTIVE",
            effective_to: null,
            effective_from: effectiveFrom || now
          },
          {
            where: {
              user_id: userId,
              role_id: toActivate,
              status: "INACTIVE",
            },
            transaction,
            logging: console.log
          },
        );
      }
console.log("Updated");
      // Insert new mappings
      if (toInsert.length) {
        await UserRoles.bulkCreate(toInsert, {
          transaction,
          logging: console.log
        });
      }
console.log("Inserted");
      await transaction.commit();
console.log("Commited");
      return {
        userId: Number(userId),
        rolesAssigned: uniqueRoleIds.length,
        rolesReactivated: toActivate.length,
        rolesCreated: toInsert.length,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // async assignRole(
  //   userId,
  //   roleIds,
  //   effectiveFrom = null,
  //   effectiveTo = null,
  //   actorUserId,
  // ) {
  //   await this.getUserById(userId);
  //   const now = new Date();
  //   const existingUserRole = await UserRoles.findOne({
  //     where: { role_id: roleIds, user_id: userId },
  //   });
  //   let userRole = any;
  //   if (existingUserRole) {
  //     userRole = existingUserRole.update({
  //       effective_from: effectiveFrom || now,
  //       effective_to: effectiveTo,
  //       status: "ACTIVE",
  //       modified_by: actorUserId,
  //       modified_on: now,
  //     });
  //   } else {
  //     userRole = await UserRoles.create({
  //       user_id: userId,
  //       role_id: roleId,
  //       effective_from: effectiveFrom || now,
  //       effective_to: effectiveTo,
  //       status: "ACTIVE",
  //       created_by: actorUserId,
  //       created_on: now,
  //     });
  //   }

  //   return {
  //     userRoleId: userRole.user_role_id,
  //     userId: Number(userId),
  //     roleId: Number(roleId),
  //     effectiveFrom: userRole.effective_from,
  //     effectiveTo: userRole.effective_to,
  //     status: userRole.status || "ACTIVE",
  //   };
  // }

  /**
   * GET /api/v1/identity-admin/users/:userId/roles
   * By default only returns roles that are effective right now
   * (effective_from <= now <= effective_to, treating a null bound as open-ended).
   * Pass includeExpired=true to see the full assignment history.
   */
  async getUserRoles(userId, { includeExpired = false } = {}) {
    const now = new Date();
    const where = { user_id: userId, status: "ACTIVE" };
    if (!includeExpired) {
      where[Op.and] = [
        {
          [Op.or]: [
            { effective_from: null },
            { effective_from: { [Op.lte]: now } },
          ],
        },
        {
          [Op.or]: [
            { effective_to: null },
            { effective_to: { [Op.gte]: now } },
          ],
        },
      ];
    }

    const userRoles = await UserRoles.findAll({
      where,
      attributes: [
        ["user_role_id", "userRoleId"],
        ["effective_from", "effectiveFrom"],
        ["effective_to", "effectiveTo"],
        "status",
      ],
      include: [
        {
          model: Roles,
          attributes: [
            ["role_id", "roleId"],
            ["role_code", "roleCode"],
            ["role_name", "roleName"],
          ],
        },
      ],
      logging: console.log
    });

    return userRoles.map((ur) => ({
      userRoleId: ur.get("userRoleId"),
      roleId: ur.Role ? ur.Role.get("roleId") : null,
      roleCode: ur.Role ? ur.Role.get("roleCode") : null,
      roleName: ur.Role ? ur.Role.get("roleName") : null,
      effectiveFrom: ur.get("effectiveFrom"),
      effectiveTo: ur.get("effectiveTo"),
      status: ur.status,
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
        lock: transaction.LOCK.UPDATE,
      });
      if (!userRole) throw notFound("User role assignment");

      const now = new Date();
      const values = { modified_by: actorUserId, modified_on: now };
      if (data.effectiveFrom !== undefined)
        values.effective_from = data.effectiveFrom;
      if (data.effectiveTo !== undefined)
        values.effective_to = data.effectiveTo;
      if (data.status !== undefined) values.status = data.status;
      if (data.status === "INACTIVE" && data.effectiveTo === undefined) {
        values.effective_to = now; // ending a grant early defaults effectiveTo to "now"
      }

      await userRole.update(values, { transaction });

      return {
        userRoleId: Number(userRoleId),
        userId: Number(userId),
        effectiveFrom: userRole.effective_from,
        effectiveTo: userRole.effective_to,
        status: userRole.status,
      };
    });
  }
}

module.exports = new UserService();
