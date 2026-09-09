const test = require('node:test');
const assert = require('node:assert/strict');

/**
 * Regression test for the auth/login route-shadowing bug.
 *
 * app.js used to register a second, unprotected `app.post('.../auth/login', ...)`
 * directly, ahead of authRoutes.js's mount point. Because Express matches
 * routes in registration order, that duplicate silently won on every request,
 * so authRoutes.js's `loginRateLimiter` (20 requests / 15 min per IP) and its
 * Joi validation never actually ran in production.
 *
 * This test doesn't care whether credentials are valid — it only asserts
 * that hammering the endpoint eventually trips the limiter. It sends
 * malformed bodies on purpose so nothing here depends on a live database:
 * `loginRateLimiter` runs before `validate(loginSchema)` and before the
 * controller/service/DB layer, so a 429 must come from the limiter itself,
 * not from downstream logic.
 */

const LOGIN_PATH = '/api/v1/identity-admin/auth/login';
const RATE_LIMIT = 20; // must match authRoutes.js's loginRateLimiter `limit`

let app;
let server;
let baseUrl;

test.before(async () => {
  // NOTE: deliberately not touching ADMIN_JWKS_URL / ADMIN_JWT_AUDIENCE here.
  // /auth/login is mounted ahead of the authenticate() middleware in app.js
  // (it's how you get a token in the first place, so it can't require one),
  // so this test never exercises JWT verification and has no business
  // setting process-wide JWT config. process.env is shared across test
  // files in the same `node --test` run — mutating it here previously
  // corrupted tests/authentication.test.js's JWT verifier setup.
  app = require('../src/app');

  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('the 21st /auth/login attempt from the same IP in the window returns 429', async () => {
  const statuses = [];

  for (let i = 0; i < RATE_LIMIT + 1; i += 1) {
    const response = await fetch(`${baseUrl}${LOGIN_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Deliberately malformed: missing password/tenantUuid. If this ever
      // came back as a plain 400 for all 21 requests, that would mean the
      // rate limiter is being bypassed again (the exact regression this
      // test exists to catch).
      body: JSON.stringify({ usernameOrEmail: 'nobody@example.com' }),
    });
    statuses.push(response.status);
  }

  const firstTwenty = statuses.slice(0, RATE_LIMIT);
  const twentyFirst = statuses[RATE_LIMIT];

  assert.ok(
    firstTwenty.every((status) => status !== 429),
    `expected no 429s in the first ${RATE_LIMIT} requests, got: ${firstTwenty}`,
  );
  assert.equal(
    twentyFirst,
    429,
    `expected the ${RATE_LIMIT + 1}th request to be rate-limited, got ${twentyFirst}`,
  );
});