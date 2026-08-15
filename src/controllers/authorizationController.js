const authorizationService = require('../services/authorizationService');

class AuthorizationController {
  async getRoles(req, res, next) {
    try {
      const roles = await authorizationService.getRoles();
      return res.status(200).json(roles);
    } catch (error) {
      next(error);
    }
  }

  async createRole(req, res, next) {
    try {
      const role = await authorizationService.createRole(req.body);
      return res.status(201).json(role);
    } catch (error) {
      next(error);
    }
  }

  async getPermissions(req, res, next) {
    try {
      const permissions = await authorizationService.getPermissions();
      return res.status(200).json(permissions);
    } catch (error) {
      next(error);
    }
  }

  async assignPermissionsToRole(req, res, next) {
    try {
      const { roleId } = req.params;
      const { permissionIds } = req.body;
      const result = await authorizationService.assignPermissionsToRole(roleId, permissionIds);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthorizationController();