module.exports = (sequelize, DataTypes) => {
  const AccessTokens = sequelize.define(
    "AccessTokens",
    {
      access_token_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      token_uuid: {
        type: DataTypes.STRING(36),
        allowNull: false,
      },
      token_hash: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      oauth_client_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      api_client_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      service_account_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      session_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      token_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "Bearer",
      },
      scopes: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      issued_on: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      expires_on: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      revoked_on: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: "ACTIVE",
      },
      created_by: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      created_on: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      modified_by: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      modified_on: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "access_tokens",
      timestamps: false,
      freezeTableName: true,
    },
  );

  return AccessTokens;
};
