const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { Op } = require("sequelize");
const {
  Users,
  UserRoles,
  Roles,
  RolePermissions,
  Permissions,
  UserSessions,
  RefreshTokens,
  sequelize,
} = require("../models");
const credentialService = require("./credentialService");
const mfaService = require("./mfaService");
const securityPolicyService = require("./securityPolicyService");
const tokenService = require("../security/tokenService");

const MFA_CHALLENGE_AUDIENCE = "mfa_challenge";
const MFA_CHALLENGE_TTL_SECONDS = Number(
  process.env.MFA_CHALLENGE_TTL_SECONDS || 300,
);

function authError(code, message, statusCode = 401) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  error.expose = true;
  return error;
}

/** Same role -> permission resolution authentication.js's authorize() uses, so tokens carry claims that will actually pass authorization. */
async function resolvePermissions(userId) {
  const assignments = await UserRoles.findAll({
    where: { user_id: userId, status: "ACTIVE" },
    include: [
      {
        model: Roles,
        required: true,
        where: { status: "ACTIVE" },
        include: [
          {
            model: RolePermissions,
            required: true,
            where: { status: "ACTIVE" },
            include: [
              {
                model: Permissions,
                required: true,
                where: { status: "ACTIVE" },
              },
            ],
          },
        ],
      },
    ],
  });

  const permissions = new Set();
  for (const assignment of assignments) {
    for (const mapping of assignment.Role?.RolePermissions || []) {
      if (mapping.Permission?.permission_code)
        permissions.add(mapping.Permission.permission_code);
    }
  }
  return Array.from(permissions);
}

async function findLoginUser(usernameOrEmail, tenantUuid) {
  return Users.findOne({
    where: {
      tenant_uuid: tenantUuid,
      status: "ACTIVE",
      [Op.or]: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
    },
  });
}

/** Creates the session row + signs/stores the token triad. Shared by direct login, MFA completion, and refresh. */
async function issueTokens(
  { user, tenantUuid, audience, ipAddress, userAgent, mfaVerified },
  transaction,
) {
  // ---------------------------------------------------------
  // 1. Resolve permissions
  // ---------------------------------------------------------
  const permissions = await resolvePermissions(user.user_id);

  const now = new Date();

  // ---------------------------------------------------------
  // 2. Generate refresh token BEFORE creating the session
  // ---------------------------------------------------------
  const {
    raw: refreshTokenRaw,
    hash: refreshTokenHash,
    expiresOn: refreshTokenExpiresOn,
  } = tokenService.generateRefreshToken();

  // ---------------------------------------------------------
  // 3. Update user login information
  // ---------------------------------------------------------
  await user.update(
    {
      last_login_on: now,
      failed_login_count: 0,
      account_locked_until: null,
    },
    {
      transaction,
    },
  );

  // ---------------------------------------------------------
  // 4. Create user session
  //
  // session_token_hash is mandatory in your DB schema,
  // therefore it MUST be supplied here.
  // ---------------------------------------------------------
  const session = await UserSessions.create(
    {
      session_uuid: uuidv4(),

      user_id: user.user_id,

      // Store HASH only, never the raw refresh token
      session_token_hash: refreshTokenHash,

      ip_address: ipAddress || null,

      user_agent: userAgent || null,

      login_method: mfaVerified ? "PASSWORD_MFA" : "PASSWORD",

      created_on: now,

      expires_on: refreshTokenExpiresOn,

      last_activity_on: now,

      status: "ACTIVE",
    },
    {
      transaction,
    },
  );

  // ---------------------------------------------------------
  // 5. Create Access Token
  // ---------------------------------------------------------
  const accessToken = tokenService.signAccessToken({
    userId: user.user_id,
    userUuid: user.user_uuid,
    tenantUuid,
    audience,
    permissions,
  });

  // ---------------------------------------------------------
  // 6. Create ID Token
  // ---------------------------------------------------------
  const idToken = tokenService.signIdToken({
    userId: user.user_id,
    userUuid: user.user_uuid,
    tenantUuid,
    audience,
    email: user.email,
    username: user.username,
    firstName: user.first_name,
    lastName: user.last_name,
    mfaVerified,
  });

  // ---------------------------------------------------------
  // 7. Store refresh token
  // ---------------------------------------------------------
  await RefreshTokens.create(
    {
      token_uuid: uuidv4(),
      // Store HASH only
      token_hash: refreshTokenHash,
      user_id: user.user_id,
      session_id: session.session_id,
      issued_on: now,
      expires_on: refreshTokenExpiresOn,
      status: "ACTIVE",
      created_by: user.user_id,
      created_on: now,
    },
    {
      transaction,
    },
  );

  // ---------------------------------------------------------
  // 8. Return tokens
  // ---------------------------------------------------------
  return {
    tokenType: "Bearer",
    accessToken,
    idToken,
    // Raw token is returned ONLY to the client.
    // It is never stored in DB.
    refreshToken: refreshTokenRaw,
    expiresIn: tokenService.accessTokenTtlSeconds(),
  };
}

class AuthService {
  /**
   * Step 1 of login. Verifies credentials; if the user has an active MFA
   * method, returns an MFA challenge instead of tokens. Never reveals
   * whether the failure was a bad username vs. bad password.
   */
  async login(
    { usernameOrEmail, password, tenantUuid, audience },
    { ipAddress, userAgent } = {},
  ) {
    const user = await findLoginUser(usernameOrEmail, tenantUuid);
    if (!user)
      throw authError("INVALID_CREDENTIALS", "Invalid username or password");

    await credentialService.verifyPassword(user.user_id, tenantUuid, password); // throws on bad password / lockout

    const policy = await securityPolicyService.getActivePolicy(tenantUuid);
    const hasMfa = await mfaService.hasActiveMfa(user.user_id);

    if (policy.mfaRequired && !hasMfa) {
      throw authError(
        "MFA_ENROLLMENT_REQUIRED",
        "This tenant requires MFA; enroll a method before logging in",
        403,
      );
    }

    if (hasMfa) {
      const mfaToken = jwt.sign(
        {
          sub: user.user_uuid,
          user_id: user.user_id,
          tenant_uuid: tenantUuid,
          token_use: "mfa_challenge",
        },
        mfaChallengeSecret(),
        {
          algorithm: "HS256",
          audience: MFA_CHALLENGE_AUDIENCE,
          expiresIn: MFA_CHALLENGE_TTL_SECONDS,
        },
      );
      return {
        mfaRequired: true,
        mfaToken,
        expiresIn: MFA_CHALLENGE_TTL_SECONDS,
      };
    }

    return sequelize.transaction((transaction) =>
      issueTokens(
        {
          user,
          tenantUuid,
          audience,
          ipAddress,
          userAgent,
          mfaVerified: false,
        },
        transaction,
      ),
    );
  }

  /** Step 2 of login when MFA is required: exchanges the challenge + TOTP code for real tokens. */
  async completeMfaLogin(
    { mfaToken, code, audience },
    { ipAddress, userAgent } = {},
  ) {
    let claims;
    try {
      claims = jwt.verify(mfaToken, mfaChallengeSecret(), {
        algorithms: ["HS256"],
        audience: MFA_CHALLENGE_AUDIENCE,
      });
    } catch {
      throw authError(
        "INVALID_MFA_CHALLENGE",
        "MFA challenge is invalid or expired",
      );
    }

    const user = await Users.findByPk(claims.user_id);
    if (!user || user.status !== "ACTIVE")
      throw authError("INVALID_CREDENTIALS", "Invalid username or password");

    await mfaService.verifyLoginCode(user.user_id, code); // throws on bad/expired code, enforces lockout

    return sequelize.transaction((transaction) =>
      issueTokens(
        {
          user,
          tenantUuid: claims.tenant_uuid,
          audience,
          ipAddress,
          userAgent,
          mfaVerified: true,
        },
        transaction,
      ),
    );
  }

  /**
   * Rotates a refresh token: the presented token is single-use. Reuse of an
   * already-consumed token is treated as theft and revokes the whole session.
   */
  async refresh({ refreshToken, audience }, { ipAddress, userAgent } = {}) {
    const tokenHash = tokenService.hashRefreshToken(refreshToken);

    return sequelize.transaction(async (transaction) => {
      const record = await RefreshTokens.findOne({
        where: { token_hash: tokenHash },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!record) throw authError("INVALID_GRANT", "Refresh token is invalid");

      if (record.status !== "ACTIVE" || record.used_on) {
        // Token reuse after rotation (or after revocation) — assume compromise, kill the whole session.
        await RefreshTokens.update(
          { status: "REVOKED", revoked_on: new Date() },
          {
            where: {
              session_id: record.session_id,
              status: { [Op.ne]: "REVOKED" },
            },
            transaction,
          },
        );
        await UserSessions.update(
          { status: "REVOKED", revoked_on: new Date() },
          { where: { session_id: record.session_id }, transaction },
        );
        throw authError(
          "REFRESH_TOKEN_REUSED",
          "Refresh token has already been used; session revoked",
          401,
        );
      }

      if (new Date(record.expires_on).getTime() <= Date.now()) {
        throw authError("INVALID_GRANT", "Refresh token has expired");
      }

      const user = await Users.findByPk(record.user_id, { transaction });
      if (!user || user.status !== "ACTIVE")
        throw authError("INVALID_GRANT", "User is no longer active");

      const now = new Date();
      await record.update(
        { used_on: now, status: "REVOKED", revoked_on: now },
        { transaction },
      );

      const permissions = await resolvePermissions(user.user_id);
      const accessToken = tokenService.signAccessToken({
        userId: user.user_id,
        userUuid: user.user_uuid,
        tenantUuid: user.tenant_uuid,
        audience,
        permissions,
      });
      const idToken = tokenService.signIdToken({
        userId: user.user_id,
        userUuid: user.user_uuid,
        tenantUuid: user.tenant_uuid,
        audience,
        email: user.email,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        mfaVerified: true,
      });

      const {
        raw: newRefreshRaw,
        hash: newRefreshHash,
        expiresOn,
      } = tokenService.generateRefreshToken();
      await RefreshTokens.create(
        {
          token_uuid: uuidv4(),
          token_hash: newRefreshHash,
          user_id: user.user_id,
          session_id: record.session_id,
          parent_token_id: record.refresh_token_id,
          issued_on: now,
          expires_on: expiresOn,
          status: "ACTIVE",
          created_by: user.user_id,
          created_on: now,
        },
        { transaction },
      );

      await UserSessions.update(
        { last_activity_on: now, ip_address: ipAddress, user_agent: userAgent },
        { where: { session_id: record.session_id }, transaction },
      );

      return {
        tokenType: "Bearer",
        accessToken,
        idToken,
        refreshToken: newRefreshRaw,
        expiresIn: tokenService.accessTokenTtlSeconds(),
      };
    });
  }

  /**
   * Sets a new password for a user identified by usernameOrEmail + tenant
   * (mirrors how /login identifies the user, rather than requiring a userId).
   *
   * - forceChange=false (default): self-service change. oldPassword MUST be
   *   supplied and is verified via credentialService.verifyPassword() —
   *   same lockout/failed-attempt bookkeeping as a login attempt.
   * - forceChange=true: skips the old-password check entirely.
   *
   * ⚠️ SECURITY: as of the route layer's current configuration, BOTH modes
   * are reachable without authentication. forceChange=true means anyone who
   * knows usernameOrEmail + tenantUuid can set that user's password with no
   * proof of identity. This was an explicit choice made at the route level
   * (authRoutes.js) — this method itself has no way to enforce a caller
   * check, since there is no authenticated actor to check.
   */
  async changePassword({
    usernameOrEmail,
    tenantUuid,
    oldPassword,
    newPassword,
    forceChange = false,
    actorUserId,
  } = {}) {
    const user = await findLoginUser(usernameOrEmail, tenantUuid);
    if (!user)
      throw authError("INVALID_CREDENTIALS", "Invalid username or password");

    if (!forceChange) {
      await credentialService.verifyPassword(
        user.user_id,
        tenantUuid,
        oldPassword,
      ); // throws on mismatch/lockout
    }

    const result = await credentialService.setPassword(
      user.user_id,
      newPassword,
      tenantUuid,
      actorUserId || user.user_id, // self-service: user is their own actor; forced: admin's id, passed in by the controller
      { forceRotationOnNextLogin: forceChange },
    );

    return {
      userId: user.user_id,
      passwordUpdated: true,
      forceChange: Boolean(forceChange),
      ...result,
    };
  }

  async logout(refreshToken) {
    const tokenHash = tokenService.hashRefreshToken(refreshToken);
    const record = await RefreshTokens.findOne({
      where: { token_hash: tokenHash },
    });
    if (!record) return { loggedOut: true }; // idempotent — already gone

    const now = new Date();
    await record.update({ status: "REVOKED", revoked_on: now });
    await UserSessions.update(
      { status: "REVOKED", revoked_on: now },
      { where: { session_id: record.session_id } },
    );
    return { loggedOut: true };
  }
}

function mfaChallengeSecret() {
  const secret =
    process.env.MFA_CHALLENGE_SECRET || process.env.JWT_PRIVATE_KEY;
  if (!secret)
    throw new Error(
      "MFA_CHALLENGE_SECRET (or JWT_PRIVATE_KEY) must be configured to issue MFA challenges",
    );
  return secret;
}

module.exports = new AuthService();
