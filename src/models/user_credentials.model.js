const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const UserCredentials = sequelize.define(
  "UserCredentials",
  {
    credential_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    credential_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    password_algorithm: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    password_salt: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    password_expires_on: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    last_used_on: {
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
    tableName: "user_credentials",
    timestamps: false,
    freezeTableName: true,
  },
);

module.exports = UserCredentials;
