/**
 * Shared lifecycle semantics for machine identities (API clients, OAuth
 * clients, service accounts). Kept in one place so "what does REVOKED mean"
 * only has one answer across the codebase.
 *
 * ACTIVE     -> usable
 * SUSPENDED  -> reversible admin action (deactivate). Can go back to ACTIVE.
 * EXPIRED    -> passed expires_on. Derived, not settable directly.
 * REVOKED    -> permanent. Terminal state, cannot be reactivated.
 */
const STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  EXPIRED: 'EXPIRED',
  REVOKED: 'REVOKED'
});

function notFound(entity) {
  const error = new Error(`${entity} not found`);
  error.statusCode = 404;
  error.code = 'NOT_FOUND';
  error.expose = true;
  return error;
}

function conflict(message) {
  const error = new Error(message);
  error.statusCode = 409;
  error.code = 'LIFECYCLE_CONFLICT';
  error.expose = true;
  return error;
}

/** Returns true if the record is expired given its expires_on column. */
function isExpired(record) {
  return Boolean(record.expires_on) && new Date(record.expires_on).getTime() <= Date.now();
}

/** Derives the effective status a client should report right now. */
function effectiveStatus(record) {
  if (record.status === STATUS.REVOKED) return STATUS.REVOKED;
  if (isExpired(record)) return STATUS.EXPIRED;
  return record.status;
}

function assertNotRevoked(record, entity) {
  if (record.status === STATUS.REVOKED) {
    throw conflict(`${entity} has been revoked and can no longer be modified`);
  }
}

function assertMutable(record, entity) {
  assertNotRevoked(record, entity);
  if (isExpired(record)) {
    throw conflict(`${entity} has expired; extend expiresOn before making further changes`);
  }
}

module.exports = { STATUS, notFound, conflict, isExpired, effectiveStatus, assertNotRevoked, assertMutable };
