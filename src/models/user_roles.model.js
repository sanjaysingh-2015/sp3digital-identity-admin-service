module.exports = (sequelize, DataTypes) => {
  const UserRoles = sequelize.define(
    "UserRoles",
    {
      user_role_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      role_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      effective_from: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      effective_to: {
        type: DataTypes.DATE,
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
      tableName: "user_roles",
      timestamps: false,
      freezeTableName: true,
    },
  );

  return UserRoles;
};
