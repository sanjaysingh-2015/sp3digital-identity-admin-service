const test = require('node:test');
const assert = require('node:assert/strict');

const db = require('../src/models');
const service = require('../src/services/serviceAccountService');

test('service account creation writes model-backed fields', async () => {
  const originalCreate = db.ServiceAccounts.create;
  let values;
  db.ServiceAccounts.create = async (input) => {
    values = input;
    return input;
  };

  try {
    await service.createServiceAccount({
      accountName: 'notification-worker',
      description: 'Background notification delivery',
      organizationId: 42
    });

    assert.equal(values.service_name, 'notification-worker');
    assert.equal(values.organization_id, 42);
    assert.match(values.service_uuid, /^[0-9a-f-]{36}$/i);
    assert.match(values.service_code, /^SA_[0-9A-F]{8}$/);
    assert.equal(values.account_name, undefined);
  } finally {
    db.ServiceAccounts.create = originalCreate;
  }
});
