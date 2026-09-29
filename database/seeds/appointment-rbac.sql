-- Appointments (list/search) RBAC
--
-- Grants TENANT_ADMIN and TENANT_USER the read permission for the new
-- read-only appointments list/search endpoint in appointment-admin
-- -service (see that repo's src/routes/appointmentRoutes.js). Both only
-- ever see their own tenant's appointments — that scoping is enforced
-- server-side in appointmentController.js, not by anything here.
--
-- SUPERADMIN needs no grant: its ALL_PERMISSIONS already bypasses every
-- permission check across every service on the platform, and additionally
-- unlocks seeing every tenant's appointments (again, enforced service-side
-- via the same ALL_PERMISSIONS check).
--
-- A separate migration from database/seeds/appointment-slot-config-rbac.sql
-- on purpose — that one is scoped to slot configuration; this one is for
-- the appointments themselves. Run after that one (TENANT_ADMIN/TENANT_USER
-- must already exist, which that seed creates).

INSERT INTO permissions (permission_uuid, permission_code, permission_name, resource, action, description, status, created_on, modified_on)
SELECT UUID(), 'appointment-admin:appointment:read', 'View appointments', 'appointment-admin', 'read',
       'List and search appointments', 'ACTIVE', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE permission_code = 'appointment-admin:appointment:read'
);

INSERT INTO role_permissions (role_id, permission_id, status, created_on, modified_on)
SELECT roles.role_id, permissions.permission_id, 'ACTIVE', NOW(), NOW()
FROM roles
JOIN permissions ON permissions.permission_code = 'appointment-admin:appointment:read'
LEFT JOIN role_permissions
  ON role_permissions.role_id = roles.role_id
  AND role_permissions.permission_id = permissions.permission_id
  AND role_permissions.status = 'ACTIVE'
WHERE roles.role_code IN ('TENANT_ADMIN', 'TENANT_USER')
  AND role_permissions.role_permission_id IS NULL;
