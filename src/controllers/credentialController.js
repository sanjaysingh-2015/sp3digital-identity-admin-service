const credentialService = require('../services/credentialService');

exports.setPassword = async (req, res, next) => {
  try {
    const result = await credentialService.setPassword(req.params.userId, req.body.password, req.auth.tenantUuid, req.auth.userId);
    return res.status(200).json(result);
  } catch (error) { return next(error); }
};

exports.rotatePassword = async (req, res, next) => {
  try {
    const result = await credentialService.rotatePassword(req.params.userId, req.body.password, req.auth.tenantUuid, req.auth.userId);
    return res.status(200).json(result);
  } catch (error) { return next(error); }
};

exports.revokeCredential = async (req, res, next) => {
  try {
    const result = await credentialService.revokeCredential(req.params.userId, req.auth.userId);
    return res.status(200).json(result);
  } catch (error) { return next(error); }
};

exports.getCredentialStatus = async (req, res, next) => {
  try {
    const result = await credentialService.getCredentialStatus(req.params.userId);
    return res.status(200).json(result);
  } catch (error) { return next(error); }
};
