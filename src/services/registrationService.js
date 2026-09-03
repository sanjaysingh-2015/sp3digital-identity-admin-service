const axios = require("axios");
const { Roles } = require("../models");
const tenantService = require("./tenantService");
const userService = require("./userService");
const credentialService = require("./credentialService");
const authService = require("./authService");

const ORG_SERVICE_URL =
  process.env.ORGANIZATION_SERVICE_URL || "http://localhost:3100";
const ORG_SERVICE_TIMEOUT_MS = Number(
  process.env.ORGANIZATION_SERVICE_TIMEOUT_MS || 8000,
);
// organization-admin-service gates its write routes behind its own auth
// (same pattern as this service). This needs to be a credential/service
// account that organization-admin-service accepts for server-to-server
// calls — how exactly is up to how that service implements service auth;
// adjust the header below (and ORG_SERVICE flow) to match.
const ORG_SERVICE_INTERNAL_TOKEN =
  process.env.ORGANIZATION_SERVICE_INTERNAL_TOKEN;

// role_id is an autoincrement PK and will differ across environments/seed
// order, so we resolve it by role_code at call time rather than hardcoding
// a number. See database/seeds/tenant-admin-role.sql for how this role
// gets created.
const TENANT_ADMIN_ROLE_CODE =
  process.env.TENANT_ADMIN_ROLE_CODE || "TENANT_ADMIN";

function registrationError(
  message,
  statusCode = 400,
  code = "REGISTRATION_FAILED",
) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  error.expose = true;
  return error;
}

function orgServiceHeaders(tenantUuid) {
  return {
    "Content-Type": "application/json",
    "X-Tenant-Uuid": tenantUuid,
    ...(ORG_SERVICE_INTERNAL_TOKEN
      ? { Authorization: `Bearer ${ORG_SERVICE_INTERNAL_TOKEN}` }
      : {}),
  };
}

class RegistrationService {
  /** Fails fast, before creating anything, if the role isn't seeded. */
  async _resolveTenantAdminRoleId() {
    const role = await Roles.findOne({
      where: { role_code: TENANT_ADMIN_ROLE_CODE, status: "ACTIVE" },
      attributes: ["role_id"],
    });

    if (!role) {
      throw registrationError(
        `No ACTIVE role with role_code='${TENANT_ADMIN_ROLE_CODE}' is seeded. ` +
          `Run database/seeds/tenant-admin-role.sql (or set TENANT_ADMIN_ROLE_CODE ` +
          `to an existing role) before self-registration can assign it.`,
        500,
        "TENANT_ADMIN_ROLE_MISSING",
      );
    }

    return role.role_id;
  }

  async _createOrganization({
    tenantUuid,
    organizationName,
    organizationType,
    parentOrganizationId,
    userId,
  }) {
    try {
      const response = await axios.post(
        `${ORG_SERVICE_URL}/api/v1/organization-admin/internal/organizations`,
        {
          tenantUuid,
          organizationName,
          organizationType,
          parentOrganizationId: parentOrganizationId ?? null,
          userId,
        },
        {
          timeout: ORG_SERVICE_TIMEOUT_MS,
          headers: {
            ...orgServiceHeaders(tenantUuid),
            "x-internal-service-token": process.env.INTERNAL_SERVICE_TOKEN,
          },
        },
      );

      return response.data;
    } catch (error) {
      if (error.response) {
        throw registrationError(
          `Organization service rejected the request: ${
            error.response.data?.error?.message ||
            error.response.data?.message ||
            error.response.statusText
          }`,
          502,
          "ORGANIZATION_SERVICE_ERROR",
        );
      }

      throw registrationError(
        `Could not reach organization-admin-service: ${error.message}`,
        502,
        "ORGANIZATION_SERVICE_UNREACHABLE",
      );
    }
  }

  /** Best-effort only — logs and swallows failures so cleanup never masks the original error. */
  async _deleteOrganizationBestEffort(organizationId, tenantUuid) {
    if (!organizationId) return;

    try {
      await axios.delete(
        `${ORG_SERVICE_URL}/api/v1/organization-admin/organizations/${organizationId}`,
        {
          timeout: ORG_SERVICE_TIMEOUT_MS,
          headers: orgServiceHeaders(tenantUuid),
        },
      );
    } catch (cleanupError) {
      console.error(
        "[registerOrganization] Compensating organization delete failed — manual cleanup required:",
        { organizationId, tenantUuid, error: cleanupError.message },
      );
    }
  }

  async _deleteTenantBestEffort(tenantUuid) {
    if (!tenantUuid) return;

    try {
      await tenantService.deleteTenant(tenantUuid, null);
    } catch (cleanupError) {
      console.error(
        "[registerOrganization] Compensating tenant delete failed — manual cleanup required:",
        { tenantUuid, error: cleanupError.message },
      );
    }
  }

  /**
   * Public, unauthenticated self-service registration:
   *   1. create tenant                (identity-admin-service)
   *   2. create organization          (organization-admin-service, remote HTTP call)
   *   3. create user + set password   (identity-admin-service)
   *   4. assign TENANT_ADMIN role     (identity-admin-service)
   *   5. auto-login                   (identity-admin-service)
   *
   * IMPORTANT — this is best-effort, not atomic. Step 2 is a call to a
   * different service/database, so it cannot join a transaction with
   * steps 1/3/4, and even 1/3/4 each manage their own transaction (or
   * none) individually rather than sharing one. If any step fails, the
   * catch block below compensates by deleting whatever was already
   * created, but a crash between "create" and "compensate" (e.g. process
   * killed mid-request) can still leave an orphaned tenant/organization/
   * user behind. For true cross-service atomicity you'd want a saga with
   * durable state, which is out of scope here.
   */
  async registerOrganization(payload) {
    const {
      organizationName,
      organizationType,
      parentOrganizationId,
      username,
      email,
      firstName,
      lastName,
      middleName,
      displayName,
      phoneCountryCode,
      phoneNumber,
      password,
    } = payload;

    const tenantAdminRoleId = await this._resolveTenantAdminRoleId();

    let tenant;
    let organization;
    let user;

    try {
      // --- 1. tenant ---
      tenant = await tenantService.createTenant(
        { tenantName: organizationName },
        null,
      );

      // --- 3. user + password ---
      user = await userService.createUser(
        {
          tenantUuid: tenant.tenantUuid,
          username,
          email,
          firstName,
          lastName,
          middleName,
          displayName: displayName || `${firstName} ${lastName}`.trim(),
          phoneCountryCode,
          phoneNumber,
          userType: "USER",
        },
        null,
      );

      // --- 2. organization (remote) ---
      organization = await this._createOrganization({
        tenantUuid: tenant.tenantUuid,
        organizationName,
        organizationType,
        parentOrganizationId,
        userId: user.userId,
      });

      // Self-service: the newly created user is its own actor for the
      // password write and the role grant below.
      await credentialService.setPassword(
        user.userId,
        password,
        tenant.tenantUuid,
        user.userId,
      );

      // --- 4. TENANT_ADMIN role ---
      await userService.assignRole(
        user.userId,
        [tenantAdminRoleId],
        new Date(),
        null,
        user.userId,
      );
    } catch (error) {
      // Unwind whatever succeeded, in reverse order. userService.createUser
      // has no soft-delete path exposed here, so on a post-user failure we
      // rely on the tenant delete cascading logically (tenant is
      // deactivated; the orphaned user row is inert without an active
      // tenant) — flag it explicitly for manual follow-up either way.
      if (user?.userId) {
        console.error(
          "[registerOrganization] Registration failed after user creation — user row may need manual cleanup:",
          {
            userId: user.userId,
            tenantUuid: tenant?.tenantUuid,
            error: error.message,
          },
        );
      }

      if (organization) {
        const organizationId =
          organization.organizationId ?? organization.organization_id;
        await this._deleteOrganizationBestEffort(
          organizationId,
          tenant?.tenantUuid,
        );
      }

      if (tenant?.tenantUuid) {
        await this._deleteTenantBestEffort(tenant.tenantUuid);
      }

      throw error;
    }

    // --- 5. auto-login ---
    // Reuses the exact same login path /auth/login uses, so the response
    // shape (tokenType/accessToken/idToken/refreshToken/expiresIn) — and
    // all its session/audit side effects — are identical to a normal
    // login. In the unlikely event the tenant's security policy requires
    // MFA by default, this will come back as { mfaRequired: true, ... }
    // instead of tokens; the caller should handle both shapes the same
    // way /auth/login's caller does.
    const loginResult = await authService.login(
      {
        usernameOrEmail: username,
        password,
        tenantUuid: tenant.tenantUuid,
        audience: process.env.ADMIN_JWT_AUDIENCE,
      },
      {},
    );

    return {
      ...loginResult,
      tenantUuid: tenant.tenantUuid,
      tenantCode: tenant.tenantCode,
      organizationId:
        organization.organizationId ?? organization.organization_id ?? null,
      organizationUuid:
        organization.organizationUuid ?? organization.organization_uuid ?? null,
      userId: user.userId,
      userUuid: user.userUuid,
    };
  }
}

module.exports = new RegistrationService();
