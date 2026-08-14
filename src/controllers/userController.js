const userService = require('../services/userService');

exports.getUsers = async (req, res) => {
  try {
    const users = await userService.getUsers();
    res.status(200).json({ items: users, totalElements: users.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.userId);
    res.status(200).json(user);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.assignRole = async (req, res) => {
  try {
    const { roleId, effectiveFrom, effectiveTo } = req.body;
    if (!roleId) {
      return res.status(400).json({ error: 'roleId is required' });
    }
    const result = await userService.assignRole(
      req.params.userId,
      roleId,
      effectiveFrom,
      effectiveTo
    );
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getUserRoles = async (req, res) => {
  try {
    const roles = await userService.getUserRoles(req.params.userId);
    res.status(200).json({ items: roles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};