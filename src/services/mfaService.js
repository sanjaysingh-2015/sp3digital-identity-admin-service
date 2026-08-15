const { MfaMethods, Users } = require('../models');
const { encrypt, decrypt } = require('../security/secretProtector');
const { generateSecret, verifyCode } = require('../security/totp');

class MfaService {
  async getUserMfaMethods(userId) {
    return await MfaMethods.findAll({
      where: { user_id: userId },
      attributes: [
        ['mfa_method_id', 'id'],
        ['method_type', 'mfaType'],
        ['is_primary', 'isPrimary'],
        ['is_verified', 'isVerified'],
        'status'
      ]
    });
  }

  async registerMfaMethod(userId, data) {
    if (data.mfaType !== 'TOTP') throw new Error('Only TOTP enrollment is currently supported');
    const user = await Users.findByPk(userId);
    if (!user || user.status !== 'ACTIVE') throw new Error('Active user not found');
    const enrollmentSecret = generateSecret();
    const secret = encrypt(enrollmentSecret);
    const mfaType = 'TOTP';
    const method = await MfaMethods.create({
      user_id: userId,
      method_type: mfaType,          // 🔴 Fixed: model expects method_type
      secret_encrypted: secret,       // 🔴 Fixed: model expects secret_encrypted
      method_type: 'TOTP',
      method_identifier: user.email || user.username,
      secret_encrypted: secret,
      is_primary: false,
      is_verified: false,
      status: 'PENDING'
    });
    const issuer = encodeURIComponent(process.env.MFA_TOTP_ISSUER || 'SP3 Digital');
    const account = encodeURIComponent(user.email || user.username || `user-${userId}`);
    return {
      id: method.mfa_method_id,
      mfaType: 'TOTP',
      status: 'PENDING',
      provisioningUri: `otpauth://totp/${issuer}:${account}?secret=${enrollmentSecret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`
    };
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

  async verifyMfaMethod(userId, mfaId, code) {
    const method = await MfaMethods.findOne({
      where: { mfa_method_id: mfaId, user_id: userId, status: 'PENDING' }
    });
    if (!method) throw new Error('Pending MFA method not found');
    if (!verifyCode(decrypt(method.secret_encrypted), code)) throw new Error('Invalid MFA verification code');

    await method.update({ status: 'ACTIVE', is_verified: true, verified_on: new Date() });
    return { userId: Number(userId), mfaId: Number(mfaId), status: 'ACTIVE', isVerified: true };
  }
}

module.exports = new MfaService();
