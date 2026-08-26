const authorizationService = require("../services/authorizationService");

class AuthorizationController {
  async getRoles(req, res, next) {
    try {
      const { page, limit, status, userType, search } = req.query;

      const roles = await authorizationService.getRoles({
        page,
        limit,
        status,
        userType,
        search,
      });
      return res.status(200).json(roles);
    } catch (error) {
      return next(error);
    }
  }

  async getRoleById(req, res, next) {
    try {
      const roles = await authorizationService.getRoleById(req.params.roleId);
      return res.status(200).json(roles);
    } catch (error) {
      return next(error);
    }
  }

  async createRole(req, res, next) {
    try {
      const role = await authorizationService.createRole(req.body);
      return res.status(201).json(role);
    } catch (error) {
      return next(error);
    }
  }

  async updateRole(req, res, next) {
    try {
      const role = await authorizationService.updateRole(
        req.params.roleId,
        req.body,
        req.auth.userId,
      );
      return res.status(201).json(role);
    } catch (error) {
      return next(error);
    }
  }

  async deleteRole(req, res, next) {
    try {
      const role = await authorizationService.deleteRole(
        req.params.roleId,
        req.body,
        req.auth.userId,
      );
      return res.status(201).json(role);
    } catch (error) {
      return next(error);
    }
  }

  async getPermissions(req, res, next) {
    try {
      const permissions = await authorizationService.getPermissions();
      return res.status(200).json(permissions);
    } catch (error) {
      return next(error);
    }
  }

  async getPermissionById(req, res, next) {
    try {
      const permission = await authorizationService.getPermissionById(
        req.params.permissionId,
      );
      return res.status(200).json(permission);
    } catch (error) {
      return next(error);
    }
  }

  async createPermission(req, res, next) {
    try {
      const permission = await authorizationService.createPermission(req.body);
      return res.status(201).json(permission);
    } catch (error) {
      return next(error);
    }
  }

  async updatePermission(req, res, next) {
    try {
      const permission = await authorizationService.updatePermission(
        req.params.permissionId,
        req.body,
        req.auth.userId,
      );
      return res.status(201).json(permission);
    } catch (error) {
      return next(error);
    }
  }

  async deletePermission(req, res, next) {
    try {
      const permission = await authorizationService.deletePermission(
        req.params.permissionId,
        req.body,
        req.auth.userId,
      );
      return res.status(201).json(permission);
    } catch (error) {
      return next(error);
    }
  }

  async assignPermissionsToRole(req, res, next) {
    try {
      const { roleId } = req.params;
      const { permissionIds } = req.body;
      const result = await authorizationService.assignPermissionsToRole(
        roleId,
        permissionIds,
      );
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  }

  async revokePermissionsToRole(req, res, next) {
    try {
      const { roleId } = req.params;
      const { permissionIds } = req.body;
      console.log("permissionIds ==> ", permissionIds);
      const result = await authorizationService.revokePermissionsToRole(
        roleId,
        permissionIds,
      );
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  }

  async getRolePermissions(req, res, next) {
    try {
      const { roleId } = req.params;
      const result = await authorizationService.getRolePermissions(roleId);
      return res.status(200).json({ items: result });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new AuthorizationController();
