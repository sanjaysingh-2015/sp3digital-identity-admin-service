-- MySQL 8.0+ migration: tenant isolation, identity integrity, and security policy storage.
--
-- Run through the deployment migration process. Do not use sequelize.sync() for this change.
-- Existing rows must be assigned to a tenant before running the FINALIZE section.

-- MySQL DDL statements implicitly commit. Execute this migration once through
-- the deployment migration runner and take a backup before applying it.

CREATE TABLE identity_tenants (
  tenant_uuid CHAR(36) NOT NULL,
  tenant_code VARCHAR(100) NOT NULL,
  tenant_name VARCHAR(150) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modified_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (tenant_uuid),
  UNIQUE KEY uq_identity_tenants_code (tenant_code),
  KEY ix_identity_tenants_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tenant_organizations (
  tenant_organization_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_uuid CHAR(36) NOT NULL,
  organization_id BIGINT NOT NULL,
  created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (tenant_organization_id),
  UNIQUE KEY uq_tenant_organizations_organization (organization_id),
  UNIQUE KEY uq_tenant_organizations_tenant_organization (tenant_uuid, organization_id),
  CONSTRAINT fk_tenant_organizations_tenant
    FOREIGN KEY (tenant_uuid) REFERENCES identity_tenants (tenant_uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE security_policies (
  security_policy_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_uuid CHAR(36) NOT NULL,
  policy_version INT UNSIGNED NOT NULL DEFAULT 1,
  min_password_length TINYINT UNSIGNED NOT NULL DEFAULT 12,
  require_uppercase BOOLEAN NOT NULL DEFAULT TRUE,
  require_lowercase BOOLEAN NOT NULL DEFAULT TRUE,
  require_number BOOLEAN NOT NULL DEFAULT TRUE,
  require_special_character BOOLEAN NOT NULL DEFAULT TRUE,
  password_history_count TINYINT UNSIGNED NOT NULL DEFAULT 5,
  password_max_age_days SMALLINT UNSIGNED NULL,
  max_failed_attempts TINYINT UNSIGNED NOT NULL DEFAULT 5,
  lockout_duration_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 30,
  access_token_lifetime_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 60,
  refresh_token_lifetime_days SMALLINT UNSIGNED NOT NULL DEFAULT 30,
  max_session_duration_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 480,
  max_concurrent_sessions TINYINT UNSIGNED NULL,
  mfa_required BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  effective_from DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  effective_to DATETIME NULL,
  created_by BIGINT NULL,
  created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modified_by BIGINT NULL,
  modified_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (security_policy_id),
  UNIQUE KEY uq_security_policies_tenant_version (tenant_uuid, policy_version),
  KEY ix_security_policies_tenant_status (tenant_uuid, status),
  CONSTRAINT fk_security_policies_tenant
    FOREIGN KEY (tenant_uuid) REFERENCES identity_tenants (tenant_uuid),
  CONSTRAINT fk_security_policies_created_by
    FOREIGN KEY (created_by) REFERENCES users (user_id),
  CONSTRAINT fk_security_policies_modified_by
    FOREIGN KEY (modified_by) REFERENCES users (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Phase 1: add ownership columns as nullable so existing records can be backfilled.
ALTER TABLE users ADD COLUMN tenant_uuid CHAR(36) NULL AFTER user_uuid;
ALTER TABLE identity_providers ADD COLUMN tenant_uuid CHAR(36) NULL AFTER identity_provider_id;
ALTER TABLE oauth_clients ADD COLUMN tenant_uuid CHAR(36) NULL AFTER oauth_client_id;
ALTER TABLE api_clients ADD COLUMN tenant_uuid CHAR(36) NULL AFTER api_client_id;
ALTER TABLE service_accounts ADD COLUMN tenant_uuid CHAR(36) NULL AFTER service_account_id;
ALTER TABLE mfa_methods ADD COLUMN tenant_uuid CHAR(36) NULL AFTER mfa_method_id;
ALTER TABLE user_sessions ADD COLUMN tenant_uuid CHAR(36) NULL AFTER session_id;
ALTER TABLE audit_logs ADD COLUMN tenant_uuid CHAR(36) NULL AFTER audit_id;

-- Audit metadata is only meaningful when recorded with the actor and key version.
ALTER TABLE identity_providers
  MODIFY COLUMN client_secret_encrypted VARBINARY(4096) NULL,
  ADD COLUMN secret_key_version VARCHAR(100) NULL AFTER client_secret_encrypted,
  ADD COLUMN secret_rotated_on DATETIME NULL AFTER secret_key_version;
ALTER TABLE oauth_clients
  MODIFY COLUMN client_secret_hash VARCHAR(512) NULL,
  ADD COLUMN secret_rotated_on DATETIME NULL AFTER client_secret_hash;
ALTER TABLE api_clients
  MODIFY COLUMN client_secret_hash VARCHAR(512) NULL,
  ADD COLUMN secret_rotated_on DATETIME NULL AFTER client_secret_hash;
ALTER TABLE mfa_methods
  MODIFY COLUMN secret_encrypted VARBINARY(4096) NULL,
  ADD COLUMN secret_key_version VARCHAR(100) NULL AFTER secret_encrypted;

-- Essential indexes and uniqueness. Remove or reconcile duplicate legacy data before applying.
ALTER TABLE users
  ADD UNIQUE KEY uq_users_uuid (user_uuid),
  ADD UNIQUE KEY uq_users_tenant_username (tenant_uuid, username),
  ADD UNIQUE KEY uq_users_tenant_email (tenant_uuid, email),
  ADD KEY ix_users_tenant_status (tenant_uuid, status);
ALTER TABLE identity_providers
  ADD UNIQUE KEY uq_identity_providers_tenant_code (tenant_uuid, provider_code),
  ADD KEY ix_identity_providers_tenant_status (tenant_uuid, status);
ALTER TABLE oauth_clients
  ADD UNIQUE KEY uq_oauth_clients_tenant_client_id (tenant_uuid, client_id),
  ADD KEY ix_oauth_clients_tenant_status (tenant_uuid, status);
ALTER TABLE api_clients
  ADD UNIQUE KEY uq_api_clients_tenant_code (tenant_uuid, client_code),
  ADD KEY ix_api_clients_tenant_status (tenant_uuid, status),
  ADD KEY ix_api_clients_organization (organization_id);
ALTER TABLE service_accounts
  ADD UNIQUE KEY uq_service_accounts_tenant_code (tenant_uuid, service_code),
  ADD KEY ix_service_accounts_tenant_status (tenant_uuid, status),
  ADD KEY ix_service_accounts_organization (organization_id);
ALTER TABLE mfa_methods ADD KEY ix_mfa_methods_tenant_user_status (tenant_uuid, user_id, status);
ALTER TABLE user_sessions ADD KEY ix_user_sessions_tenant_user_status (tenant_uuid, user_id, status);
ALTER TABLE audit_logs ADD KEY ix_audit_logs_tenant_created_on (tenant_uuid, created_on);
ALTER TABLE auth_configurations ADD UNIQUE KEY uq_auth_configurations_tenant (tenant_uuid);

-- Foreign keys missing from the current schema. Verify the referenced external organization
-- and facility tables before adding FKs for organization_id or facility_id.
ALTER TABLE access_tokens
  ADD CONSTRAINT fk_access_tokens_api_client
    FOREIGN KEY (api_client_id) REFERENCES api_clients (api_client_id),
  ADD CONSTRAINT fk_access_tokens_service_account
    FOREIGN KEY (service_account_id) REFERENCES service_accounts (service_account_id);
ALTER TABLE service_accounts
  ADD CONSTRAINT fk_service_accounts_api_client
    FOREIGN KEY (client_id) REFERENCES api_clients (api_client_id);
ALTER TABLE audit_logs
  MODIFY COLUMN actor_user_id BIGINT NULL,
  ADD CONSTRAINT fk_audit_logs_actor
    FOREIGN KEY (actor_user_id) REFERENCES users (user_id);

-- Backfill requirement (examples only; replace with approved tenant mapping logic):
-- UPDATE users SET tenant_uuid = '<tenant-uuid>' WHERE tenant_uuid IS NULL;
-- UPDATE identity_providers SET tenant_uuid = '<tenant-uuid>' WHERE tenant_uuid IS NULL;
-- UPDATE oauth_clients SET tenant_uuid = '<tenant-uuid>' WHERE tenant_uuid IS NULL;
-- UPDATE api_clients SET tenant_uuid = '<tenant-uuid>' WHERE tenant_uuid IS NULL;
-- UPDATE service_accounts SET tenant_uuid = '<tenant-uuid>' WHERE tenant_uuid IS NULL;
-- UPDATE mfa_methods m JOIN users u ON u.user_id = m.user_id SET m.tenant_uuid = u.tenant_uuid;
-- UPDATE user_sessions s JOIN users u ON u.user_id = s.user_id SET s.tenant_uuid = u.tenant_uuid;
-- UPDATE audit_logs a LEFT JOIN users u ON u.user_id = a.actor_user_id SET a.tenant_uuid = u.tenant_uuid;

-- FINALIZE ONLY AFTER BACKFILL VALIDATION:
-- ALTER TABLE users MODIFY tenant_uuid CHAR(36) NOT NULL;
-- ALTER TABLE identity_providers MODIFY tenant_uuid CHAR(36) NOT NULL;
-- ALTER TABLE oauth_clients MODIFY tenant_uuid CHAR(36) NOT NULL;
-- ALTER TABLE api_clients MODIFY tenant_uuid CHAR(36) NOT NULL;
-- ALTER TABLE service_accounts MODIFY tenant_uuid CHAR(36) NOT NULL;
-- ALTER TABLE mfa_methods MODIFY tenant_uuid CHAR(36) NOT NULL;
-- ALTER TABLE user_sessions MODIFY tenant_uuid CHAR(36) NOT NULL;
-- ALTER TABLE audit_logs MODIFY tenant_uuid CHAR(36) NOT NULL;
-- ALTER TABLE users ADD CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_uuid) REFERENCES identity_tenants (tenant_uuid);
-- ALTER TABLE identity_providers ADD CONSTRAINT fk_identity_providers_tenant FOREIGN KEY (tenant_uuid) REFERENCES identity_tenants (tenant_uuid);
-- ALTER TABLE oauth_clients ADD CONSTRAINT fk_oauth_clients_tenant FOREIGN KEY (tenant_uuid) REFERENCES identity_tenants (tenant_uuid);
-- ALTER TABLE api_clients ADD CONSTRAINT fk_api_clients_tenant FOREIGN KEY (tenant_uuid) REFERENCES identity_tenants (tenant_uuid);
-- ALTER TABLE service_accounts ADD CONSTRAINT fk_service_accounts_tenant FOREIGN KEY (tenant_uuid) REFERENCES identity_tenants (tenant_uuid);
-- ALTER TABLE mfa_methods ADD CONSTRAINT fk_mfa_methods_tenant FOREIGN KEY (tenant_uuid) REFERENCES identity_tenants (tenant_uuid);
-- ALTER TABLE user_sessions ADD CONSTRAINT fk_user_sessions_tenant FOREIGN KEY (tenant_uuid) REFERENCES identity_tenants (tenant_uuid);
-- ALTER TABLE audit_logs ADD CONSTRAINT fk_audit_logs_tenant FOREIGN KEY (tenant_uuid) REFERENCES identity_tenants (tenant_uuid);
