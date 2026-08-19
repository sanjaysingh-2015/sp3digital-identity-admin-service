module.exports = (sequelize, DataTypes) => {
  const Permissions = sequelize.define(
    "Permissions",
    {
      permission_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        primaryKey: true,
        autoIncrement: true,
      },
      permission_uuid: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      permission_code: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      permission_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      resource_category: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      resource: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      action_category: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      action: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      description: {
        type: DataTypes.STRING,
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
      tableName: "permissions",
      timestamps: false,
      freezeTableName: true,
    },
  );

  return Permissions;
};
