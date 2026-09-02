const test = require('node:test');
const assert = require('node:assert/strict');

const db = require('../src/models');
const resourceActionService = require('../src/services/resourceActionService');

function searchedFields(query) {
  const orSymbol = Object.getOwnPropertySymbols(query.where)[0];
  return query.where[orSymbol].map((condition) => Object.keys(condition)[0]);
}

test('getResources searches resource_name, not Roles.role_name (regression: copy-pasted where clause)', async () => {
  const original = db.ResourceMaster.findAndCountAll;
  let captured;

  db.ResourceMaster.findAndCountAll = async (query) => {
    captured = query;
    return { count: 0, rows: [] };
  };

  try {
    await resourceActionService.getResources({ search: 'user' });

    const fields = searchedFields(captured);
    assert.ok(fields.includes('resource_name'), 'should search resource_name');
    assert.ok(!fields.includes('role_name'), 'must not search role_name (ResourceMaster has no such column)');
  } finally {
    db.ResourceMaster.findAndCountAll = original;
  }
});

test('getActions searches action_name, not Roles.role_name (regression: copy-pasted where clause)', async () => {
  const original = db.ActionMaster.findAndCountAll;
  let captured;

  db.ActionMaster.findAndCountAll = async (query) => {
    captured = query;
    return { count: 0, rows: [] };
  };

  try {
    await resourceActionService.getActions({ search: 'create' });

    const fields = searchedFields(captured);
    assert.ok(fields.includes('action_name'), 'should search action_name');
    assert.ok(!fields.includes('role_name'), 'must not search role_name (ActionMaster has no such column)');
  } finally {
    db.ActionMaster.findAndCountAll = original;
  }
});
