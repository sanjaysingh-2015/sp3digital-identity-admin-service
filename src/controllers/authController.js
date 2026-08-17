const authService = require('../services/authService');

function clientMeta(req) {
  return { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

class AuthController {
  async login(req, res, next) {
    try {
      const { usernameOrEmail, password, tenantUuid } = req.body;
      const audience = process.env.ADMIN_JWT_AUDIENCE;
      const result = await authService.login({ usernameOrEmail, password, tenantUuid, audience }, clientMeta(req));
      return res.status(200).json(result);
    } catch (error) { next(error); }
  }

  async completeMfaLogin(req, res, next) {
    try {
      const { mfaToken, code } = req.body;
      const audience = process.env.ADMIN_JWT_AUDIENCE;
      const result = await authService.completeMfaLogin({ mfaToken, code, audience }, clientMeta(req));
      return res.status(200).json(result);
    } catch (error) { next(error); }
  }

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const audience = process.env.ADMIN_JWT_AUDIENCE;
      const result = await authService.refresh({ refreshToken, audience }, clientMeta(req));
      return res.status(200).json(result);
    } catch (error) { next(error); }
  }

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.logout(refreshToken);
      return res.status(200).json(result);
    } catch (error) { next(error); }
  }

  async changePassword(req, res, next) {
    try {
      const { usernameOrEmail, tenantUuid, oldPassword, newPassword, forceChange } = req.body;
      // No authenticated caller for either mode now — req.auth does not exist on this
      // fully-public route. authService.changePassword() falls back to the target
      // user as their own actor when actorUserId is undefined.
      const result = await authService.changePassword({ usernameOrEmail, tenantUuid, oldPassword, newPassword, forceChange });
      return res.status(200).json(result);
    } catch (error) { next(error); }
  }
}

module.exports = new AuthController();
