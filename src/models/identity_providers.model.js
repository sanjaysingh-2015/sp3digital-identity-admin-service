module.exports = (sequelize, DataTypes) => {
  const IdentityProviders = sequelize.define(
    "IdentityProviders",
    {
      identity_provider_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        primaryKey: true,
        autoIncrement: true,
      },
      provider_uuid: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      provider_code: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      provider_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      provider_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      issuer_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      authorization_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      token_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      jwks_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      client_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      client_secret_encrypted: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      scopes: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      configuration: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      created_by: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      created_on: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      modified_by: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      modified_on: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "identity_providers",
      timestamps: false,
      freezeTableName: true,
    },
  );

  return IdentityProviders;
};
