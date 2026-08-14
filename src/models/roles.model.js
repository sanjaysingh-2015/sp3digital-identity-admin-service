const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Roles = sequelize.define(
  "Roles",
  {
    role_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      primaryKey: true,
      autoIncrement: true,
    },
    role_uuid: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role_code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role_type: {
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
    tableName: "roles",
    timestamps: false,
    freezeTableName: true,
  },
);

module.exports = Roles;
