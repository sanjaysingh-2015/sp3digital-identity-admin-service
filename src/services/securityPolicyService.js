const { SecurityPolicy } = require('../models');

class SecurityPolicyService {
  async getActivePolicy() {
    const policy = await SecurityPolicy.findOne({
      where: { status: 'ACTIVE' },
      order: [['created_on', 'DESC']]
    });

    if (!policy) {
      // Default fallback policy
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
    const newPolicy = await SecurityPolicy.create({
      min_password_length: policyData.minPasswordLength || 8,
      require_uppercase: policyData.requireUppercase ?? true,
      require_numbers: policyData.requireNumbers ?? true,
      max_failed_attempts: policyData.maxFailedAttempts || 5,
      token_lifetime_minutes: policyData.tokenLifetimeMinutes || 60,
      status: 'ACTIVE'
    });
    return newPolicy;
  }
}

module.exports = new SecurityPolicyService();