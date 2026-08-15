module.exports = (db) => {
  const {
    Users: User,
    Roles: Role,
    Permissions: Permission,
    UserRoles: UserRole,
    RolePermissions: RolePermission,
    ApiClients: ApiClient,
    ApiClientScopes: ApiClientScope,
    IdentityProviders: IdentityProvider,
    ExternalIdentities: ExternalIdentity,
    UserSessions: UserSession,
    AccessTokens: AccessToken,
    RefreshTokens: RefreshToken,
    MfaMethods: MfaMethod,
    UserDevices: UserDevice,
    UserCredentials: UserCredential,
    UserPreferences: UserPreference,
    OrganizationsUsers: OrganizationUser,
    FacilitiesUsers: FacilityUser,
    OauthClients: OAuthClient,
    ServiceAccounts: ServiceAccount
  } = db;

  // ==========================================
  // 1. USER ASSOCIATIONS
  // ==========================================
  if (User) {
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
  // Explicit junction-model associations avoid ambiguous aliases and support
  // direct includes such as UserRoles -> Roles.
  if (RolePermission) {
    if (Role) {
      Role.hasMany(RolePermission, { foreignKey: 'role_id' });
      RolePermission.belongsTo(Role, { foreignKey: 'role_id' });
    }
    if (Permission) {
      Permission.hasMany(RolePermission, { foreignKey: 'permission_id' });
      RolePermission.belongsTo(Permission, { foreignKey: 'permission_id' });
    }
  }

  if (UserRole) {
    if (User) {
      User.hasMany(UserRole, { foreignKey: 'user_id' });
      UserRole.belongsTo(User, { foreignKey: 'user_id' });
    }
    if (Role) {
      Role.hasMany(UserRole, { foreignKey: 'role_id' });
      UserRole.belongsTo(Role, { foreignKey: 'role_id' });
    }
  }

  // ==========================================
  // 3. API CLIENTS & SCOPES
  // ==========================================
  if (ApiClientScope) {
    if (ApiClient) {
      ApiClient.hasMany(ApiClientScope, { foreignKey: 'api_client_id' });
      ApiClientScope.belongsTo(ApiClient, { foreignKey: 'api_client_id' });
    }
    if (Permission) {
      Permission.hasMany(ApiClientScope, { foreignKey: 'permission_id' });
      ApiClientScope.belongsTo(Permission, { foreignKey: 'permission_id' });
    }
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
