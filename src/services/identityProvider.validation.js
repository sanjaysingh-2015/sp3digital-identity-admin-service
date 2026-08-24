/**
 * identityProvider.validation.js
 *
 * Lightweight, dependency-free validation for the identity_provider
 * endpoints. Mirrors the error shape your `lifecycle` util uses
 * (statusCode + message) so it flows through the same error-handling
 * middleware as notFound()/assertMutable() do.
 */
const ALLOWED_PROVIDER_TYPES = ["OIDC", "SAML", "OAUTH2", "LDAP"];
const ALLOWED_STATUSES = ["ACTIVE", "INACTIVE", "DISABLED"];

class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = 400;
    this.details = details;
  }
}

class ConflictError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = "ConflictError";
    this.statusCode = 409;
    this.details = details;
  }
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidUrl(value) {
  if (value === undefined || value === null || value === "") return true; // optional
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/** Validates payload for POST /identity-providers. Throws ValidationError. */
function validateCreatePayload(body = {}) {
  const errors = [];

  // if (!isNonEmptyString(body.providerCode)) {
  //   errors.push({ field: "providerCode", message: "providerCode is required" });
  // } else if (body.providerCode.length > 100) {
  //   errors.push({ field: "providerCode", message: "providerCode must be at most 100 characters" });
  // }

  if (!isNonEmptyString(body.providerName)) {
    errors.push({ field: "providerName", message: "providerName is required" });
  } else if (body.providerName.length > 250) {
    errors.push({ field: "providerName", message: "providerName must be at most 250 characters" });
  }

  if (!isNonEmptyString(body.providerType)) {
    errors.push({ field: "providerType", message: "providerType is required" });
  } else if (!ALLOWED_PROVIDER_TYPES.includes(body.providerType)) {
    errors.push({
      field: "providerType",
      message: `providerType must be one of: ${ALLOWED_PROVIDER_TYPES.join(", ")}`,
    });
  }

  ["issuerUrl", "authorizationUrl", "tokenUrl", "jwksUrl"].forEach((field) => {
    if (!isValidUrl(body[field])) {
      errors.push({ field, message: `${field} must be a valid URL` });
    }
  });

  if (body.scopes !== undefined && body.scopes !== null && !Array.isArray(body.scopes)) {
    errors.push({ field: "scopes", message: "scopes must be an array of strings" });
  }

  if (
    body.configuration !== undefined &&
    body.configuration !== null &&
    typeof body.configuration !== "object"
  ) {
    errors.push({ field: "configuration", message: "configuration must be a JSON object" });
  }

  if (body.clientSecret !== undefined && !isNonEmptyString(body.clientSecret)) {
    errors.push({ field: "clientSecret", message: "clientSecret must be a non-empty string" });
  }

  if (errors.length) throw new ValidationError("Invalid identity provider payload", errors);
}

/** Validates payload for PUT/PATCH /identity-providers/:id. Same rules, all fields optional-aware. */
function validateUpdatePayload(body = {}) {
  const errors = [];

  if (body.providerCode !== undefined) {
    if (!isNonEmptyString(body.providerCode)) {
      errors.push({ field: "providerCode", message: "providerCode cannot be empty" });
    } else if (body.providerCode.length > 100) {
      errors.push({ field: "providerCode", message: "providerCode must be at most 100 characters" });
    }
  }

  if (body.providerName !== undefined) {
    if (!isNonEmptyString(body.providerName)) {
      errors.push({ field: "providerName", message: "providerName cannot be empty" });
    } else if (body.providerName.length > 250) {
      errors.push({ field: "providerName", message: "providerName must be at most 250 characters" });
    }
  }

  if (body.providerType !== undefined && !ALLOWED_PROVIDER_TYPES.includes(body.providerType)) {
    errors.push({
      field: "providerType",
      message: `providerType must be one of: ${ALLOWED_PROVIDER_TYPES.join(", ")}`,
    });
  }

  ["issuerUrl", "authorizationUrl", "tokenUrl", "jwksUrl"].forEach((field) => {
    if (!isValidUrl(body[field])) {
      errors.push({ field, message: `${field} must be a valid URL` });
    }
  });

  if (body.scopes !== undefined && body.scopes !== null && !Array.isArray(body.scopes)) {
    errors.push({ field: "scopes", message: "scopes must be an array of strings" });
  }

  if (
    body.configuration !== undefined &&
    body.configuration !== null &&
    typeof body.configuration !== "object"
  ) {
    errors.push({ field: "configuration", message: "configuration must be a JSON object" });
  }

  if (body.clientSecret !== undefined && !isNonEmptyString(body.clientSecret)) {
    errors.push({ field: "clientSecret", message: "clientSecret must be a non-empty string" });
  }

  if (errors.length) throw new ValidationError("Invalid identity provider payload", errors);
}

/** Validates payload for PATCH /identity-providers/:id/status. */
function validateStatusPayload(body = {}) {
  const errors = [];
  if (!isNonEmptyString(body.status)) {
    errors.push({ field: "status", message: "status is required" });
  } else if (!ALLOWED_STATUSES.includes(body.status)) {
    errors.push({ field: "status", message: `status must be one of: ${ALLOWED_STATUSES.join(", ")}` });
  }
  if (errors.length) throw new ValidationError("Invalid status payload", errors);
}

module.exports = {
  ValidationError,
  ConflictError,
  ALLOWED_PROVIDER_TYPES,
  ALLOWED_STATUSES,
  validateCreatePayload,
  validateUpdatePayload,
  validateStatusPayload,
};
