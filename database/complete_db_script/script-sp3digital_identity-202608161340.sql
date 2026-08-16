-- MySQL dump 10.13  Distrib 8.0.19, for Win64 (x86_64)
--
-- Host: localhost    Database: sp3digital_identity
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `access_tokens`
--

DROP TABLE IF EXISTS `access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `access_tokens` (
  `access_token_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `token_uuid` char(36) NOT NULL,
  `token_hash` varchar(500) NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `oauth_client_id` bigint unsigned DEFAULT NULL,
  `api_client_id` bigint unsigned DEFAULT NULL,
  `service_account_id` bigint unsigned DEFAULT NULL,
  `session_id` bigint unsigned DEFAULT NULL,
  `token_type` varchar(50) NOT NULL DEFAULT 'Bearer',
  `scopes` json DEFAULT NULL,
  `issued_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `expires_on` datetime(6) NOT NULL,
  `revoked_on` datetime(6) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'ACTIVE',
  `created_by` bigint unsigned DEFAULT NULL,
  `created_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `modified_by` bigint unsigned DEFAULT NULL,
  `modified_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`access_token_id`),
  UNIQUE KEY `uk_access_token_uuid` (`token_uuid`),
  UNIQUE KEY `uk_access_token_hash` (`token_hash`),
  KEY `idx_access_tokens_user` (`user_id`,`status`),
  KEY `idx_access_tokens_expiry` (`expires_on`),
  KEY `idx_access_tokens_client` (`oauth_client_id`,`status`),
  KEY `fk_access_tokens_session` (`session_id`),
  KEY `fk_access_tokens_api_client` (`api_client_id`),
  KEY `fk_access_tokens_service_account` (`service_account_id`),
  CONSTRAINT `fk_access_tokens_api_client` FOREIGN KEY (`api_client_id`) REFERENCES `api_clients` (`api_client_id`),
  CONSTRAINT `fk_access_tokens_oauth_client` FOREIGN KEY (`oauth_client_id`) REFERENCES `oauth_clients` (`oauth_client_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_access_tokens_service_account` FOREIGN KEY (`service_account_id`) REFERENCES `service_accounts` (`service_account_id`),
  CONSTRAINT `fk_access_tokens_session` FOREIGN KEY (`session_id`) REFERENCES `user_sessions` (`session_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_access_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `access_tokens`
--

LOCK TABLES `access_tokens` WRITE;
/*!40000 ALTER TABLE `access_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `access_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `api_client_scopes`
--

DROP TABLE IF EXISTS `api_client_scopes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `api_client_scopes` (
  `api_client_scope_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `api_client_id` bigint unsigned NOT NULL,
  `permission_id` bigint unsigned NOT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'ACTIVE',
  `created_by` bigint unsigned DEFAULT NULL,
  `created_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `modified_by` bigint unsigned DEFAULT NULL,
  `modified_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`api_client_scope_id`),
  UNIQUE KEY `uk_api_client_scope` (`api_client_id`,`permission_id`),
  KEY `idx_api_client_scopes_permission` (`permission_id`),
  CONSTRAINT `fk_api_client_scopes_client` FOREIGN KEY (`api_client_id`) REFERENCES `api_clients` (`api_client_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_api_client_scopes_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`permission_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `api_client_scopes`
--

LOCK TABLES `api_client_scopes` WRITE;
/*!40000 ALTER TABLE `api_client_scopes` DISABLE KEYS */;
/*!40000 ALTER TABLE `api_client_scopes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `api_clients`
--

DROP TABLE IF EXISTS `api_clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `api_clients` (
  `api_client_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_uuid` char(36) DEFAULT NULL,
  `client_uuid` char(36) NOT NULL,
  `client_code` varchar(150) NOT NULL,
  `client_name` varchar(250) NOT NULL,
  `description` varchar(1000) DEFAULT NULL,
  `client_type` varchar(50) NOT NULL DEFAULT 'CONFIDENTIAL',
  `client_secret_hash` varchar(512) DEFAULT NULL,
  `secret_rotated_on` datetime DEFAULT NULL,
  `deactivated_on` datetime DEFAULT NULL,
  `revoked_on` datetime DEFAULT NULL,
  `organization_id` bigint unsigned DEFAULT NULL,
  `allowed_ips` json DEFAULT NULL,
  `allowed_origins` json DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'ACTIVE',
  `expires_on` datetime(6) DEFAULT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `created_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `modified_by` bigint unsigned DEFAULT NULL,
  `modified_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`api_client_id`),
  UNIQUE KEY `uk_api_clients_uuid` (`client_uuid`),
  UNIQUE KEY `uk_api_clients_code` (`client_code`),
  UNIQUE KEY `uq_api_clients_tenant_code` (`tenant_uuid`,`client_code`),
  KEY `idx_api_clients_status` (`status`),
  KEY `idx_api_clients_org` (`organization_id`),
  KEY `ix_api_clients_tenant_status` (`tenant_uuid`,`status`),
  KEY `ix_api_clients_organization` (`organization_id`),
  KEY `ix_api_clients_status_expires` (`status`,`expires_on`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `api_clients`
--

LOCK TABLES `api_clients` WRITE;
/*!40000 ALTER TABLE `api_clients` DISABLE KEYS */;
/*!40000 ALTER TABLE `api_clients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `audit_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_uuid` char(36) DEFAULT NULL,
  `actor_user_id` bigint unsigned DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `target_resource` varchar(100) DEFAULT NULL,
  `changes` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`audit_id`),
  KEY `idx_audit_logs_actor` (`actor_user_id`),
  KEY `idx_audit_logs_action` (`action`),
  KEY `ix_audit_logs_tenant_created_on` (`tenant_uuid`,`created_on`),
  CONSTRAINT `fk_audit_logs_actor` FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_configurations`
--

DROP TABLE IF EXISTS `auth_configurations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_configurations` (
  `config_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_uuid` char(36) NOT NULL,
  `allow_password_login` tinyint(1) NOT NULL DEFAULT '1',
  `allow_social_login` tinyint(1) NOT NULL DEFAULT '1',
  `allow_mfa_enforcement` tinyint(1) NOT NULL DEFAULT '0',
  `max_session_duration_minutes` int NOT NULL DEFAULT '480',
  `status` varchar(30) NOT NULL DEFAULT 'ACTIVE',
  `created_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `modified_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`config_id`),
  UNIQUE KEY `uk_auth_config_tenant` (`tenant_uuid`),
  UNIQUE KEY `uq_auth_configurations_tenant` (`tenant_uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_configurations`
--

LOCK TABLES `auth_configurations` WRITE;
/*!40000 ALTER TABLE `auth_configurations` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_configurations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `external_identities`
--

DROP TABLE IF EXISTS `external_identities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `external_identities` (
  `external_identity_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `identity_provider_id` bigint unsigned NOT NULL,
  `external_subject` varchar(500) NOT NULL,
  `external_username` varchar(320) DEFAULT NULL,
  `external_email` varchar(320) DEFAULT NULL,
  `claims` json DEFAULT NULL,
  `last_login_on` datetime(6) DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'ACTIVE',
  `created_by` bigint unsigned DEFAULT NULL,
  `created_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `modified_by` bigint unsigned DEFAULT NULL,
  `modified_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`external_identity_id`),
  UNIQUE KEY `uk_external_identity` (`identity_provider_id`,`external_subject`),
  KEY `idx_external_identity_user` (`user_id`),
  CONSTRAINT `fk_external_identity_provider` FOREIGN KEY (`identity_provider_id`) REFERENCES `identity_providers` (`identity_provider_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_external_identity_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `external_identities`
--

LOCK TABLES `external_identities` WRITE;
/*!40000 ALTER TABLE `external_identities` DISABLE KEYS */;
/*!40000 ALTER TABLE `external_identities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `facilities_users`
--

DROP TABLE IF EXISTS `facilities_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `facilities_users` (
  `facility_user_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `facility_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `membership_type` varchar(50) DEFAULT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `effective_from` datetime(6) DEFAULT NULL,
  `effective_to` datetime(6) DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'ACTIVE',
  `created_by` bigint unsigned DEFAULT NULL,
  `created_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `modified_by` bigint unsigned DEFAULT NULL,
  `modified_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`facility_user_id`),
  UNIQUE KEY `uk_facility_user` (`facility_id`,`user_id`),
  KEY `idx_facility_users_user` (`user_id`,`status`),
  CONSTRAINT `fk_facility_users_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `facilities_users`
--

LOCK TABLES `facilities_users` WRITE;
/*!40000 ALTER TABLE `facilities_users` DISABLE KEYS */;
/*!40000 ALTER TABLE `facilities_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `identity_providers`
--

DROP TABLE IF EXISTS `identity_providers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `identity_providers` (
  `identity_provider_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_uuid` char(36) DEFAULT NULL,
  `provider_uuid` char(36) NOT NULL,
  `provider_code` varchar(100) NOT NULL,
  `provider_name` varchar(250) NOT NULL,
  `provider_type` varchar(50) NOT NULL,
  `issuer_url` varchar(1000) DEFAULT NULL,
  `authorization_url` varchar(1000) DEFAULT NULL,
  `token_url` varchar(1000) DEFAULT NULL,
  `jwks_url` varchar(1000) DEFAULT NULL,
  `client_id` varchar(500) DEFAULT NULL,
  `client_secret_encrypted` varbinary(4096) DEFAULT NULL,
  `secret_key_version` varchar(100) DEFAULT NULL,
  `secret_rotated_on` datetime DEFAULT NULL,
  `scopes` json DEFAULT NULL,
  `configuration` json DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'ACTIVE',
  `created_by` bigint unsigned DEFAULT NULL,
  `created_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `modified_by` bigint unsigned DEFAULT NULL,
  `modified_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`identity_provider_id`),
  UNIQUE KEY `uk_identity_provider_uuid` (`provider_uuid`),
  UNIQUE KEY `uk_identity_provider_code` (`provider_code`),
  UNIQUE KEY `uq_identity_providers_tenant_code` (`tenant_uuid`,`provider_code`),
  KEY `idx_identity_provider_status` (`status`),
  KEY `ix_identity_providers_tenant_status` (`tenant_uuid`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `identity_providers`
--

LOCK TABLES `identity_providers` WRITE;
/*!40000 ALTER TABLE `identity_providers` DISABLE KEYS */;
/*!40000 ALTER TABLE `identity_providers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `identity_tenants`
--

DROP TABLE IF EXISTS `identity_tenants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `identity_tenants` (
  `tenant_uuid` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_code` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_on` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modified_on` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`tenant_uuid`),
  UNIQUE KEY `uq_identity_tenants_code` (`tenant_code`),
  KEY `ix_identity_tenants_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `identity_tenants`
--

LOCK TABLES `identity_tenants` WRITE;
/*!40000 ALTER TABLE `identity_tenants` DISABLE KEYS */;
INSERT INTO `identity_tenants` VALUES ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d','DEFAULT_TENANT','Default Enterprise Tenant','ACTIVE','2026-08-15 20:19:03','2026-08-15 20:19:03');
/*!40000 ALTER TABLE `identity_tenants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mfa_methods`
--

DROP TABLE IF EXISTS `mfa_methods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mfa_methods` (
  `mfa_method_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_uuid` char(36) DEFAULT NULL,
  `user_id` bigint unsigned NOT NULL,
  `method_type` varchar(50) NOT NULL,
  `method_identifier` varchar(500) DEFAULT NULL,
  `secret_encrypted` varbinary(4096) DEFAULT NULL,
  `secret_key_version` varchar(100) DEFAULT NULL,
  `failed_verification_count` tinyint unsigned NOT NULL DEFAULT '0',
  `locked_until` datetime DEFAULT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `is_verified` tinyint(1) NOT NULL DEFAULT '0',
  `verified_on` datetime(6) DEFAULT NULL,
  `last_used_on` datetime(6) DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'ACTIVE',
  `created_by` bigint unsigned DEFAULT NULL,
  `created_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `modified_by` bigint unsigned DEFAULT NULL,
  `modified_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`mfa_method_id`),
  KEY `idx_mfa_user_status` (`user_id`,`status`),
  KEY `idx_mfa_method_type` (`method_type`),
  KEY `ix_mfa_methods_tenant_user_status` (`tenant_uuid`,`user_id`,`status`),
  CONSTRAINT `fk_mfa_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mfa_methods`
--

LOCK TABLES `mfa_methods` WRITE;
/*!40000 ALTER TABLE `mfa_methods` DISABLE KEYS */;
/*!40000 ALTER TABLE `mfa_methods` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `oauth_clients`
--

DROP TABLE IF EXISTS `oauth_clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `oauth_clients` (
  `oauth_client_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_uuid` char(36) DEFAULT NULL,
  `client_uuid` char(36) NOT NULL,
  `client_id` varchar(200) NOT NULL,
  `client_name` varchar(250) NOT NULL,
  `client_type` varchar(50) NOT NULL,
  `client_secret_hash` varchar(512) DEFAULT NULL,
  `secret_rotated_on` datetime DEFAULT NULL,
  `deactivated_on` datetime DEFAULT NULL,
  `revoked_on` datetime DEFAULT NULL,
  `redirect_uris` json DEFAULT NULL,
  `allowed_scopes` json DEFAULT NULL,
  `grant_types` json DEFAULT NULL,
  `token_endpoint_auth_method` varchar(100) DEFAULT NULL,
  `organization_id` bigint unsigned DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'ACTIVE',
  `expires_on` datetime(6) DEFAULT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `created_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `modified_by` bigint unsigned DEFAULT NULL,
  `modified_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`oauth_client_id`),
  UNIQUE KEY `uk_oauth_clients_uuid` (`client_uuid`),
  UNIQUE KEY `uk_oauth_clients_client_id` (`client_id`),
  UNIQUE KEY `uq_oauth_clients_tenant_client_id` (`tenant_uuid`,`client_id`),
  KEY `idx_oauth_clients_status` (`status`),
  KEY `idx_oauth_clients_org` (`organization_id`),
  KEY `ix_oauth_clients_tenant_status` (`tenant_uuid`,`status`),
  KEY `ix_oauth_clients_status_expires` (`status`,`expires_on`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `oauth_clients`
--

LOCK TABLES `oauth_clients` WRITE;
/*!40000 ALTER TABLE `oauth_clients` DISABLE KEYS */;
/*!40000 ALTER TABLE `oauth_clients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `organizations_users`
--

DROP TABLE IF EXISTS `organizations_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `organizations_users` (
  `organization_user_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `organization_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `membership_type` varchar(50) DEFAULT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `effective_from` datetime(6) DEFAULT NULL,
  `effective_to` datetime(6) DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'ACTIVE',
  `created_by` bigint unsigned DEFAULT NULL,
  `created_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `modified_by` bigint unsigned DEFAULT NULL,
  `modified_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`organization_user_id`),
  UNIQUE KEY `uk_org_user` (`organization_id`,`user_id`),
  KEY `idx_org_users_user` (`user_id`,`status`),
  CONSTRAINT `fk_org_users_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `organizations_users`
--

LOCK TABLES `organizations_users` WRITE;
/*!40000 ALTER TABLE `organizations_users` DISABLE KEYS */;
/*!40000 ALTER TABLE `organizations_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `permission_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `permission_uuid` char(36) NOT NULL,
  `permission_code` varchar(150) NOT NULL,
  `permission_name` varchar(250) NOT NULL,
  `resource` varchar(150) NOT NULL,
  `action` varchar(100) NOT NULL,
  `description` varchar(1000) DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'ACTIVE',
  `created_by` bigint unsigned DEFAULT NULL,
  `created_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `modified_by` bigint unsigned DEFAULT NULL,
  `modified_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`permission_id`),
  UNIQUE KEY `uk_permissions_uuid` (`permission_uuid`),
  UNIQUE KEY `uk_permissions_code` (`permission_code`),
  KEY `idx_permissions_resource_action` (`resource`,`action`),
  KEY `idx_permissions_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'88888888-7777-6666-5555-444444444444','ALL_PERMISSIONS','Full Access','*','*','Grants unrestricted operational permissions','ACTIVE',NULL,'2026-08-15 20:19:03.444963',NULL,'2026-08-15 20:19:03.444963');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refresh_tokens`
--

DROP TABLE IF EXISTS `refresh_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refresh_tokens` (
  `refresh_token_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `token_uuid` char(36) NOT NULL,
  `token_hash` varchar(500) NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `oauth_client_id` bigint unsigned DEFAULT NULL,
  `session_id` bigint unsigned DEFAULT NULL,
  `parent_token_id` bigint unsigned DEFAULT NULL,
  `scopes` json DEFAULT NULL,
  `issued_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `expires_on` datetime(6) NOT NULL,
  `used_on` datetime(6) DEFAULT NULL,
  `revoked_on` datetime(6) DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'ACTIVE',
  `created_by` bigint unsigned DEFAULT NULL,
  `created_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `modified_by` bigint unsigned DEFAULT NULL,
  `modified_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`refresh_token_id`),
  UNIQUE KEY `uk_refresh_token_uuid` (`token_uuid`),
  UNIQUE KEY `uk_refresh_token_hash` (`token_hash`),
  KEY `idx_refresh_tokens_user` (`user_id`,`status`),
  KEY `idx_refresh_tokens_expiry` (`expires_on`),
  KEY `idx_refresh_tokens_client` (`oauth_client_id`,`status`),
  KEY `idx_refresh_tokens_parent` (`parent_token_id`),
  KEY `fk_refresh_tokens_session` (`session_id`),
  CONSTRAINT `fk_refresh_tokens_oauth_client` FOREIGN KEY (`oauth_client_id`) REFERENCES `oauth_clients` (`oauth_client_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_refresh_tokens_parent` FOREIGN KEY (`parent_token_id`) REFERENCES `refresh_tokens` (`refresh_token_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_refresh_tokens_session` FOREIGN KEY (`session_id`) REFERENCES `user_sessions` (`session_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_refresh_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refresh_tokens`
--

LOCK TABLES `refresh_tokens` WRITE;
/*!40000 ALTER TABLE `refresh_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `refresh_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `role_permission_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `role_id` bigint unsigned NOT NULL,
  `permission_id` bigint unsigned NOT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'ACTIVE',
  `created_by` bigint unsigned DEFAULT NULL,
  `created_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `modified_by` bigint unsigned DEFAULT NULL,
  `modified_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`role_permission_id`),
  UNIQUE KEY `uk_role_permission` (`role_id`,`permission_id`),
  KEY `idx_role_permissions_permission` (`permission_id`),
  CONSTRAINT `fk_role_permissions_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`permission_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_role_permissions_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES (1,1,1,'ACTIVE',NULL,'2026-08-15 20:19:03.458956',NULL,'2026-08-15 20:19:03.458956');
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `role_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `role_uuid` char(36) NOT NULL,
  `role_code` varchar(100) NOT NULL,
  `role_name` varchar(200) NOT NULL,
  `description` varchar(1000) DEFAULT NULL,
  `role_type` varchar(50) NOT NULL DEFAULT 'APPLICATION',
  `status` varchar(30) NOT NULL DEFAULT 'ACTIVE',
  `created_by` bigint unsigned DEFAULT NULL,
  `created_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `modified_by` bigint unsigned DEFAULT NULL,
  `modified_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `uk_roles_uuid` (`role_uuid`),
  UNIQUE KEY `uk_roles_code` (`role_code`),
  KEY `idx_roles_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'99999999-8888-7777-6666-555555555555','SUPERADMIN','Super Administrator','Full administrative access across all resources and tenants','SYSTEM','ACTIVE',NULL,'2026-08-15 20:19:03.426426',NULL,'2026-08-15 20:19:03.426426');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `security_policies`
--

DROP TABLE IF EXISTS `security_policies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `security_policies` (
  `security_policy_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_uuid` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `policy_version` int unsigned NOT NULL DEFAULT '1',
  `min_password_length` tinyint unsigned NOT NULL DEFAULT '12',
  `require_uppercase` tinyint(1) NOT NULL DEFAULT '1',
  `require_lowercase` tinyint(1) NOT NULL DEFAULT '1',
  `require_number` tinyint(1) NOT NULL DEFAULT '1',
  `require_special_character` tinyint(1) NOT NULL DEFAULT '1',
  `password_history_count` tinyint unsigned NOT NULL DEFAULT '5',
  `password_max_age_days` smallint unsigned DEFAULT NULL,
  `max_failed_attempts` tinyint unsigned NOT NULL DEFAULT '5',
  `lockout_duration_minutes` smallint unsigned NOT NULL DEFAULT '30',
  `access_token_lifetime_minutes` smallint unsigned NOT NULL DEFAULT '60',
  `refresh_token_lifetime_days` smallint unsigned NOT NULL DEFAULT '30',
  `max_session_duration_minutes` smallint unsigned NOT NULL DEFAULT '480',
  `max_concurrent_sessions` tinyint unsigned DEFAULT NULL,
  `mfa_required` tinyint(1) NOT NULL DEFAULT '0',
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `effective_from` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `effective_to` datetime DEFAULT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `created_on` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modified_by` bigint unsigned DEFAULT NULL,
  `modified_on` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`security_policy_id`),
  UNIQUE KEY `uq_security_policies_tenant_version` (`tenant_uuid`,`policy_version`),
  KEY `ix_security_policies_tenant_status` (`tenant_uuid`,`status`),
  KEY `fk_security_policies_created_by` (`created_by`),
  KEY `fk_security_policies_modified_by` (`modified_by`),
  CONSTRAINT `fk_security_policies_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_security_policies_modified_by` FOREIGN KEY (`modified_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_security_policies_tenant` FOREIGN KEY (`tenant_uuid`) REFERENCES `identity_tenants` (`tenant_uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `security_policies`
--

LOCK TABLES `security_policies` WRITE;
/*!40000 ALTER TABLE `security_policies` DISABLE KEYS */;
/*!40000 ALTER TABLE `security_policies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_accounts`
--

DROP TABLE IF EXISTS `service_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `service_accounts` (
  `service_account_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_uuid` char(36) DEFAULT NULL,
  `service_uuid` char(36) NOT NULL,
  `service_code` varchar(150) NOT NULL,
  `service_name` varchar(250) NOT NULL,
  `description` varchar(1000) DEFAULT NULL,
  `client_id` bigint unsigned DEFAULT NULL,
  `organization_id` bigint unsigned DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'ACTIVE',
  `expires_on` datetime(6) DEFAULT NULL,
  `deactivated_on` datetime DEFAULT NULL,
  `revoked_on` datetime DEFAULT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `created_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `modified_by` bigint unsigned DEFAULT NULL,
  `modified_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`service_account_id`),
  UNIQUE KEY `uk_service_accounts_uuid` (`service_uuid`),
  UNIQUE KEY `uk_service_accounts_code` (`service_code`),
  UNIQUE KEY `uq_service_accounts_tenant_code` (`tenant_uuid`,`service_code`),
  KEY `idx_service_accounts_status` (`status`),
  KEY `idx_service_accounts_client` (`client_id`),
  KEY `ix_service_accounts_tenant_status` (`tenant_uuid`,`status`),
  KEY `ix_service_accounts_organization` (`organization_id`),
  KEY `ix_service_accounts_status_expires` (`status`,`expires_on`),
  CONSTRAINT `fk_service_accounts_api_client` FOREIGN KEY (`client_id`) REFERENCES `api_clients` (`api_client_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_accounts`
--

LOCK TABLES `service_accounts` WRITE;
/*!40000 ALTER TABLE `service_accounts` DISABLE KEYS */;
/*!40000 ALTER TABLE `service_accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenant_organizations`
--

DROP TABLE IF EXISTS `tenant_organizations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenant_organizations` (
  `tenant_organization_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_uuid` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `organization_id` bigint NOT NULL,
  `created_on` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`tenant_organization_id`),
  UNIQUE KEY `uq_tenant_organizations_organization` (`organization_id`),
  UNIQUE KEY `uq_tenant_organizations_tenant_organization` (`tenant_uuid`,`organization_id`),
  CONSTRAINT `fk_tenant_organizations_tenant` FOREIGN KEY (`tenant_uuid`) REFERENCES `identity_tenants` (`tenant_uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenant_organizations`
--

LOCK TABLES `tenant_organizations` WRITE;
/*!40000 ALTER TABLE `tenant_organizations` DISABLE KEYS */;
/*!40000 ALTER TABLE `tenant_organizations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_credential_history`
--

DROP TABLE IF EXISTS `user_credential_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_credential_history` (
  `history_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `credential_type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PASSWORD',
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_algorithm` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'bcrypt',
  `created_on` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`history_id`),
  KEY `ix_user_credential_history_user` (`user_id`,`credential_type`,`created_on`),
  CONSTRAINT `fk_user_credential_history_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_credential_history`
--

LOCK TABLES `user_credential_history` WRITE;
/*!40000 ALTER TABLE `user_credential_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_credential_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_credentials`
--

DROP TABLE IF EXISTS `user_credentials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_credentials` (
  `credential_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `credential_type` varchar(50) NOT NULL DEFAULT 'PASSWORD',
  `password_hash` varchar(500) DEFAULT NULL,
  `password_algorithm` varchar(100) DEFAULT NULL,
  `password_salt` varchar(255) DEFAULT NULL,
  `password_expires_on` datetime(6) DEFAULT NULL,
  `last_used_on` datetime(6) DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'ACTIVE',
  `rotation_required` tinyint(1) NOT NULL DEFAULT '0',
  `failed_verification_count` tinyint unsigned NOT NULL DEFAULT '0',
  `locked_until` datetime DEFAULT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `created_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `modified_by` bigint unsigned DEFAULT NULL,
  `modified_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`credential_id`),
  UNIQUE KEY `uk_user_credential_type` (`user_id`,`credential_type`),
  KEY `idx_credentials_status` (`status`),
  KEY `ix_user_credentials_user_type_status` (`user_id`,`credential_type`,`status`),
  CONSTRAINT `fk_credentials_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_credentials`
--

LOCK TABLES `user_credentials` WRITE;
/*!40000 ALTER TABLE `user_credentials` DISABLE KEYS */;
INSERT INTO `user_credentials` VALUES (1,1,'PASSWORD','$2a$12$e0MYzXyjpJS7Pd0RVvHwHe1mN42mJ2/qL3ZcR4K.8W1Y6s7S8N/3S','BCRYPT',NULL,NULL,NULL,'ACTIVE',0,0,NULL,NULL,'2026-08-15 20:19:03.422721',NULL,'2026-08-15 20:19:03.422721');
/*!40000 ALTER TABLE `user_credentials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_devices`
--

DROP TABLE IF EXISTS `user_devices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_devices` (
  `device_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `device_uuid` char(36) NOT NULL,
  `device_type` varchar(50) DEFAULT NULL,
  `device_name` varchar(200) DEFAULT NULL,
  `operating_system` varchar(100) DEFAULT NULL,
  `os_version` varchar(50) DEFAULT NULL,
  `app_version` varchar(50) DEFAULT NULL,
  `push_token` varchar(1000) DEFAULT NULL,
  `last_ip_address` varchar(45) DEFAULT NULL,
  `last_seen_on` datetime(6) DEFAULT NULL,
  `is_trusted` tinyint(1) NOT NULL DEFAULT '0',
  `status` varchar(30) NOT NULL DEFAULT 'ACTIVE',
  `created_by` bigint unsigned DEFAULT NULL,
  `created_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `modified_by` bigint unsigned DEFAULT NULL,
  `modified_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`device_id`),
  UNIQUE KEY `uk_device_uuid` (`device_uuid`),
  KEY `idx_devices_user_status` (`user_id`,`status`),
  CONSTRAINT `fk_devices_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_devices`
--

LOCK TABLES `user_devices` WRITE;
/*!40000 ALTER TABLE `user_devices` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_devices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_preferences`
--

DROP TABLE IF EXISTS `user_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_preferences` (
  `preference_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `preference_key` varchar(150) NOT NULL,
  `preference_value` text,
  `preference_type` varchar(30) NOT NULL DEFAULT 'STRING',
  `status` varchar(30) NOT NULL DEFAULT 'ACTIVE',
  `created_by` bigint unsigned DEFAULT NULL,
  `created_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `modified_by` bigint unsigned DEFAULT NULL,
  `modified_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`preference_id`),
  UNIQUE KEY `uk_user_preference` (`user_id`,`preference_key`),
  CONSTRAINT `fk_preferences_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_preferences`
--

LOCK TABLES `user_preferences` WRITE;
/*!40000 ALTER TABLE `user_preferences` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_preferences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_roles` (
  `user_role_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `role_id` bigint unsigned NOT NULL,
  `effective_from` datetime(6) DEFAULT NULL,
  `effective_to` datetime(6) DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'ACTIVE',
  `created_by` bigint unsigned DEFAULT NULL,
  `created_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `modified_by` bigint unsigned DEFAULT NULL,
  `modified_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`user_role_id`),
  UNIQUE KEY `uk_user_role` (`user_id`,`role_id`),
  KEY `idx_user_roles_role` (`role_id`),
  KEY `idx_user_roles_status` (`user_id`,`status`),
  KEY `ix_user_roles_user_effective` (`user_id`,`effective_from`,`effective_to`,`status`),
  CONSTRAINT `fk_user_roles_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_roles`
--

LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
INSERT INTO `user_roles` VALUES (1,1,1,NULL,NULL,'ACTIVE',NULL,'2026-08-15 20:19:03.441203',NULL,'2026-08-15 20:19:03.441203');
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_sessions`
--

DROP TABLE IF EXISTS `user_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_sessions` (
  `session_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_uuid` char(36) DEFAULT NULL,
  `session_uuid` char(36) NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `session_token_hash` varchar(500) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(1000) DEFAULT NULL,
  `device_id` bigint unsigned DEFAULT NULL,
  `login_method` varchar(50) DEFAULT NULL,
  `created_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `expires_on` datetime(6) NOT NULL,
  `last_activity_on` datetime(6) DEFAULT NULL,
  `revoked_on` datetime(6) DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'ACTIVE',
  `created_by` bigint unsigned DEFAULT NULL,
  `modified_by` bigint unsigned DEFAULT NULL,
  `modified_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`session_id`),
  UNIQUE KEY `uk_sessions_uuid` (`session_uuid`),
  UNIQUE KEY `uk_sessions_token` (`session_token_hash`),
  KEY `idx_sessions_user_status` (`user_id`,`status`),
  KEY `idx_sessions_expiry` (`expires_on`),
  KEY `ix_user_sessions_tenant_user_status` (`tenant_uuid`,`user_id`,`status`),
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_sessions`
--

LOCK TABLES `user_sessions` WRITE;
/*!40000 ALTER TABLE `user_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_uuid` char(36) NOT NULL,
  `tenant_uuid` char(36) DEFAULT NULL,
  `username` varchar(150) NOT NULL,
  `email` varchar(320) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) NOT NULL,
  `display_name` varchar(250) DEFAULT NULL,
  `phone_country_code` varchar(10) DEFAULT NULL,
  `phone_number` varchar(30) DEFAULT NULL,
  `user_type` varchar(50) NOT NULL DEFAULT 'USER',
  `status` varchar(30) NOT NULL DEFAULT 'ACTIVE',
  `email_verified` tinyint(1) NOT NULL DEFAULT '0',
  `phone_verified` tinyint(1) NOT NULL DEFAULT '0',
  `last_login_on` datetime(6) DEFAULT NULL,
  `password_changed_on` datetime(6) DEFAULT NULL,
  `account_locked_until` datetime(6) DEFAULT NULL,
  `failed_login_count` int unsigned NOT NULL DEFAULT '0',
  `created_by` bigint unsigned DEFAULT NULL,
  `created_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `modified_by` bigint unsigned DEFAULT NULL,
  `modified_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uk_users_uuid` (`user_uuid`),
  UNIQUE KEY `uk_users_username` (`username`),
  UNIQUE KEY `uk_users_email` (`email`),
  UNIQUE KEY `uq_users_uuid` (`user_uuid`),
  UNIQUE KEY `uq_users_tenant_username` (`tenant_uuid`,`username`),
  UNIQUE KEY `uq_users_tenant_email` (`tenant_uuid`,`email`),
  KEY `idx_users_status` (`status`),
  KEY `idx_users_type_status` (`user_type`,`status`),
  KEY `idx_users_phone` (`phone_country_code`,`phone_number`),
  KEY `ix_users_tenant_status` (`tenant_uuid`,`status`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'11111111-2222-3333-4444-555555555555','a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d','superadmin','admin@sp3digital.com','System',NULL,'Administrator','Super Administrator',NULL,NULL,'ADMIN','ACTIVE',1,0,NULL,NULL,NULL,0,NULL,'2026-08-15 20:19:03.419851',NULL,'2026-08-15 20:19:03.419851');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'sp3digital_identity'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-16 13:40:05
