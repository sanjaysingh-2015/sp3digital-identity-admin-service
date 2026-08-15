const credentialService = require('../services/credentialService');

exports.setPassword = async (req, res, next) => {
  try {
    const result = await credentialService.setPassword(req.params.userId, req.body.password, req.auth.tenantUuid, req.auth.userId);
    return res.status(200).json(result);
  } catch (error) { return next(error); }
};
