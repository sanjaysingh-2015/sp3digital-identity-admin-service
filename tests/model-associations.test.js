const test = require('node:test');
const assert = require('node:assert/strict');

const db = require('../src/models');

test('junction models expose the associations used by identity services', () => {
  assert.ok(db.UserRoles.associations.User);
  assert.ok(db.UserRoles.associations.Role);
  assert.ok(db.RolePermissions.associations.Role);
  assert.ok(db.RolePermissions.associations.Permission);
  assert.ok(db.ApiClientScopes.associations.ApiClient);
  assert.ok(db.ApiClientScopes.associations.Permission);
});
