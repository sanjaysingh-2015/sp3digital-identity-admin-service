const userService = require('../services/userService');

exports.getUsers = async (req, res, next) => {
  try {
    const { page, limit, status, userType, search } = req.query;
    
    const users = await userService.getUsers(req.auth.tenantUuid, { page, limit, status, userType, search });
    return res.status(200).json(users);
  } catch (error) {
    return next(error);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.userId);
    return res.status(200).json(user);
  } catch (error) {
    return next(error);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body, req.auth.userId);
    return res.status(201).json(user);
  } catch (error) {
    return next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.userId, req.body, req.auth.userId);
    return res.status(201).json(user);
  } catch (error) {
    return next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await userService.deleteUser(req.params.userId, req.body, req.auth.userId);
    return res.status(201).json(user);
  } catch (error) {
    return next(error);
  }
};

exports.assignRole = async (req, res, next) => {
  try {
    const { roleIds, effectiveFrom, effectiveTo } = req.body;
    const result = await userService.assignRole(req.params.userId, roleIds, effectiveFrom, effectiveTo, req.auth.userId);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

exports.getUserRoles = async (req, res, next) => {
  try {
    const includeExpired = req.query.includeExpired === 'true';
    const roles = await userService.getUserRoles(req.params.userId, { includeExpired });
    return res.status(200).json({ items: roles });
  } catch (error) {
    return next(error);
  }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    const result = await userService.updateUserRole(req.params.userId, req.params.userRoleId, req.body, req.auth.userId);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};
