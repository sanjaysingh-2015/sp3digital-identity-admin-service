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
      // Only present when forceChange=true, since that's the only path that runs through authenticate/authorize first.
      const actorUserId = req.auth?.userId;
      const result = await authService.changePassword({ usernameOrEmail, tenantUuid, oldPassword, newPassword, forceChange, actorUserId });
      return res.status(200).json(result);
    } catch (error) { next(error); }
  }
}

module.exports = new AuthController();
