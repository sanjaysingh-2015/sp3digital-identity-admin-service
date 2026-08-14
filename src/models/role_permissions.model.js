const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const RolePermissions = sequelize.define(
  "RolePermissions",
  {
    role_permission_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      primaryKey: true,
      autoIncrement: true,
    },
    role_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    permission_id: {
      type: DataTypes.BIGINT,
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
    tableName: "role_permissions",
    timestamps: false,
    freezeTableName: true,
  },
);

module.exports = RolePermissions;
