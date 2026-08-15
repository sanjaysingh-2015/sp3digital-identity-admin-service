const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { authenticate, tenantMatchesPath } = require('../src/middleware/authentication');

function runMiddleware(middleware, req) {
  return new Promise((resolve) => middleware(req, {}, (error) => resolve(error)));
}

test('authentication accepts a signed JWT with a tenant claim', async () => {
  const previousSecret = process.env.ADMIN_JWT_SECRET;
  const previousJwksUrl = process.env.ADMIN_JWKS_URL;
  process.env.ADMIN_JWT_SECRET = 'test-signing-secret';
  delete process.env.ADMIN_JWKS_URL;

  try {
    const token = jwt.sign({ sub: 'user-uuid', tenant_uuid: 'tenant-a', scope: 'identity-admin:read' }, process.env.ADMIN_JWT_SECRET, { expiresIn: '5m' });
    const req = { headers: { authorization: `Bearer ${token}` }, ip: '127.0.0.1' };
    const error = await runMiddleware(authenticate, req);

    assert.equal(error, undefined);
    assert.equal(req.auth.tenantUuid, 'tenant-a');
    assert.ok(req.auth.scopes.has('identity-admin:read'));
  } finally {
    if (previousSecret === undefined) delete process.env.ADMIN_JWT_SECRET;
    else process.env.ADMIN_JWT_SECRET = previousSecret;
    if (previousJwksUrl === undefined) delete process.env.ADMIN_JWKS_URL;
    else process.env.ADMIN_JWKS_URL = previousJwksUrl;
  }
});

test('tenant path guard rejects cross-tenant access', async () => {
  const error = await runMiddleware(tenantMatchesPath('tenantUuid'), {
    params: { tenantUuid: 'tenant-b' },
    auth: { tenantUuid: 'tenant-a' }
  });

  assert.equal(error.code, 'TENANT_MISMATCH');
  assert.equal(error.statusCode, 403);
});
