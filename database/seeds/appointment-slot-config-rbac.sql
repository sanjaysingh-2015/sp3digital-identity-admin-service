-- Appointment Slot Configuration RBAC
--
-- Grants:
--   TENANT_ADMIN: create + read + update + approve (full control,
--                 including approving/rejecting configs TENANT_USER
--                 submitted)
--   TENANT_USER:  create + read only — matches appointment-service's
--                 authorize() gates on its slot-config routes; TENANT_USER
--                 has no grant for update or approve, so those routes
--                 403 for them there.
--
-- Run this once through the deployment migration process. This also fills
-- in the TENANT_ADMIN role seed that registrationService.js has needed
-- since self-registration was built (its own comment points at
-- database/seeds/tenant-admin-role.sql, which never actually existed in
-- this repo) — TENANT_USER is new, for staff who propose slot schedules
-- but cannot approve them.

INSERT INTO permissions (permission_uuid, permission_code, permission_name, resource, action, description, status, created_on, modified_on)
SELECT UUID(), 'appointment-admin:slot-config:create', 'Create appointment slot configuration', 'appointment-admin', 'create',
       'Propose a recurring appointment slot schedule for a facility service', 'ACTIVE', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE permission_code = 'appointment-admin:slot-config:create'
);

INSERT INTO permissions (permission_uuid, permission_code, permission_name, resource, action, description, status, created_on, modified_on)
SELECT UUID(), 'appointment-admin:slot-config:read', 'View appointment slot configuration', 'appointment-admin', 'read',
       'List and view appointment slot configurations', 'ACTIVE', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE permission_code = 'appointment-admin:slot-config:read'
);

INSERT INTO permissions (permission_uuid, permission_code, permission_name, resource, action, description, status, created_on, modified_on)
SELECT UUID(), 'appointment-admin:slot-config:update', 'Edit appointment slot configuration', 'appointment-admin', 'update',
       'Edit an existing appointment slot configuration', 'ACTIVE', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE permission_code = 'appointment-admin:slot-config:update'
);

INSERT INTO permissions (permission_uuid, permission_code, permission_name, resource, action, description, status, created_on, modified_on)
SELECT UUID(), 'appointment-admin:slot-config:approve', 'Approve/reject appointment slot configuration', 'appointment-admin', 'approve',
       'Approve or reject a slot configuration submitted by a tenant user', 'ACTIVE', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE permission_code = 'appointment-admin:slot-config:approve'
);

-- Roles ---------------------------------------------------------------

INSERT INTO roles (role_uuid, role_code, role_name, description, role_type, status, created_on, modified_on)
SELECT UUID(), 'TENANT_ADMIN', 'Tenant Administrator',
       'Full administrative access within one tenant, including approving slot configurations', 'APPLICATION', 'ACTIVE', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM roles WHERE role_code = 'TENANT_ADMIN'
);

INSERT INTO roles (role_uuid, role_code, role_name, description, role_type, status, created_on, modified_on)
SELECT UUID(), 'TENANT_USER', 'Tenant User',
       'Front-line staff within one tenant — can create and view slot configurations, cannot edit or approve them', 'APPLICATION', 'ACTIVE', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM roles WHERE role_code = 'TENANT_USER'
);

-- Grants ----------------------------------------------------------------

INSERT INTO role_permissions (role_id, permission_id, status, created_on, modified_on)
SELECT roles.role_id, permissions.permission_id, 'ACTIVE', NOW(), NOW()
FROM roles
JOIN permissions ON permissions.permission_code IN (
  'appointment-admin:slot-config:create',
  'appointment-admin:slot-config:read',
  'appointment-admin:slot-config:update',
  'appointment-admin:slot-config:approve'
)
LEFT JOIN role_permissions
  ON role_permissions.role_id = roles.role_id
  AND role_permissions.permission_id = permissions.permission_id
  AND role_permissions.status = 'ACTIVE'
WHERE roles.role_code = 'TENANT_ADMIN'
  AND role_permissions.role_permission_id IS NULL;

INSERT INTO role_permissions (role_id, permission_id, status, created_on, modified_on)
SELECT roles.role_id, permissions.permission_id, 'ACTIVE', NOW(), NOW()
FROM roles
JOIN permissions ON permissions.permission_code IN (
  'appointment-admin:slot-config:create',
  'appointment-admin:slot-config:read'
)
LEFT JOIN role_permissions
  ON role_permissions.role_id = roles.role_id
  AND role_permissions.permission_id = permissions.permission_id
  AND role_permissions.status = 'ACTIVE'
WHERE roles.role_code = 'TENANT_USER'
  AND role_permissions.role_permission_id IS NULL;
