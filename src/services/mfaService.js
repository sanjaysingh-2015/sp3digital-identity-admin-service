const { MfaMethods, Users, sequelize } = require('../models');
const { encrypt, decrypt, rotate } = require('../security/secretProtector');
const { generateSecret, verifyCode } = require('../security/totp');
const securityPolicyService = require('./securityPolicyService');
const sessionService = require('./sessionService');
const { toSequelizePage, buildEnvelope } = require('../utils/pagination');

function mfaError(statusCode, code, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  error.expose = true;
  return error;
}

function toResponse(method) {
  const item = method.get ? method.get({ plain: true }) : method;
  return {
    id: Number(item.mfa_method_id),
    mfaType: item.method_type,
    isPrimary: Boolean(item.is_primary),
    isVerified: Boolean(item.is_verified),
    status: item.status,
    lockedUntil: item.locked_until,
    lastUsedOn: item.last_used_on
  };
}

class MfaService {
  /** Paginated, status-filterable list of a user's MFA methods. */
  async getUserMfaMethods(userId, tenantUuid, { page, limit, status } = {}) {
    const { limit: safeLimit, offset, page: safePage } = toSequelizePage({ page, limit });
    const where = { user_id: userId };
    if (tenantUuid) where.tenant_uuid = tenantUuid;
    if (status) where.status = status;

    const result = await MfaMethods.findAndCountAll({
      where,
      order: [['created_on', 'DESC']],
      limit: safeLimit,
      offset
    });

    return buildEnvelope(
      { rows: result.rows.map(toResponse), count: result.count },
      { page: safePage, limit: safeLimit }
    );
  }

  async registerMfaMethod(userId, tenantUuid, data, actorUserId) {
    if (data.mfaType !== 'TOTP') throw mfaError(400, 'UNSUPPORTED_MFA_TYPE', 'Only TOTP enrollment is currently supported');

    const user = await Users.findByPk(userId);
    if (!user || user.status !== 'ACTIVE') throw mfaError(404, 'NOT_FOUND', 'Active user not found');

    const enrollmentSecret = generateSecret();
    const { payload: secretEncrypted, keyVersion } = encrypt(enrollmentSecret);

    // A method already exists as the primary/verified one only if it's ACTIVE.
    const hasActiveMethod = await MfaMethods.count({ where: { user_id: userId, status: 'ACTIVE' } });

    const method = await MfaMethods.create({
      tenant_uuid: tenantUuid,
      user_id: userId,
      method_type: 'TOTP',
      method_identifier: user.email || user.username,
      secret_encrypted: secretEncrypted,
      secret_key_version: keyVersion,
      is_primary: hasActiveMethod === 0, // first ACTIVE method becomes primary automatically
      is_verified: false,
      failed_verification_count: 0,
      status: 'PENDING',
      created_by: actorUserId,
      created_on: new Date()
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

  async verifyMfaMethod(userId, mfaId, code) {
    const method = await MfaMethods.findOne({ where: { mfa_method_id: mfaId, user_id: userId, status: 'PENDING' } });
    if (!method) throw mfaError(404, 'NOT_FOUND', 'Pending MFA method not found');
    assertNotLocked(method);

    if (!verifyCode(decrypt(method.secret_encrypted), code)) {
      await registerFailedAttempt(method);
      throw mfaError(401, 'INVALID_MFA_CODE', 'Invalid MFA verification code');
    }

    await method.update({ status: 'ACTIVE', is_verified: true, verified_on: new Date(), failed_verification_count: 0, locked_until: null });
    return toResponse(method);
  }

  /**
   * Reversible pause: method stops being usable for verification but stays
   * registered so it can be re-activated without re-enrolling.
   */
  async deactivateMfaMethod(userId, mfaId, actorUserId) {
    const method = await getOwnedMethod(userId, mfaId);
    if (method.status === 'REVOKED') throw mfaError(409, 'LIFECYCLE_CONFLICT', 'MFA method has been revoked');

    await method.update({ status: 'INACTIVE', is_primary: false, modified_by: actorUserId, modified_on: new Date() });
    return { userId: Number(userId), mfaId: Number(mfaId), status: 'INACTIVE' };
  }

  async reactivateMfaMethod(userId, mfaId, actorUserId) {
    const method = await getOwnedMethod(userId, mfaId);
    if (method.status !== 'INACTIVE') throw mfaError(409, 'LIFECYCLE_CONFLICT', 'Only an inactive MFA method can be reactivated');

    await method.update({ status: 'ACTIVE', modified_by: actorUserId, modified_on: new Date() });
    return { userId: Number(userId), mfaId: Number(mfaId), status: 'ACTIVE' };
  }

  /** Permanent revoke. Blocked if this is the user's last active method and the tenant requires MFA. */
  async revokeMfaMethod(userId, mfaId, tenantUuid, actorUserId) {
    return sequelize.transaction(async (transaction) => {
      const method = await MfaMethods.findOne({ where: { mfa_method_id: mfaId, user_id: userId }, transaction, lock: transaction.LOCK.UPDATE });
      if (!method) throw mfaError(404, 'NOT_FOUND', 'MFA method not found');
      if (method.status === 'REVOKED') return { userId: Number(userId), mfaId: Number(mfaId), status: 'REVOKED' };

      if (method.status === 'ACTIVE') {
        const policy = await securityPolicyService.getActivePolicy(tenantUuid);
        if (policy.mfaRequired) {
          const otherActive = await MfaMethods.count({
            where: { user_id: userId, status: 'ACTIVE', mfa_method_id: { [require('sequelize').Op.ne]: mfaId } },
            transaction
          });
          if (otherActive === 0) {
            throw mfaError(409, 'MFA_REQUIRED', 'Cannot revoke the last active MFA method while the security policy requires MFA');
          }
        }
      }

      await method.update({ status: 'REVOKED', is_primary: false, modified_by: actorUserId, modified_on: new Date() }, { transaction });

      if (method.is_primary) {
        await promoteNextPrimary(userId, transaction);
      }

      transaction.afterCommit(() => sessionService.revokeAllSessionsForUser(userId).catch(() => {}));

      return { userId: Number(userId), mfaId: Number(mfaId), status: 'REVOKED' };
    });
  }

  /**
   * Secret rotation: issues a brand-new TOTP secret for an existing method
   * and drops it back to PENDING so the user must re-verify before it's
   * trusted again. Old secret is immediately invalidated.
   */
  async rotateMfaSecret(userId, mfaId, actorUserId) {
    const method = await getOwnedMethod(userId, mfaId);
    if (method.status === 'REVOKED') throw mfaError(409, 'LIFECYCLE_CONFLICT', 'Cannot rotate a revoked MFA method');

    const enrollmentSecret = generateSecret();
    const { payload: secretEncrypted, keyVersion } = encrypt(enrollmentSecret);

    await method.update({
      secret_encrypted: secretEncrypted,
      secret_key_version: keyVersion,
      status: 'PENDING',
      is_verified: false,
      failed_verification_count: 0,
      locked_until: null,
      modified_by: actorUserId,
      modified_on: new Date()
    });

    const user = await Users.findByPk(userId);
    const issuer = encodeURIComponent(process.env.MFA_TOTP_ISSUER || 'SP3 Digital');
    const account = encodeURIComponent(user?.email || user?.username || `user-${userId}`);
    return {
      id: method.mfa_method_id,
      status: 'PENDING',
      provisioningUri: `otpauth://totp/${issuer}:${account}?secret=${enrollmentSecret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`
    };
  }

  /** Re-wraps an at-rest secret under the current encryption key version without changing the TOTP secret itself. */
  async rotateEncryptionKey(userId, mfaId) {
    const method = await getOwnedMethod(userId, mfaId);
    const { payload, keyVersion } = rotate(method.secret_encrypted);
    await method.update({ secret_encrypted: payload, secret_key_version: keyVersion });
    return { id: Number(mfaId), keyVersion };
  }
}

function assertNotLocked(method) {
  if (method.locked_until && new Date(method.locked_until).getTime() > Date.now()) {
    throw mfaError(423, 'MFA_LOCKED', `MFA method is locked until ${new Date(method.locked_until).toISOString()}`);
  }
}

async function registerFailedAttempt(method) {
  const failedCount = (method.failed_verification_count || 0) + 1;
  const maxAttempts = Number(process.env.MFA_MAX_FAILED_ATTEMPTS || 5);
  const lockoutMinutes = Number(process.env.MFA_LOCKOUT_MINUTES || 15);

  const values = { failed_verification_count: failedCount };
  if (failedCount >= maxAttempts) {
    values.locked_until = new Date(Date.now() + lockoutMinutes * 60_000);
  }
  await method.update(values);
}

async function getOwnedMethod(userId, mfaId) {
  const method = await MfaMethods.findOne({ where: { mfa_method_id: mfaId, user_id: userId } });
  if (!method) throw mfaError(404, 'NOT_FOUND', 'MFA method not found');
  return method;
}

async function promoteNextPrimary(userId, transaction) {
  const next = await MfaMethods.findOne({ where: { user_id: userId, status: 'ACTIVE' }, order: [['created_on', 'ASC']], transaction });
  if (next) await next.update({ is_primary: true }, { transaction });
}

module.exports = new MfaService();
