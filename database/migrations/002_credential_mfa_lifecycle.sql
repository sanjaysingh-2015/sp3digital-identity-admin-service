-- MySQL 8.0+ migration: credential rotation history, MFA brute-force protection,
-- and lifecycle (deactivate/rotate/expiry) columns for machine identities.
--
-- Run through the deployment migration process. Do not use sequelize.sync() for this change.

-- ---------------------------------------------------------------------------
-- 1. Password/credential rotation history (needed to enforce passwordHistoryCount
--    from security_policies and to block reuse of recent passwords).
-- ---------------------------------------------------------------------------
CREATE TABLE user_credential_history (
  history_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  credential_type VARCHAR(30) NOT NULL DEFAULT 'PASSWORD',
  password_hash VARCHAR(255) NOT NULL,
  password_algorithm VARCHAR(30) NOT NULL DEFAULT 'bcrypt',
  created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (history_id),
  KEY ix_user_credential_history_user (user_id, credential_type, created_on),
  CONSTRAINT fk_user_credential_history_user
    FOREIGN KEY (user_id) REFERENCES users (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE user_credentials
  ADD COLUMN rotation_required BOOLEAN NOT NULL DEFAULT FALSE AFTER status,
  ADD COLUMN failed_verification_count TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER rotation_required,
  ADD COLUMN locked_until DATETIME NULL AFTER failed_verification_count,
  ADD KEY ix_user_credentials_user_type_status (user_id, credential_type, status);

-- ---------------------------------------------------------------------------
-- 2. MFA brute-force protection + key-version bookkeeping
--    (secret_key_version/tenant_uuid columns already exist from migration 001;
--     this adds the counters needed to actually lock a method after N failures).
-- ---------------------------------------------------------------------------
ALTER TABLE mfa_methods
  ADD COLUMN failed_verification_count TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER secret_key_version,
  ADD COLUMN locked_until DATETIME NULL AFTER failed_verification_count;

-- ---------------------------------------------------------------------------
-- 3. Lifecycle columns for machine identities: distinguish a reversible
--    "deactivate" from a permanent "revoke", and track rotation/expiry.
-- ---------------------------------------------------------------------------
ALTER TABLE api_clients
  ADD COLUMN deactivated_on DATETIME NULL AFTER secret_rotated_on,
  ADD COLUMN revoked_on DATETIME NULL AFTER deactivated_on;

ALTER TABLE oauth_clients
  ADD COLUMN deactivated_on DATETIME NULL AFTER secret_rotated_on,
  ADD COLUMN revoked_on DATETIME NULL AFTER deactivated_on;

ALTER TABLE service_accounts
  ADD COLUMN deactivated_on DATETIME NULL AFTER expires_on,
  ADD COLUMN revoked_on DATETIME NULL AFTER deactivated_on;

-- Useful indexes for pagination/filtering by status + expiry.
ALTER TABLE api_clients ADD KEY ix_api_clients_status_expires (status, expires_on);
ALTER TABLE oauth_clients ADD KEY ix_oauth_clients_status_expires (status, expires_on);
ALTER TABLE service_accounts ADD KEY ix_service_accounts_status_expires (status, expires_on);
ALTER TABLE user_roles ADD KEY ix_user_roles_user_effective (user_id, effective_from, effective_to, status);
