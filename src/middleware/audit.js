const auditService = require('../services/auditService');

const sensitiveKeys = new Set(['secret', 'clientsecret', 'password', 'passwordhash', 'authorization']);

function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(Object.entries(value).map(([key, item]) => [
    key,
    sensitiveKeys.has(key.toLowerCase()) ? '[REDACTED]' : redact(item)
  ]));
}

function auditWrites(req, res, next) {
  res.on('finish', () => {
    if (!req.auth?.userId || !['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return;
    if (res.statusCode < 200 || res.statusCode >= 300) return;

    auditService.writeEvent({
      tenantUuid: req.auth.tenantUuid,
      actorUserId: req.auth.userId,
      action: `${req.method} ${req.baseUrl}${req.path}`,
      targetResource: req.baseUrl,
      ipAddress: req.auth.ipAddress,
      changes: { params: req.params, body: redact(req.body) }
    }).catch((error) => console.error('Unable to write audit event', error));
  });
  next();
}

module.exports = { auditWrites };
