const { AuthConfiguration } = require('../models');

class SecurityPolicyService {
  async getActivePolicy() {
    const policy = await AuthConfiguration.findOne({
      where: { status: 'ACTIVE' },
      order: [['config_id', 'DESC']]
    });

    if (!policy) {
      return {
        minPasswordLength: 8,
        requireUppercase: true,
        requireNumbers: true,
        maxFailedAttempts: 5,
        tokenLifetimeMinutes: 60
      };
    }

    return policy;
  }

  async updatePolicy(policyData) {
    const newPolicy = await AuthConfiguration.create({
      tenant_uuid: policyData.tenantUuid || 'default-tenant',
      allow_password_login: policyData.allowPasswordLogin ?? true,
      allow_social_login: policyData.allowSocialLogin ?? true,
      allow_mfa_enforcement: policyData.allowMfaEnforcement ?? false,
      max_session_duration_minutes: policyData.tokenLifetimeMinutes || 480,
      status: 'ACTIVE'
    });

    return newPolicy;
  }
}

module.exports = new SecurityPolicyService();