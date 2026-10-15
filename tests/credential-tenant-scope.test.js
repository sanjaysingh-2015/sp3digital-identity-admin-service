const test = require('node:test');
const assert = require('node:assert/strict');

const db = require('../src/models');
const credentialService = require('../src/services/credentialService');
const controller = require('../src/controllers/credentialController');

const TENANT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const TENANT_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

// User 10 belongs to tenant A, user 20 to tenant B.
const USERS = { 10: { user_id: 10, tenant_uuid: TENANT_A }, 20: { user_id: 20, tenant_uuid: TENANT_B } };

function harness() {
  const calls = [];
  const originals = {
    findByPk: db.Users.findByPk,
    setPassword: credentialService.setPassword,
    rotatePassword: credentialService.rotatePassword,
    revokeCredential: credentialService.revokeCredential,
    getCredentialStatus: credentialService.getCredentialStatus,
  };
  db.Users.findByPk = async (id) => USERS[id] || null;
  for (const name of ['setPassword', 'rotatePassword', 'revokeCredential', 'getCredentialStatus']) {
    credentialService[name] = async (...args) => { calls.push([name, ...args]); return { ok: true }; };
  }
  const restore = () => {
    db.Users.findByPk = originals.findByPk;
    Object.assign(credentialService, { setPassword: originals.setPassword, rotatePassword: originals.rotatePassword, revokeCredential: originals.revokeCredential, getCredentialStatus: originals.getCredentialStatus });
  };
  return { calls, restore };
}

async function run(handler, { userId, auth, body = { password: 'N3w-Passw0rd!x' } }) {
  const out = { status: null, json: null, error: null };
  const res = { status(code) { out.status = code; return this; }, json(payload) { out.json = payload; return this; } };
  await handler({ params: { userId }, body, auth }, res, (error) => { out.error = error; });
  return out;
}

const adminA = { tenantUuid: TENANT_A, userId: 1, isSuperAdmin: false };
const superAdmin = { tenantUuid: TENANT_A, userId: 2, isSuperAdmin: true };

test('an administrator can set the password of a user in their own tenant', async () => {
  const { calls, restore } = harness();
  try {
    const out = await run(controller.setPassword, { userId: '10', auth: adminA });
    assert.equal(out.status, 200);
    assert.deepEqual(calls, [['setPassword', 10, 'N3w-Passw0rd!x', TENANT_A, 1]]);
  } finally { restore(); }
});

test('an administrator cannot touch a user of another tenant: same 404 as a user that does not exist', async () => {
  const { calls, restore } = harness();
  try {
    for (const name of ['setPassword', 'rotatePassword', 'revokeCredential', 'getCredentialStatus']) {
      const other = await run(controller[name], { userId: '20', auth: adminA });
      assert.equal(other.error?.statusCode, 404, `${name} must refuse a user of another tenant`);
      const missing = await run(controller[name], { userId: '999', auth: adminA });
      assert.equal(missing.error?.statusCode, 404);
      assert.equal(other.error.message, missing.error.message); // nothing to tell the two apart
    }
    assert.deepEqual(calls, []); // the credential service was never reached
  } finally { restore(); }
});

test('a SUPERADMIN can act across tenants, and the target tenant\'s password policy is the one applied', async () => {
  const { calls, restore } = harness();
  try {
    const out = await run(controller.setPassword, { userId: '20', auth: superAdmin });
    assert.equal(out.status, 200);
    assert.deepEqual(calls, [['setPassword', 20, 'N3w-Passw0rd!x', TENANT_B, 2]]); // tenant B's policy, not the caller's tenant A
  } finally { restore(); }
});
