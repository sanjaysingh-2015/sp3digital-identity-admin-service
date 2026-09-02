const { Op, fn, col } = require("sequelize");
const { ResourceMaster, ActionMaster } = require("../models");
const {
  STATUS,
  notFound,
  isExpired,
  effectiveStatus,
  assertMutable,
  assertNotRevoked,
} = require("../utils/lifecycle");

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

class ResourceActionService {
  // =========================================================
  // RESOURCE MASTER
  // =========================================================
  async getResources({ page, limit, status, userType, search } = {}) {
    const {
      limit: safeLimit,
      offset,
      page: safePage,
    } = toSequelizePage({ page, limit });
    const where = {};
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { resource_name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    const result = await ResourceMaster.findAndCountAll({
      where,
      attributes: [
        ["resource_code", "resourceCode"],
        ["resource_name", "resourceName"],
        "description",
        ["resource_category", "resourceCategory"],
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

  async getResourceById(resourceId) {
    const result = await ResourceMaster.findByPk(resourceId, {
      attributes: [
        ["resource_code", "resourceCode"],
        ["resource_name", "resourceName"],
        "description",
        ["resource_category", "resourceCategory"],
        "status",
      ],
    });

    if (!result) throw notFound("Resource");
    return result;
  }

  async getResourceCategories() {
    const resourceCategories = await ResourceMaster.findAll({
      attributes: [
        [
          ResourceMaster.sequelize.fn("DISTINCT", ResourceMaster.sequelize.col("resource_category"),),
          "resource_category",
        ],
      ],
      where: {
        resource_category: { [Op.ne]: null, },
        status: "ACTIVE",
      },
      order: [["resource_category", "ASC"]],
      raw: true,
    });

    return resourceCategories.map((item) => item.resource_category);
  }

  async getResourceByCategory(category) {
    const result = await ResourceMaster.findAll({
      where: { resource_category: category },
      attributes: [
        ["resource_code", "resourceCode"],
        ["resource_name", "resourceName"],
        "description",
        ["resource_category", "resourceCategory"],
        "status",
      ],
    });

    if (!result) throw notFound("Resource");
    return result;
  }

  async createResource(resourceData) {
    const resource = await ResourceMaster.create({
      resource_code: resourceData.resourceCode,
      resource_name: resourceData.resourceName,
      description: resourceData.description,
      resource_category: resourceData.resourceCategory,
      status: resourceCategory.status || "ACTIVE",
    });
    return resource;
  }

  async updateResource(resourceId, resourceData, actorUserId) {
    const resource = await ResourceMaster.findOne({
      where: { role_id: roleId },
    });
    if (!resource) throw notFound("Resource");
    assertNotRevoked(resourceData, "Resource");
    await role.update({
      resource_code: resourceData.resourceCode,
      resource_name: resourceData.resourceName,
      description: resourceData.description,
      resource_category: resourceData.resourceCategory,
    });
    return resource;
  }

  async deleteResource(roleId, roleData, actorUserId) {
    const resource = await ResourceMaster.findOne({
      where: { role_id: roleId },
    });
    if (!resource) throw notFound("Resource");
    assertNotRevoked(resourceData, "Resource");

    await resource.update({
      status: STATUS.DELETED,
      deactivated_on: new Date(),
      modified_by: actorUserId,
      modified_on: new Date(),
    });

    return resource;
  }

  // =========================================================
  // ACTION MASTER
  // =========================================================

  async getActions({ page, limit, status, userType, search } = {}) {
    const {
      limit: safeLimit,
      offset,
      page: safePage,
    } = toSequelizePage({ page, limit });
    const where = {};
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { action_name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    const result = await ActionMaster.findAndCountAll({
      where,
      attributes: [
        ["action_code", "actionCode"],
        ["action_name", "actionName"],
        ["action_category", "actionCategory"],
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

  async getActionById(actionId) {
    const result = await ActionMaster.findByPk(actionId, {
      attributes: [
        ["action_code", "actionCode"],
        ["action_name", "actionName"],
        ["action_category", "actionCategory"],
        "description",
        "status",
      ],
    });

    if (!result) throw notFound("Action");
    return result;
  }

  async getActionByCategory(category) {
    const result = await ActionMaster.findAll({
      where: { action_category: category },
      attributes: [
        ["action_code", "actionCode"],
        ["action_name", "actionName"],
        ["action_category", "actionCategory"],
        "description",
        "status",
      ],
    });

    if (!result) throw notFound("Action");
    return result;
  }

  async getActionCategories() {
    const actionCategories = await ActionMaster.findAll({
      attributes: [
        [
          ActionMaster.sequelize.fn("DISTINCT", ActionMaster.sequelize.col("action_category"),),
          "action_category",
        ],
      ],
      where: {
        action_category: { [Op.ne]: null, },
        status: "ACTIVE",
      },
      order: [["action_category", "ASC"]],
      raw: true,
    });

    return actionCategories.map((item) => item.action_category);
  }

  async createAction(actionData) {
    const action = await ActionMaster.create({
      action_code: actionData.actionCode,
      action_name: actionData.actionName,
      description: actionData.description,
      action_category: actionData.actionCategory,
      status: actionData.status || "ACTIVE",
    });
    return action;
  }

  async updateAction(ActionId, actionData, actorUserId) {
    const action = await ActionMaster.findOne({
      where: { action_id: actionId },
    });
    if (!action) throw notFound("Action");
    assertNotRevoked(actionData, "Action");
    await role.update({
      action_code: actionData.actionCode,
      action_name: actionData.actionName,
      description: actionData.description,
      action_category: actionData.actionCategory,
    });
    return action;
  }

  async deleteRole(roleId, roleData, actorUserId) {
    const action = await ActionMaster.findOne({
      where: { action_id: actionId },
    });
    if (!action) throw notFound("Action");
    assertNotRevoked(actionData, "Action");

    await action.update({
      status: STATUS.DELETED,
      deactivated_on: new Date(),
      modified_by: actorUserId,
      modified_on: new Date(),
    });

    return role;
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

module.exports = new ResourceActionService();
