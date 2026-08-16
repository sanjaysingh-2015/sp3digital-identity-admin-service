const test = require('node:test');
const assert = require('node:assert/strict');

const db = require('../src/models');
const service = require('../src/services/serviceAccountService');

test('service account creation writes model-backed fields and provisions a backing API client', async () => {
  const originalTransaction = db.sequelize.transaction;
  const originalApiClientCreate = db.ApiClients.create;
  const originalServiceAccountCreate = db.ServiceAccounts.create;

  // createServiceAccount runs inside sequelize.transaction(async (t) => {...}).
  // For a unit test we don't have a real DB/transaction, so just invoke the
  // callback directly with a stub transaction object.
  db.sequelize.transaction = async (fn) => fn({ LOCK: { UPDATE: 'UPDATE' } });

  let apiClientValues;
  db.ApiClients.create = async (input) => {
    apiClientValues = input;
    return { ...input, api_client_id: 900 };
  };

  let serviceAccountValues;
  db.ServiceAccounts.create = async (input) => {
    serviceAccountValues = input;
    return { get: (opts) => (opts ? input : input), ...input };
  };

  try {
    const result = await service.createServiceAccount(
      { accountName: 'notification-worker', description: 'Background notification delivery', organizationId: 42 },
      'tenant-a',
      7
    );

    assert.equal(serviceAccountValues.service_name, 'notification-worker');
    assert.equal(serviceAccountValues.organization_id, 42);
    assert.equal(serviceAccountValues.tenant_uuid, 'tenant-a');
    assert.equal(serviceAccountValues.created_by, 7);
    assert.match(serviceAccountValues.service_uuid, /^[0-9a-f-]{36}$/i);
    assert.match(serviceAccountValues.service_code, /^SA_[0-9A-F]{8}$/);
    assert.equal(serviceAccountValues.client_id, 900);
    assert.equal(serviceAccountValues.account_name, undefined);

    // The backing API client should be provisioned with a hashed secret,
    // and the raw secret should only be surfaced once in the response.
    assert.equal(apiClientValues.client_type, 'CONFIDENTIAL');
    assert.equal(apiClientValues.tenant_uuid, 'tenant-a');
    assert.notEqual(apiClientValues.client_secret_hash, undefined);
    assert.equal(typeof result.clientSecret, 'string');
    assert.equal(result.clientSecret.length, 64); // 32 random bytes, hex-encoded
  } finally {
    db.sequelize.transaction = originalTransaction;
    db.ApiClients.create = originalApiClientCreate;
    db.ServiceAccounts.create = originalServiceAccountCreate;
  }
});
