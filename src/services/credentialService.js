const bcrypt = require('bcrypt');
const { Users, UserCredentials, UserCredentialHistory, sequelize } = require('../models');
const securityPolicyService = require('./securityPolicyService');
const sessionService = require('./sessionService');

const BCRYPT_COST = Number(process.env.PASSWORD_BCRYPT_COST || 12);

function validationError(message) {
  const error = new Error(message);
  error.statusCode = 422;
  error.code = 'PASSWORD_POLICY_VIOLATION';
  error.expose = true;
  return error;
}

function validatePasswordComplexity(password, policy) {
  if (typeof password !== 'string' || password.length < policy.minPasswordLength) {
    throw validationError(`Password must be at least ${policy.minPasswordLength} characters`);
  }
  if (policy.requireUppercase && !/[A-Z]/.test(password)) throw validationError('Password must contain an uppercase letter');
  if (policy.requireLowercase && !/[a-z]/.test(password)) throw validationError('Password must contain a lowercase letter');
  if (policy.requireNumber && !/\d/.test(password)) throw validationError('Password must contain a number');
  if (policy.requireSpecialCharacter && !/[^A-Za-z0-9]/.test(password)) throw validationError('Password must contain a special character');
}

function addDays(date, days) {
  if (!days) return null;
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function toResponse(credential) {
  if (!credential) return null;
  const item = credential.get ? credential.get({ plain: true }) : credential;
  return {
    credentialId: Number(item.credential_id),
    userId: Number(item.user_id),
    credentialType: item.credential_type,
    status: item.status,
    rotationRequired: Boolean(item.rotation_required),
    lastUsedOn: item.last_used_on,
    passwordExpiresOn: item.password_expires_on,
    lockedUntil: item.locked_until,
    modifiedOn: item.modified_on
  };
}

class CredentialService {
  /**
   * Verifies a plaintext password against the user's active credential.
   * Checks lock state up front, and records success/failure via
   * clearFailedAttempts()/recordFailedAttempt() so lockout policy is
   * enforced consistently regardless of caller (login, re-auth, etc).
   */
  async verifyPassword(userId, tenantUuid, password) {
    const credential = await UserCredentials.findOne({
      where: { user_id: userId, credential_type: 'PASSWORD', status: 'ACTIVE' }
    });
    if (!credential) throw authError('CREDENTIAL_NOT_SET', 'No active password credential for this user');

    if (credential.locked_until && new Date(credential.locked_until).getTime() > Date.now()) {
      throw authError('ACCOUNT_LOCKED', `Account is locked until ${new Date(credential.locked_until).toISOString()}`, 423);
    }

    const matches = await bcrypt.compare(password, credential.password_hash);
    if (!matches) {
      await this.recordFailedAttempt(userId, tenantUuid);
      throw authError('INVALID_CREDENTIALS', 'Invalid username or password');
    }

    const expired = credential.password_expires_on && new Date(credential.password_expires_on).getTime() <= Date.now();
    await this.clearFailedAttempts(userId);

    return {
      verified: true,
      rotationRequired: Boolean(credential.rotation_required) || Boolean(expired)
    };
  }

  /**
   * Sets/rotates a user's password. Enforces the tenant's active security
   * policy: complexity, reuse against passwordHistoryCount prior hashes,
   * and computes the next password_expires_on from passwordMaxAgeDays.
   *
   * @param {object} options.forceRotationOnNextLogin marks the credential so
   *   downstream login flows can require an immediate change (e.g. admin reset).
   */
  async setPassword(userId, password, tenantUuid, actorUserId, { forceRotationOnNextLogin = false } = {}) {
    const user = await Users.findByPk(userId);
    if (!user || user.status !== 'ACTIVE') throw notFoundOrInactive();

    const policy = await securityPolicyService.getActivePolicy(tenantUuid);
    validatePasswordComplexity(password, policy);

    return sequelize.transaction(async (transaction) => {
      const credential = await UserCredentials.findOne({
        where: { user_id: userId, credential_type: 'PASSWORD' },
        order: [['credential_id', 'DESC']],
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      await assertNotReused(userId, password, policy.passwordHistoryCount, transaction);

      const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
      const now = new Date();
      const values = {
        password_hash: passwordHash,
        password_algorithm: 'bcrypt',
        password_expires_on: addDays(now, policy.passwordMaxAgeDays),
        rotation_required: forceRotationOnNextLogin,
        failed_verification_count: 0,
        locked_until: null,
        status: 'ACTIVE',
        modified_by: actorUserId,
        modified_on: now
      };

      if (credential) {
        await archiveCredential(credential, transaction);
        await credential.update(values, { transaction });
      } else {
        await UserCredentials.create(
          { user_id: userId, credential_type: 'PASSWORD', created_by: actorUserId, created_on: now, ...values },
          { transaction }
        );
      }

      await trimCredentialHistory(userId, policy.passwordHistoryCount, transaction);
      await user.update({ password_changed_on: now, modified_by: actorUserId, modified_on: now }, { transaction });

      // Changing the password invalidates any session/tokens issued under the old one.
      transaction.afterCommit(() => sessionService.revokeAllSessionsForUser(userId).catch(() => {}));

      return {
        userId: Number(userId),
        passwordUpdated: true,
        passwordExpiresOn: values.password_expires_on,
        rotationRequired: values.rotation_required
      };
    });
  }

  /** Administrative forced rotation: same as setPassword but always flags rotation_required. */
  async rotatePassword(userId, password, tenantUuid, actorUserId) {
    return this.setPassword(userId, password, tenantUuid, actorUserId, { forceRotationOnNextLogin: true });
  }

  /** Permanently blocks the credential from being used (e.g. offboarding, compromise). */
  async revokeCredential(userId, actorUserId) {
    const credential = await UserCredentials.findOne({ where: { user_id: userId, credential_type: 'PASSWORD', status: 'ACTIVE' } });
    if (!credential) throw notFound('Active credential');

    await credential.update({ status: 'REVOKED', modified_by: actorUserId, modified_on: new Date() });
    await sessionService.revokeAllSessionsForUser(userId);
    return { userId: Number(userId), status: 'REVOKED' };
  }

  /** Read-only lifecycle status: expiry, rotation flag, lock state. Used by admin UI + login flows. */
  async getCredentialStatus(userId) {
    const credential = await UserCredentials.findOne({
      where: { user_id: userId, credential_type: 'PASSWORD' },
      order: [['credential_id', 'DESC']]
    });
    return toResponse(credential) || { userId: Number(userId), status: 'NOT_SET' };
  }

  /**
   * Records a failed password check against the active security policy's
   * maxFailedAttempts/lockoutDurationMinutes. Called by the authenticating
   * service (login), kept here since lockout is a credential concern.
   */
  async recordFailedAttempt(userId, tenantUuid) {
    const policy = await securityPolicyService.getActivePolicy(tenantUuid);
    const credential = await UserCredentials.findOne({ where: { user_id: userId, credential_type: 'PASSWORD', status: 'ACTIVE' } });
    if (!credential) return null;

    const failedCount = (credential.failed_verification_count || 0) + 1;
    const values = { failed_verification_count: failedCount, modified_on: new Date() };
    if (failedCount >= policy.maxFailedAttempts) {
      values.locked_until = new Date(Date.now() + policy.lockoutDurationMinutes * 60_000);
    }
    await credential.update(values);
    return toResponse(credential);
  }

  /** Clears failed-attempt counters after a successful authentication. */
  async clearFailedAttempts(userId) {
    await UserCredentials.update(
      { failed_verification_count: 0, locked_until: null, last_used_on: new Date() },
      { where: { user_id: userId, credential_type: 'PASSWORD', status: 'ACTIVE' } }
    );
  }
}

function authError(code, message, statusCode = 401) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  error.expose = true;
  return error;
}

function notFoundOrInactive() {
  const error = new Error('Active user not found');
  error.statusCode = 404;
  error.code = 'NOT_FOUND';
  error.expose = true;
  return error;
}

function notFound(entity) {
  const error = new Error(`${entity} not found`);
  error.statusCode = 404;
  error.code = 'NOT_FOUND';
  error.expose = true;
  return error;
}

async function assertNotReused(userId, plainPassword, historyCount, transaction) {
  if (!historyCount || historyCount <= 0) return;

  const recentHashes = await UserCredentialHistory.findAll({
    where: { user_id: userId, credential_type: 'PASSWORD' },
    order: [['created_on', 'DESC']],
    limit: historyCount,
    transaction
  });

  for (const record of recentHashes) {
    if (await bcrypt.compare(plainPassword, record.password_hash)) {
      throw validationError(`Password must not match any of the last ${historyCount} passwords used`);
    }
  }
}

async function archiveCredential(credential, transaction) {
  if (!credential.password_hash) return;
  await UserCredentialHistory.create(
    {
      user_id: credential.user_id,
      credential_type: credential.credential_type,
      password_hash: credential.password_hash,
      password_algorithm: credential.password_algorithm || 'bcrypt'
    },
    { transaction }
  );
}

async function trimCredentialHistory(userId, historyCount, transaction) {
  if (!historyCount || historyCount <= 0) return;

  const toKeep = await UserCredentialHistory.findAll({
    where: { user_id: userId, credential_type: 'PASSWORD' },
    order: [['created_on', 'DESC']],
    limit: historyCount,
    attributes: ['history_id'],
    transaction
  });
  const keepIds = toKeep.map((record) => record.history_id);

  await UserCredentialHistory.destroy({
    where: { user_id: userId, credential_type: 'PASSWORD', history_id: { [require('sequelize').Op.notIn]: keepIds.length ? keepIds : [0] } },
    transaction
  });
}

module.exports = new CredentialService();
