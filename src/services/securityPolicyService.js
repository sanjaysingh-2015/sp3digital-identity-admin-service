const { SecurityPolicies, sequelize } = require('../models');

const defaults = {
  minPasswordLength: 12, requireUppercase: true, requireLowercase: true,
  requireNumber: true, requireSpecialCharacter: true, passwordHistoryCount: 5,
  passwordMaxAgeDays: null, maxFailedAttempts: 5, lockoutDurationMinutes: 30,
  accessTokenLifetimeMinutes: 60, refreshTokenLifetimeDays: 30,
  maxSessionDurationMinutes: 480, maxConcurrentSessions: null, mfaRequired: false
};

function toResponse(policy) {
  if (!policy) return { ...defaults, policyVersion: 0, status: 'DEFAULT' };
  const item = policy.get ? policy.get({ plain: true }) : policy;
  return {
    policyVersion: item.policy_version, minPasswordLength: item.min_password_length,
    requireUppercase: item.require_uppercase, requireLowercase: item.require_lowercase,
    requireNumber: item.require_number, requireSpecialCharacter: item.require_special_character,
    passwordHistoryCount: item.password_history_count, passwordMaxAgeDays: item.password_max_age_days,
    maxFailedAttempts: item.max_failed_attempts, lockoutDurationMinutes: item.lockout_duration_minutes,
    accessTokenLifetimeMinutes: item.access_token_lifetime_minutes,
    refreshTokenLifetimeDays: item.refresh_token_lifetime_days,
    maxSessionDurationMinutes: item.max_session_duration_minutes,
    maxConcurrentSessions: item.max_concurrent_sessions, mfaRequired: item.mfa_required,
    status: item.status, effectiveFrom: item.effective_from, effectiveTo: item.effective_to
  };
}

class SecurityPolicyService {
  async getActivePolicy(tenantUuid) {
    const policy = await SecurityPolicies.findOne({
      where: { tenant_uuid: tenantUuid, status: 'ACTIVE' },
      order: [['policy_version', 'DESC']]
    });
    return toResponse(policy);
  }

  async updatePolicy(tenantUuid, policyData, actorUserId) {
    return sequelize.transaction(async (transaction) => {
      const current = await SecurityPolicies.findOne({
        where: { tenant_uuid: tenantUuid, status: 'ACTIVE' },
        order: [['policy_version', 'DESC']], transaction, lock: transaction.LOCK.UPDATE
      });
      const previous = toResponse(current);
      const now = new Date();

      if (current) {
        await current.update({ status: 'INACTIVE', effective_to: now, modified_by: actorUserId, modified_on: now }, { transaction });
      }

      const policy = await SecurityPolicies.create({
        tenant_uuid: tenantUuid, policy_version: previous.policyVersion + 1,
        min_password_length: policyData.minPasswordLength ?? previous.minPasswordLength,
        require_uppercase: policyData.requireUppercase ?? previous.requireUppercase,
        require_lowercase: policyData.requireLowercase ?? previous.requireLowercase,
        require_number: policyData.requireNumber ?? previous.requireNumber,
        require_special_character: policyData.requireSpecialCharacter ?? previous.requireSpecialCharacter,
        password_history_count: policyData.passwordHistoryCount ?? previous.passwordHistoryCount,
        password_max_age_days: policyData.passwordMaxAgeDays ?? previous.passwordMaxAgeDays,
        max_failed_attempts: policyData.maxFailedAttempts ?? previous.maxFailedAttempts,
        lockout_duration_minutes: policyData.lockoutDurationMinutes ?? previous.lockoutDurationMinutes,
        access_token_lifetime_minutes: policyData.accessTokenLifetimeMinutes ?? previous.accessTokenLifetimeMinutes,
        refresh_token_lifetime_days: policyData.refreshTokenLifetimeDays ?? previous.refreshTokenLifetimeDays,
        max_session_duration_minutes: policyData.maxSessionDurationMinutes ?? previous.maxSessionDurationMinutes,
        max_concurrent_sessions: policyData.maxConcurrentSessions ?? previous.maxConcurrentSessions,
        mfa_required: policyData.mfaRequired ?? previous.mfaRequired,
        status: 'ACTIVE', effective_from: now, created_by: actorUserId, created_on: now,
        modified_by: actorUserId, modified_on: now
      }, { transaction });

      return toResponse(policy);
    });
  }
}

module.exports = new SecurityPolicyService();
