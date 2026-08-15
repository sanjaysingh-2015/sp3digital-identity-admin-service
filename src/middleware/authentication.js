const axios = require('axios');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Users, UserRoles, Roles, RolePermissions, Permissions } = require('../models');

let jwksCache;

function authError(statusCode, code, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  error.expose = true;
  return error;
}

function getBearerToken(header) {
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
}

async function getJwks(url) {
  if (jwksCache?.url === url && jwksCache.expiresAt > Date.now()) return jwksCache.keys;

  const response = await axios.get(url, { timeout: 5_000 });
  if (!Array.isArray(response.data?.keys)) {
    throw authError(503, 'AUTH_CONFIGURATION_ERROR', 'JWKS endpoint returned an invalid response');
  }

  jwksCache = { url, keys: response.data.keys, expiresAt: Date.now() + 10 * 60 * 1000 };
  return jwksCache.keys;
}

async function verifyToken(token) {
  const options = {
    issuer: process.env.ADMIN_JWT_ISSUER || undefined,
    audience: process.env.ADMIN_JWT_AUDIENCE || undefined
  };

  if (process.env.ADMIN_JWT_SECRET) {
    return jwt.verify(token, process.env.ADMIN_JWT_SECRET, {
      ...options,
      algorithms: ['HS256', 'HS384', 'HS512']
    });
  }

  if (!process.env.ADMIN_JWKS_URL) {
    throw authError(503, 'AUTH_CONFIGURATION_ERROR', 'No admin JWT verifier is configured');
  }

  const decoded = jwt.decode(token, { complete: true });
  if (!decoded?.header?.kid) throw authError(401, 'INVALID_TOKEN', 'JWT header does not include a key identifier');

  const keys = await getJwks(process.env.ADMIN_JWKS_URL);
  const jwk = keys.find((key) => key.kid === decoded.header.kid);
  if (!jwk) throw authError(401, 'INVALID_TOKEN', 'JWT signing key is not recognized');

  return jwt.verify(token, crypto.createPublicKey({ key: jwk, format: 'jwk' }), {
    ...options,
    algorithms: ['RS256', 'RS384', 'RS512']
  });
}

function scopesFromClaims(claims) {
  if (Array.isArray(claims.permissions)) return new Set(claims.permissions);
  if (Array.isArray(claims.scp)) return new Set(claims.scp);
  if (typeof claims.scope === 'string') return new Set(claims.scope.split(' ').filter(Boolean));
  return new Set();
}

async function authenticate(req, res, next) {
  try {
    const token = getBearerToken(req.headers.authorization);
    if (!token) throw authError(401, 'UNAUTHENTICATED', 'A bearer token is required');

    const claims = await verifyToken(token);
    const tenantUuid = claims.tenant_uuid || claims.tenantUuid || claims.tid;
    if (!tenantUuid || typeof tenantUuid !== 'string') {
      throw authError(403, 'TENANT_CLAIM_REQUIRED', 'JWT must include a tenant UUID claim');
    }

    req.auth = { claims, tenantUuid, scopes: scopesFromClaims(claims), ipAddress: req.ip };
    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      return next(authError(401, 'INVALID_TOKEN', 'Bearer token is invalid or expired'));
    }
    return next(error);
  }
}

async function resolveUser(claims) {
  if (Number.isInteger(claims.user_id)) return Users.findByPk(claims.user_id);
  if (typeof claims.sub === 'string') return Users.findOne({ where: { user_uuid: claims.sub } });
  return null;
}

function authorize(requiredPermission) {
  return async (req, res, next) => {
    try {
      const user = await resolveUser(req.auth.claims);
      if (!user || user.status !== 'ACTIVE') {
        throw authError(403, 'ACCOUNT_NOT_AUTHORIZED', 'No active internal user matches the authenticated subject');
      }

      const assignments = await UserRoles.findAll({
        where: { user_id: user.user_id, status: 'ACTIVE' },
        include: [{
          model: Roles,
          required: true,
          where: { status: 'ACTIVE' },
          include: [{
            model: RolePermissions,
            required: true,
            where: { status: 'ACTIVE' },
            include: [{ model: Permissions, required: true, where: { status: 'ACTIVE' } }]
          }]
        }]
      });

      const permissions = new Set();
      for (const assignment of assignments) {
        for (const mapping of assignment.Role?.RolePermissions || []) {
          if (mapping.Permission?.permission_code) permissions.add(mapping.Permission.permission_code);
        }
      }

      const tokenAllows = req.auth.scopes.has(requiredPermission) || req.auth.scopes.has('identity-admin:*');
      const roleAllows = permissions.has(requiredPermission) || permissions.has('identity-admin:*');
      if (!tokenAllows || !roleAllows) {
        throw authError(403, 'INSUFFICIENT_PERMISSION', `Permission ${requiredPermission} is required`);
      }

      req.auth.userId = user.user_id;
      req.auth.permissions = permissions;
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

function tenantMatchesPath(paramName) {
  return (req, res, next) => {
    if (req.params[paramName] !== req.auth.tenantUuid) {
      return next(authError(403, 'TENANT_MISMATCH', 'Requested tenant does not match the authenticated tenant'));
    }
    return next();
  };
}

module.exports = { authenticate, authorize, tenantMatchesPath };
