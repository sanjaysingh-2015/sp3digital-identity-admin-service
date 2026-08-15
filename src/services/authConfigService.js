const { AuthConfiguration } = require('../models');

class AuthConfigService {
  async getConfigByTenant(tenantUuid) {
    const config = await AuthConfiguration.findOne({
      where: { tenant_uuid: tenantUuid, status: 'ACTIVE' }
    });
    if (!config) {
      throw new Error('Authentication configuration not found for tenant');
    }
    return config;
  }

  async updateConfig(tenantUuid, data) {
    let [config, created] = await AuthConfiguration.findOrCreate({
      where: { tenant_uuid: tenantUuid },
      defaults: {
        tenant_uuid: tenantUuid,
        allow_password_login: data.allowPasswordLogin ?? true,
        allow_social_login: data.allowSocialLogin ?? true,
        allow_mfa_enforcement: data.allowMfaEnforcement ?? false,
        max_session_duration_minutes: data.maxSessionDurationMinutes || 480,
        status: 'ACTIVE'
      }
    });

    if (!created) {
      await config.update({
        allow_password_login: data.allowPasswordLogin ?? config.allow_password_login,
        allow_social_login: data.allowSocialLogin ?? config.allow_social_login,
        allow_mfa_enforcement: data.allowMfaEnforcement ?? config.allow_mfa_enforcement,
        max_session_duration_minutes: data.maxSessionDurationMinutes || config.max_session_duration_minutes
      });
    }

    return config;
  }
}

module.exports = new AuthConfigService();