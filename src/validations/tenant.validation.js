/**
 * identityProvider.validation.js
 *
 * Lightweight, dependency-free validation for the identity_provider
 * endpoints. Mirrors the error shape your `lifecycle` util uses
 * (statusCode + message) so it flows through the same error-handling
 * middleware as notFound()/assertMutable() do.
 */
const ALLOWED_STATUSES = ["ACTIVE", "INACTIVE", "DISABLED", "DELETED"];

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

  if (!isNonEmptyString(body.tenantName)) {
    errors.push({ field: "tenantName", message: "tenantName is required" });
  } else if (body.tenantName.length > 250) {
    errors.push({ field: "tenantName", message: "tenantName must be at most 250 characters" });
  }
  if (errors.length) throw new ValidationError("Invalid tenant payload", errors);
}

/** Validates payload for PUT/PATCH /identity-providers/:id. Same rules, all fields optional-aware. */
function validateUpdatePayload(body = {}) {
  const errors = [];

  if (body.tenantName !== undefined) {
    if (!isNonEmptyString(body.tenantName)) {
      errors.push({ field: "tenantName", message: "tenantName cannot be empty" });
    } else if (body.tenantName.length > 250) {
      errors.push({ field: "tenantName", message: "tenantName must be at most 250 characters" });
    }
  }
  if (errors.length) throw new ValidationError("Invalid tenant payload", errors);
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
  ALLOWED_STATUSES,
  validateCreatePayload,
  validateUpdatePayload,
  validateStatusPayload,
};
