module.exports = (sequelize, DataTypes) => {
  const ServiceAccounts = sequelize.define(
    "ServiceAccounts",
    {
      service_account_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        primaryKey: true,
        autoIncrement: true,
      },
      tenant_uuid: {
        type: DataTypes.STRING(36),
        allowNull: true,
      },
      service_uuid: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      service_code: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      service_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      client_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      organization_id: {
        type: DataTypes.BIGINT,
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
      tableName: "service_accounts",
      timestamps: false,
      freezeTableName: true,
    },
  );

  return ServiceAccounts;
};
