const test = require('node:test');
const assert = require('node:assert/strict');

const db = require('../src/models');
const authorizationService = require('../src/services/authorizationService');

test('getRoles uses the shared pagination envelope (regression: file had a divergent local copy of toSequelizePage/buildEnvelope)', async () => {
  const originalFindAndCountAll = db.Roles.findAndCountAll;
  db.Roles.findAndCountAll = async () => ({ count: 0, rows: [] });

  try {
    const page = await authorizationService.getRoles({ page: 1, limit: 20 });
    assert.deepEqual(page.data, []);
    assert.equal(page.pagination.page, 1);
    assert.equal(page.pagination.limit, 20);
  } finally {
    db.Roles.findAndCountAll = originalFindAndCountAll;
  }
});

test('getPermissions uses the shared pagination envelope (regression: file had a divergent local copy of toSequelizePage/buildEnvelope)', async () => {
  const originalFindAndCountAll = db.Permissions.findAndCountAll;
  db.Permissions.findAndCountAll = async () => ({ count: 0, rows: [] });

  try {
    const page = await authorizationService.getPermissions({ page: 1, limit: 20 });
    assert.deepEqual(page.data, []);
    assert.equal(page.pagination.page, 1);
  } finally {
    db.Permissions.findAndCountAll = originalFindAndCountAll;
  }
});

test('getPermissions searches its own columns, not Roles.role_name (regression: copy-pasted where clause)', async () => {
  const originalFindAndCountAll = db.Permissions.findAndCountAll;
  let capturedQuery;

  db.Permissions.findAndCountAll = async (query) => {
    capturedQuery = query;
    return { count: 0, rows: [] };
  };

  try {
    await authorizationService.getPermissions({ search: 'view' });

    const orConditions = capturedQuery.where[Object.getOwnPropertySymbols(capturedQuery.where)[0]];
    const searchedFields = orConditions.map((condition) => Object.keys(condition)[0]);

    assert.ok(searchedFields.includes('permission_name'), 'should search permission_name');
    assert.ok(!searchedFields.includes('role_name'), 'must not search role_name (Permissions has no such column)');
  } finally {
    db.Permissions.findAndCountAll = originalFindAndCountAll;
  }
});
