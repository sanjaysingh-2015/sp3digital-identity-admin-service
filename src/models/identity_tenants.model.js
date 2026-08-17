module.exports = (sequelize, DataTypes) => {
  const IdentityTenants = sequelize.define(
    "IdentityTenants",
    {
      tenantUuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: "tenant_uuid",
      },
      tenantCode: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        field: "tenant_code",
      },
      tenantName: {
        type: DataTypes.STRING(150),
        allowNull: false,
        field: "tenant_name",
      },
      status: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: "ACTIVE",
        field: "status",
      },
      createdOn: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: "created_on",
      },
      modifiedOn: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: "modified_on",
      },
    },
    {
      tableName: "identity_tenants",
      freezeTableName: true,
      timestamps: false,
    },
  );

  return IdentityTenants;
};
