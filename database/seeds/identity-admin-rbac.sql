-- Run this once through the deployment migration process, then assign the role
-- to the internal user matched by the JWT subject (users.user_uuid = JWT sub).

INSERT INTO permissions (
  permission_uuid, permission_code, permission_name, resource, action, description, status, created_on, modified_on
)
SELECT UUID(), 'identity-admin:read', 'Read identity administration', 'identity-admin', 'read',
       'View identity administration resources', 'ACTIVE', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE permission_code = 'identity-admin:read'
);

INSERT INTO permissions (
  permission_uuid, permission_code, permission_name, resource, action, description, status, created_on, modified_on
)
SELECT UUID(), 'identity-admin:write', 'Manage identity administration', 'identity-admin', 'write',
       'Create or change identity administration resources', 'ACTIVE', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE permission_code = 'identity-admin:write'
);

INSERT INTO roles (
  role_uuid, role_code, role_name, description, role_type, status, created_on, modified_on
)
SELECT UUID(), 'ROLE_IDENTITY_ADMIN', 'Identity Administrator',
       'Administrative access to identity configuration', 'SYSTEM', 'ACTIVE', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM roles WHERE role_code = 'ROLE_IDENTITY_ADMIN'
);

INSERT INTO role_permissions (role_id, permission_id, status, created_on, modified_on)
SELECT roles.role_id, permissions.permission_id, 'ACTIVE', NOW(), NOW()
FROM roles
JOIN permissions ON permissions.permission_code IN ('identity-admin:read', 'identity-admin:write')
LEFT JOIN role_permissions
  ON role_permissions.role_id = roles.role_id
  AND role_permissions.permission_id = permissions.permission_id
  AND role_permissions.status = 'ACTIVE'
WHERE roles.role_code = 'ROLE_IDENTITY_ADMIN'
  AND role_permissions.role_permission_id IS NULL;

-- Assign the role to a specific internal user after replacing the UUID below:
-- INSERT INTO user_roles (user_id, role_id, status, created_on, modified_on)
-- SELECT users.user_id, roles.role_id, 'ACTIVE', NOW(), NOW()
-- FROM users CROSS JOIN roles
-- WHERE users.user_uuid = '<jwt-subject-uuid>'
--   AND roles.role_code = 'ROLE_IDENTITY_ADMIN';
