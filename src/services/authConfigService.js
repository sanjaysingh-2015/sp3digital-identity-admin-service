const { AuthConfiguration } = require('../models');

function notFound(entity) {
  const error = new Error(`${entity} not found`);
  error.statusCode = 404;
  error.code = 'NOT_FOUND';
  error.expose = true;
  return error;
}

class AuthConfigService {
  async getConfigByTenant(tenantUuid) {
    const config = await AuthConfiguration.findOne({
      where: { tenant_uuid: tenantUuid, status: 'ACTIVE' }
    });
    if (!config) throw notFound("User");
    this._assertTenantAccess(user, context);
    return config;
  }

    /** Throws 404 (not 403) if a non-SUPERADMIN caller's tenant doesn't own this row —
   *  avoids confirming to a TENANT_ADMIN that a user in another tenant exists. */
  _assertTenantAccess(user, { tenantUuid, isSuperAdmin } = {}) {
    if (isSuperAdmin) return;
    const userTenantUuid = user.tenantUuid ?? user.tenant_uuid;
    if (userTenantUuid !== tenantUuid) throw notFound("User");
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