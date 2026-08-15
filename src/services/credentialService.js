const bcrypt = require('bcrypt');
const { Users, UserCredentials } = require('../models');
const securityPolicyService = require('./securityPolicyService');

function validatePassword(password, policy) {
  if (password.length < policy.minPasswordLength) throw new Error('Password does not meet the minimum length');
  if (policy.requireUppercase && !/[A-Z]/.test(password)) throw new Error('Password must contain an uppercase letter');
  if (policy.requireLowercase && !/[a-z]/.test(password)) throw new Error('Password must contain a lowercase letter');
  if (policy.requireNumber && !/\d/.test(password)) throw new Error('Password must contain a number');
  if (policy.requireSpecialCharacter && !/[^A-Za-z0-9]/.test(password)) throw new Error('Password must contain a special character');
}

class CredentialService {
  async setPassword(userId, password, tenantUuid, actorUserId) {
    const user = await Users.findByPk(userId);
    if (!user || user.status !== 'ACTIVE') throw new Error('Active user not found');
    const policy = await securityPolicyService.getActivePolicy(tenantUuid);
    validatePassword(password, policy);
    const passwordHash = await bcrypt.hash(password, 12);
    const values = { password_hash: passwordHash, password_algorithm: 'bcrypt', password_changed_on: new Date(), modified_by: actorUserId, modified_on: new Date(), status: 'ACTIVE' };
    const credential = await UserCredentials.findOne({ where: { user_id: userId, credential_type: 'PASSWORD', status: 'ACTIVE' } });
    if (credential) await credential.update(values);
    else await UserCredentials.create({ user_id: userId, credential_type: 'PASSWORD', created_by: actorUserId, created_on: new Date(), ...values });
    await user.update({ password_changed_on: new Date(), modified_by: actorUserId, modified_on: new Date() });
    return { userId: Number(userId), passwordUpdated: true };
  }
}

module.exports = new CredentialService();
