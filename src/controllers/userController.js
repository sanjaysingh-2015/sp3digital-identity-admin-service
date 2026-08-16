const userService = require('../services/userService');

exports.getUsers = async (req, res, next) => {
  try {
    const { page, limit, status, userType, search } = req.query;
    const users = await userService.getUsers(req.auth.tenantUuid, { page, limit, status, userType, search });
    return res.status(200).json(users);
  } catch (err) { return next(err); }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.userId);
    return res.status(200).json(user);
  } catch (err) { return next(err); }
};

exports.createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body, req.auth.tenantUuid, req.auth.userId);
    return res.status(201).json(user);
  } catch (err) { return next(err); }
};

exports.assignRole = async (req, res, next) => {
  try {
    const { roleId, effectiveFrom, effectiveTo } = req.body;
    const result = await userService.assignRole(req.params.userId, roleId, effectiveFrom, effectiveTo, req.auth.userId);
    return res.status(200).json(result);
  } catch (err) { return next(err); }
};

exports.getUserRoles = async (req, res, next) => {
  try {
    const includeExpired = req.query.includeExpired === 'true';
    const roles = await userService.getUserRoles(req.params.userId, { includeExpired });
    return res.status(200).json({ items: roles });
  } catch (err) { return next(err); }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    const result = await userService.updateUserRole(req.params.userId, req.params.userRoleId, req.body, req.auth.userId);
    return res.status(200).json(result);
  } catch (err) { return next(err); }
};
