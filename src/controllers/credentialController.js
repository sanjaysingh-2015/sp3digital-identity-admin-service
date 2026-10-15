const credentialService = require('../services/credentialService');
const { Users } = require('../models');

function userNotFound() {
  const error = new Error('User not found');
  error.statusCode = 404;
  error.code = 'NOT_FOUND';
  error.expose = true;
  return error;
}

/**
 * The user this request targets — but only if the caller may act on them: a user of
 * the caller's own tenant, or any user for a SUPERADMIN. Anyone else gets the same
 * 404 as for a user that does not exist, so ids cannot be probed across tenants.
 *
 * Without this check any administrator could set (or revoke) the password of a user
 * in another tenant just by knowing the numeric user id.
 */
async function targetUser(req) {
  const user = await Users.findByPk(req.params.userId, { attributes: ['user_id', 'tenant_uuid'] });
  if (!user || (!req.auth.isSuperAdmin && user.tenant_uuid !== req.auth.tenantUuid)) throw userNotFound();
  return user;
}

// The password policy applied is the TARGET user's tenant's (for a SUPERADMIN acting
// across tenants that is not the caller's own).
exports.setPassword = async (req, res, next) => {
  try {
    const user = await targetUser(req);
    const result = await credentialService.setPassword(user.user_id, req.body.password, user.tenant_uuid, req.auth.userId);
    return res.status(200).json(result);
  } catch (error) { return next(error); }
};

exports.rotatePassword = async (req, res, next) => {
  try {
    const user = await targetUser(req);
    const result = await credentialService.rotatePassword(user.user_id, req.body.password, user.tenant_uuid, req.auth.userId);
    return res.status(200).json(result);
  } catch (error) { return next(error); }
};

exports.revokeCredential = async (req, res, next) => {
  try {
    const user = await targetUser(req);
    const result = await credentialService.revokeCredential(user.user_id, req.auth.userId);
    return res.status(200).json(result);
  } catch (error) { return next(error); }
};

exports.getCredentialStatus = async (req, res, next) => {
  try {
    const user = await targetUser(req);
    const result = await credentialService.getCredentialStatus(user.user_id);
    return res.status(200).json(result);
  } catch (error) { return next(error); }
};
