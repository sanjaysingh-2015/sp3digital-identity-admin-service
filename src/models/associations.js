module.exports = (db) => {
  const {
    User,
    Role,
    Permission,
    UserRole,
    RolePermission,
    ApiClient,
    ApiClientScope,
    IdentityProvider,
    ExternalIdentity,
    UserSession,
    AccessToken,
    RefreshToken,
    MfaMethod,
    UserDevice,
    UserCredential,
    UserPreference,
    OrganizationUser,
    FacilityUser,
    OAuthClient,
    ServiceAccount
  } = db;

  // ==========================================
  // 1. USER ASSOCIATIONS
  // ==========================================
  if (User) {
    if (UserRole) User.hasMany(UserRole, { foreignKey: 'user_id' });
    if (UserSession) User.hasMany(UserSession, { foreignKey: 'user_id' });
    if (ExternalIdentity) User.hasMany(ExternalIdentity, { foreignKey: 'user_id' });
    if (MfaMethod) User.hasMany(MfaMethod, { foreignKey: 'user_id' });
    if (UserDevice) User.hasMany(UserDevice, { foreignKey: 'user_id' });
    if (UserCredential) User.hasMany(UserCredential, { foreignKey: 'user_id' });
    if (UserPreference) User.hasMany(UserPreference, { foreignKey: 'user_id' });
    if (OrganizationUser) User.hasMany(OrganizationUser, { foreignKey: 'user_id' });
    if (FacilityUser) User.hasMany(FacilityUser, { foreignKey: 'user_id' });
    if (AccessToken) User.hasMany(AccessToken, { foreignKey: 'user_id' });
    if (RefreshToken) User.hasMany(RefreshToken, { foreignKey: 'user_id' });
  }

  // Inverse User BelongsTo relationships
  if (UserRole && User) UserRole.belongsTo(User, { foreignKey: 'user_id' });
  if (UserSession && User) UserSession.belongsTo(User, { foreignKey: 'user_id' });
  if (ExternalIdentity && User) ExternalIdentity.belongsTo(User, { foreignKey: 'user_id' });
  if (MfaMethod && User) MfaMethod.belongsTo(User, { foreignKey: 'user_id' });
  if (UserDevice && User) UserDevice.belongsTo(User, { foreignKey: 'user_id' });
  if (UserCredential && User) UserCredential.belongsTo(User, { foreignKey: 'user_id' });
  if (UserPreference && User) UserPreference.belongsTo(User, { foreignKey: 'user_id' });
  if (OrganizationUser && User) OrganizationUser.belongsTo(User, { foreignKey: 'user_id' });
  if (FacilityUser && User) FacilityUser.belongsTo(User, { foreignKey: 'user_id' });

  // ==========================================
  // 2. ROLES & PERMISSIONS (MANY-TO-MANY)
  // ==========================================
  if (Role && Permission && RolePermission) {
    Role.belongsToMany(Permission, {
      through: RolePermission,
      foreignKey: 'role_id',
      otherKey: 'permission_id'
    });
    Permission.belongsToMany(Role, {
      through: RolePermission,
      foreignKey: 'permission_id',
      otherKey: 'role_id'
    });
  }

  if (User && Role && UserRole) {
    User.belongsToMany(Role, {
      through: UserRole,
      foreignKey: 'user_id',
      otherKey: 'role_id'
    });
    Role.belongsToMany(User, {
      through: UserRole,
      foreignKey: 'role_id',
      otherKey: 'user_id'
    });
  }

  // Direct FK associations for junction models
  if (RolePermission) {
    if (Role) RolePermission.belongsTo(Role, { foreignKey: 'role_id' });
    if (Permission) RolePermission.belongsTo(Permission, { foreignKey: 'permission_id' });
  }

  // ==========================================
  // 3. API CLIENTS & SCOPES
  // ==========================================
  if (ApiClient && Permission && ApiClientScope) {
    ApiClient.belongsToMany(Permission, {
      through: ApiClientScope,
      foreignKey: 'api_client_id',
      otherKey: 'permission_id'
    });
    Permission.belongsToMany(ApiClient, {
      through: ApiClientScope,
      foreignKey: 'permission_id',
      otherKey: 'api_client_id'
    });
  }

  if (ApiClientScope) {
    if (ApiClient) ApiClientScope.belongsTo(ApiClient, { foreignKey: 'api_client_id' });
    if (Permission) ApiClientScope.belongsTo(Permission, { foreignKey: 'permission_id' });
  }

  // ==========================================
  // 4. EXTERNAL IDENTITY PROVIDERS
  // ==========================================
  if (IdentityProvider && ExternalIdentity) {
    IdentityProvider.hasMany(ExternalIdentity, { foreignKey: 'identity_provider_id' });
    ExternalIdentity.belongsTo(IdentityProvider, { foreignKey: 'identity_provider_id' });
  }

  // ==========================================
  // 5. SERVICE ACCOUNTS & OAUTH CLIENTS
  // ==========================================
  if (ServiceAccount && AccessToken) {
    ServiceAccount.hasMany(AccessToken, { foreignKey: 'service_account_id' });
    AccessToken.belongsTo(ServiceAccount, { foreignKey: 'service_account_id' });
  }

  if (ApiClient && AccessToken) {
    ApiClient.hasMany(AccessToken, { foreignKey: 'api_client_id' });
    AccessToken.belongsTo(ApiClient, { foreignKey: 'api_client_id' });
  }

  if (OAuthClient) {
    if (AccessToken) {
      OAuthClient.hasMany(AccessToken, { foreignKey: 'oauth_client_id' });
      AccessToken.belongsTo(OAuthClient, { foreignKey: 'oauth_client_id' });
    }
    if (RefreshToken) {
      OAuthClient.hasMany(RefreshToken, { foreignKey: 'oauth_client_id' });
      RefreshToken.belongsTo(OAuthClient, { foreignKey: 'oauth_client_id' });
    }
  }

  // ==========================================
  // 6. SESSION & TOKEN ASSOCIATIONS
  // ==========================================
  if (UserSession) {
    if (AccessToken) {
      UserSession.hasMany(AccessToken, { foreignKey: 'session_id' });
      AccessToken.belongsTo(UserSession, { foreignKey: 'session_id' });
    }
    if (RefreshToken) {
      UserSession.hasMany(RefreshToken, { foreignKey: 'session_id' });
      RefreshToken.belongsTo(UserSession, { foreignKey: 'session_id' });
    }
    if (UserDevice) {
      UserDevice.hasMany(UserSession, { foreignKey: 'device_id' });
      UserSession.belongsTo(UserDevice, { foreignKey: 'device_id' });
    }
  }

  // Refresh Token self-referencing lineage
  if (RefreshToken) {
    RefreshToken.hasMany(RefreshToken, { foreignKey: 'parent_token_id', as: 'childTokens' });
    RefreshToken.belongsTo(RefreshToken, { foreignKey: 'parent_token_id', as: 'parentToken' });
  }
};