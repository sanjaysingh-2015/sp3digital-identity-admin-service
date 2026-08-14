/**
 * Sequelize associations derived from the SP3 Digital Identity MySQL DDL.
 *
 * Only associations backed by FOREIGN KEY constraints in the supplied SQL are
 * created here. Relationships to organization/facility tables and a few token
 * references are intentionally not invented where the DDL has no FK target.
 */
module.exports = (db) => {
  const {
    AccessTokens,
    ApiClientScopes,
    ApiClients,
    ExternalIdentities,
    FacilitiesUsers,
    IdentityProviders,
    MfaMethods,
    OauthClients,
    OrganizationsUsers,
    Permissions,
    RefreshTokens,
    RolePermissions,
    Roles,
    ServiceAccounts,
    UserCredentials,
    UserDevices,
    UserPreferences,
    UserRoles,
    UserSessions,
    Users,
  } = db;

  // fk_credentials_user: user_credentials.user_id -> users.user_id
  UserCredentials.belongsTo(Users, {
    foreignKey: 'user_id',
    targetKey: 'user_id',
    as: 'users' ,
    onDelete: 'CASCADE',
  });

  // fk_sessions_user: user_sessions.user_id -> users.user_id
  UserSessions.belongsTo(Users, {
    foreignKey: 'user_id',
    targetKey: 'user_id',
    as: 'users' ,
    onDelete: 'CASCADE',
  });

  // fk_role_permissions_role: role_permissions.role_id -> roles.role_id
  RolePermissions.belongsTo(Roles, {
    foreignKey: 'role_id',
    targetKey: 'role_id',
    as: 'roles' ,
    onDelete: 'CASCADE',
  });

  // fk_role_permissions_permission: role_permissions.permission_id -> permissions.permission_id
  RolePermissions.belongsTo(Permissions, {
    foreignKey: 'permission_id',
    targetKey: 'permission_id',
    as: 'permissions' ,
    onDelete: 'CASCADE',
  });

  // fk_user_roles_user: user_roles.user_id -> users.user_id
  UserRoles.belongsTo(Users, {
    foreignKey: 'user_id',
    targetKey: 'user_id',
    as: 'users' ,
    onDelete: 'CASCADE',
  });

  // fk_user_roles_role: user_roles.role_id -> roles.role_id
  UserRoles.belongsTo(Roles, {
    foreignKey: 'role_id',
    targetKey: 'role_id',
    as: 'roles' ,
    onDelete: 'CASCADE',
  });

  // fk_org_users_user: organizations_users.user_id -> users.user_id
  OrganizationsUsers.belongsTo(Users, {
    foreignKey: 'user_id',
    targetKey: 'user_id',
    as: 'users' ,
    onDelete: 'CASCADE',
  });

  // fk_facility_users_user: facilities_users.user_id -> users.user_id
  FacilitiesUsers.belongsTo(Users, {
    foreignKey: 'user_id',
    targetKey: 'user_id',
    as: 'users' ,
    onDelete: 'CASCADE',
  });

  // fk_preferences_user: user_preferences.user_id -> users.user_id
  UserPreferences.belongsTo(Users, {
    foreignKey: 'user_id',
    targetKey: 'user_id',
    as: 'users' ,
    onDelete: 'CASCADE',
  });

  // fk_devices_user: user_devices.user_id -> users.user_id
  UserDevices.belongsTo(Users, {
    foreignKey: 'user_id',
    targetKey: 'user_id',
    as: 'users' ,
    onDelete: 'CASCADE',
  });

  // fk_mfa_user: mfa_methods.user_id -> users.user_id
  MfaMethods.belongsTo(Users, {
    foreignKey: 'user_id',
    targetKey: 'user_id',
    as: 'users' ,
    onDelete: 'CASCADE',
  });

  // fk_api_client_scopes_client: api_client_scopes.api_client_id -> api_clients.api_client_id
  ApiClientScopes.belongsTo(ApiClients, {
    foreignKey: 'api_client_id',
    targetKey: 'api_client_id',
    as: 'apiClients' ,
    onDelete: 'CASCADE',
  });

  // fk_api_client_scopes_permission: api_client_scopes.permission_id -> permissions.permission_id
  ApiClientScopes.belongsTo(Permissions, {
    foreignKey: 'permission_id',
    targetKey: 'permission_id',
    as: 'permissions' ,
    onDelete: 'CASCADE',
  });

  // fk_external_identity_user: external_identities.user_id -> users.user_id
  ExternalIdentities.belongsTo(Users, {
    foreignKey: 'user_id',
    targetKey: 'user_id',
    as: 'users' ,
    onDelete: 'CASCADE',
  });

  // fk_external_identity_provider: external_identities.identity_provider_id -> identity_providers.identity_provider_id
  ExternalIdentities.belongsTo(IdentityProviders, {
    foreignKey: 'identity_provider_id',
    targetKey: 'identity_provider_id',
    as: 'identityProviders' ,
    onDelete: 'CASCADE',
  });

  // fk_access_tokens_user: access_tokens.user_id -> users.user_id
  AccessTokens.belongsTo(Users, {
    foreignKey: 'user_id',
    targetKey: 'user_id',
    as: 'users' ,
    onDelete: 'CASCADE',
  });

  // fk_access_tokens_oauth_client: access_tokens.oauth_client_id -> oauth_clients.oauth_client_id
  AccessTokens.belongsTo(OauthClients, {
    foreignKey: 'oauth_client_id',
    targetKey: 'oauth_client_id',
    as: 'oauthClients' ,
    onDelete: 'SET NULL',
  });

  // fk_access_tokens_session: access_tokens.session_id -> user_sessions.session_id
  AccessTokens.belongsTo(UserSessions, {
    foreignKey: 'session_id',
    targetKey: 'session_id',
    as: 'userSessions' ,
    onDelete: 'SET NULL',
  });

  // fk_refresh_tokens_user: refresh_tokens.user_id -> users.user_id
  RefreshTokens.belongsTo(Users, {
    foreignKey: 'user_id',
    targetKey: 'user_id',
    as: 'users' ,
    onDelete: 'CASCADE',
  });

  // fk_refresh_tokens_oauth_client: refresh_tokens.oauth_client_id -> oauth_clients.oauth_client_id
  RefreshTokens.belongsTo(OauthClients, {
    foreignKey: 'oauth_client_id',
    targetKey: 'oauth_client_id',
    as: 'oauthClients' ,
    onDelete: 'SET NULL',
  });

  // fk_refresh_tokens_session: refresh_tokens.session_id -> user_sessions.session_id
  RefreshTokens.belongsTo(UserSessions, {
    foreignKey: 'session_id',
    targetKey: 'session_id',
    as: 'userSessions' ,
    onDelete: 'SET NULL',
  });

  // fk_refresh_tokens_parent: refresh_tokens.parent_token_id -> refresh_tokens.refresh_token_id
  RefreshTokens.belongsTo(RefreshTokens, {
    foreignKey: 'parent_token_id',
    targetKey: 'refresh_token_id',
    as: 'refreshTokens' ,
    onDelete: 'SET NULL',
  });

  Users.hasMany(UserCredentials, {
    foreignKey: 'user_id',
    sourceKey: 'user_id',
    as: 'user_credentials',
    onDelete: 'CASCADE',
  });

  Users.hasMany(UserSessions, {
    foreignKey: 'user_id',
    sourceKey: 'user_id',
    as: 'user_sessions',
    onDelete: 'CASCADE',
  });

  Roles.hasMany(RolePermissions, {
    foreignKey: 'role_id',
    sourceKey: 'role_id',
    as: 'role_permissions',
    onDelete: 'CASCADE',
  });

  Permissions.hasMany(RolePermissions, {
    foreignKey: 'permission_id',
    sourceKey: 'permission_id',
    as: 'role_permissions',
    onDelete: 'CASCADE',
  });

  Users.hasMany(UserRoles, {
    foreignKey: 'user_id',
    sourceKey: 'user_id',
    as: 'user_roles',
    onDelete: 'CASCADE',
  });

  Roles.hasMany(UserRoles, {
    foreignKey: 'role_id',
    sourceKey: 'role_id',
    as: 'user_roles',
    onDelete: 'CASCADE',
  });

  Users.hasMany(OrganizationsUsers, {
    foreignKey: 'user_id',
    sourceKey: 'user_id',
    as: 'organizations_users',
    onDelete: 'CASCADE',
  });

  Users.hasMany(FacilitiesUsers, {
    foreignKey: 'user_id',
    sourceKey: 'user_id',
    as: 'facilities_users',
    onDelete: 'CASCADE',
  });

  Users.hasMany(UserPreferences, {
    foreignKey: 'user_id',
    sourceKey: 'user_id',
    as: 'user_preferences',
    onDelete: 'CASCADE',
  });

  Users.hasMany(UserDevices, {
    foreignKey: 'user_id',
    sourceKey: 'user_id',
    as: 'user_devices',
    onDelete: 'CASCADE',
  });

  Users.hasMany(MfaMethods, {
    foreignKey: 'user_id',
    sourceKey: 'user_id',
    as: 'mfa_methods',
    onDelete: 'CASCADE',
  });

  ApiClients.hasMany(ApiClientScopes, {
    foreignKey: 'api_client_id',
    sourceKey: 'api_client_id',
    as: 'api_client_scopes',
    onDelete: 'CASCADE',
  });

  Permissions.hasMany(ApiClientScopes, {
    foreignKey: 'permission_id',
    sourceKey: 'permission_id',
    as: 'api_client_scopes',
    onDelete: 'CASCADE',
  });

  Users.hasMany(ExternalIdentities, {
    foreignKey: 'user_id',
    sourceKey: 'user_id',
    as: 'external_identities',
    onDelete: 'CASCADE',
  });

  IdentityProviders.hasMany(ExternalIdentities, {
    foreignKey: 'identity_provider_id',
    sourceKey: 'identity_provider_id',
    as: 'external_identities',
    onDelete: 'CASCADE',
  });

  Users.hasMany(AccessTokens, {
    foreignKey: 'user_id',
    sourceKey: 'user_id',
    as: 'access_tokens',
    onDelete: 'CASCADE',
  });

  OauthClients.hasMany(AccessTokens, {
    foreignKey: 'oauth_client_id',
    sourceKey: 'oauth_client_id',
    as: 'access_tokens',
    onDelete: 'SET NULL',
  });

  UserSessions.hasMany(AccessTokens, {
    foreignKey: 'session_id',
    sourceKey: 'session_id',
    as: 'access_tokens',
    onDelete: 'SET NULL',
  });

  Users.hasMany(RefreshTokens, {
    foreignKey: 'user_id',
    sourceKey: 'user_id',
    as: 'refresh_tokens',
    onDelete: 'CASCADE',
  });

  OauthClients.hasMany(RefreshTokens, {
    foreignKey: 'oauth_client_id',
    sourceKey: 'oauth_client_id',
    as: 'refresh_tokens',
    onDelete: 'SET NULL',
  });

  UserSessions.hasMany(RefreshTokens, {
    foreignKey: 'session_id',
    sourceKey: 'session_id',
    as: 'refresh_tokens',
    onDelete: 'SET NULL',
  });

  RefreshTokens.hasMany(RefreshTokens, {
    foreignKey: 'parent_token_id',
    sourceKey: 'refresh_token_id',
    as: 'refresh_tokens',
    onDelete: 'SET NULL',
  });

  Users.belongsToMany(Roles, {
    through: UserRoles,
    foreignKey: 'user_id',
    otherKey: 'role_id',
    as: 'roles',
  });

  Roles.belongsToMany(Users, {
    through: UserRoles,
    foreignKey: 'role_id',
    otherKey: 'user_id',
    as: 'users',
  });

  Roles.belongsToMany(Permissions, {
    through: RolePermissions,
    foreignKey: 'role_id',
    otherKey: 'permission_id',
    as: 'permissions',
  });

  Permissions.belongsToMany(Roles, {
    through: RolePermissions,
    foreignKey: 'permission_id',
    otherKey: 'role_id',
    as: 'roles',
  });

  ApiClients.belongsToMany(Permissions, {
    through: ApiClientScopes,
    foreignKey: 'api_client_id',
    otherKey: 'permission_id',
    as: 'permissions',
  });

  Permissions.belongsToMany(ApiClients, {
    through: ApiClientScopes,
    foreignKey: 'permission_id',
    otherKey: 'api_client_id',
    as: 'api_clients',
  });

  RefreshTokens.belongsTo(RefreshTokens, {
    foreignKey: 'parent_token_id',
    targetKey: 'refresh_token_id',
    as: 'parentToken',
    onDelete: 'SET NULL',
  });

  RefreshTokens.hasMany(RefreshTokens, {
    foreignKey: 'parent_token_id',
    sourceKey: 'refresh_token_id',
    as: 'childTokens',
    onDelete: 'SET NULL',
  });

};
