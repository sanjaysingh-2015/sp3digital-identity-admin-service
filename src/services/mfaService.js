const { MfaMethods, Users } = require('../models');

class MfaService {
  async getUserMfaMethods(userId) {
    return await MfaMethods.findAll({
      where: { user_id: userId },
      attributes: [
        ['mfa_method_id', 'id'],
        ['method_type', 'mfaType'],
        ['secret_encrypted', 'secret'],
        ['is_primary', 'isPrimary'],
        'status'
      ]
    });
  }

  async registerMfaMethod(userId, data) {
    const { mfaType, secret } = data;
    return await MfaMethods.create({
      user_id: userId,
      method_type: mfaType,          // 🔴 Fixed: model expects method_type
      secret_encrypted: secret,       // 🔴 Fixed: model expects secret_encrypted
      is_primary: false,
      is_verified: true,
      status: 'ACTIVE'
    });
  }

  async revokeMfaMethod(userId, mfaId) {
    const [affected] = await MfaMethods.update(
      { status: 'REVOKED' },
      { 
        where: { 
          mfa_method_id: mfaId,      // 🔴 Fixed: changed user_mfa_id to mfa_method_id
          user_id: userId 
        } 
      }
    );
    if (affected === 0) throw new Error('MFA Method not found');
    return { userId: Number(userId), mfaId: Number(mfaId), status: 'REVOKED' };
  }
}

module.exports = new MfaService();