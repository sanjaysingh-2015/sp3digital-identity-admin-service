const { UserMfaMethod, User } = require('../models');

class MfaService {
  async getUserMfaMethods(userId) {
    return await UserMfaMethod.findAll({
      where: { user_id: userId },
      attributes: [
        ['user_mfa_id', 'id'],
        ['mfa_type', 'mfaType'],
        'secret',
        ['is_default', 'isDefault'],
        'status'
      ]
    });
  }

  async registerMfaMethod(userId, data) {
    const { mfaType, secret } = data;
    return await UserMfaMethod.create({
      user_id: userId,
      mfa_type: mfaType,
      secret: secret,
      is_default: false,
      status: 'ACTIVE'
    });
  }

  async revokeMfaMethod(userId, mfaId) {
    const [affected] = await UserMfaMethod.update(
      { status: 'REVOKED' },
      { where: { user_mfa_id: mfaId, user_id: userId } }
    );
    if (affected === 0) throw new Error('MFA Method not found');
    return { userId: Number(userId), mfaId: Number(mfaId), status: 'REVOKED' };
  }
}

module.exports = new MfaService();