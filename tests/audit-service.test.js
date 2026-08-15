const test = require('node:test');
const assert = require('node:assert/strict');

const db = require('../src/models');
const auditService = require('../src/services/auditService');

test('audit service persists the complete administrative event', async () => {
  const originalCreate = db.AuditLogs.create;
  let values;
  db.AuditLogs.create = async (input) => {
    values = input;
    return input;
  };

  try {
    await auditService.writeEvent({
      actorUserId: 7,
      action: 'POST /users',
      targetResource: '/users/42',
      changes: { status: 'ACTIVE' },
      ipAddress: '127.0.0.1'
    });

    assert.deepEqual(values, {
      actor_user_id: 7,
      action: 'POST /users',
      target_resource: '/users/42',
      changes: { status: 'ACTIVE' },
      ip_address: '127.0.0.1'
    });
  } finally {
    db.AuditLogs.create = originalCreate;
  }
});
