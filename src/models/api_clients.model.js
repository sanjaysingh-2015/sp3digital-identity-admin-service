module.exports = (sequelize, DataTypes) => {
  const ApiClients = sequelize.define(
    "ApiClients",
    {
      api_client_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        primaryKey: true,
        autoIncrement: true,
      },
      tenant_uuid: {
        type: DataTypes.STRING(36),
        allowNull: true,
      },
      client_uuid: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      client_code: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      client_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      client_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      client_secret_hash: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      organization_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      allowed_ips: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      allowed_origins: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      expires_on: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      secret_rotated_on: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      deactivated_on: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      revoked_on: {
        type: DataTypes.DATE,
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
      tableName: "api_clients",
      timestamps: false,
      freezeTableName: true,
    },
  );

  return ApiClients;
};
