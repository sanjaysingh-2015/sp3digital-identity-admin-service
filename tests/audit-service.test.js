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
      tenantUuid: 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d',
      actorUserId: 7,
      action: 'POST /users',
      targetResource: '/users/42',
      changes: { status: 'ACTIVE' },
      ipAddress: '127.0.0.1'
    });

    assert.deepEqual(values, {
      tenant_uuid: 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d',
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

test('audit service rejects writing an event without a tenantUuid', async () => {
  await assert.rejects(
    () => auditService.writeEvent({
      actorUserId: 7,
      action: 'POST /users',
      targetResource: '/users/42',
      changes: { status: 'ACTIVE' },
      ipAddress: '127.0.0.1'
    }),
    /tenantUuid/
  );
});

test('audit service scopes reads to the tenant and joins actor username + tenant name', async () => {
  const tenantUuid = 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
  const originalFindAndCountAll = db.AuditLogs.findAndCountAll;
  let capturedQuery;

  db.AuditLogs.findAndCountAll = async (query) => {
    capturedQuery = query;
    return {
      count: 1,
      rows: [
        {
          get: () => ({
            audit_id: 99,
            tenant_uuid: tenantUuid,
            actor_user_id: 7,
            action: 'LOGIN',
            target_resource: 'user-uuid-1',
            changes: null,
            ip_address: '127.0.0.1',
            created_on: new Date('2026-01-01T00:00:00Z'),
            actor: { username: 'jdoe' },
            tenant: { tenantName: 'Acme Health' }
          })
        }
      ]
    };
  };

  try {
    const page = await auditService.getAuditLogs(tenantUuid, { page: 1, limit: 10 });

    assert.equal(capturedQuery.where.tenant_uuid, tenantUuid);
    assert.deepEqual(page.data[0], {
      auditId: 99,
      tenantUuid,
      tenantName: 'Acme Health',
      actorUserId: 7,
      username: 'jdoe',
      action: 'LOGIN',
      targetResource: 'user-uuid-1',
      changes: null,
      ipAddress: '127.0.0.1',
      createdOn: new Date('2026-01-01T00:00:00Z')
    });
  } finally {
    db.AuditLogs.findAndCountAll = originalFindAndCountAll;
  }
});
