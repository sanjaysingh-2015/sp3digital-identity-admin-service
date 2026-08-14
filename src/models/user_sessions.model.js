const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const UserSessions = sequelize.define(
  "UserSessions",
  {
    session_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      primaryKey: true,
      autoIncrement: true,
    },
    session_uuid: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    session_token_hash: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    device_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    login_method: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_on: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expires_on: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    last_activity_on: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    revoked_on: {
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
    tableName: "user_sessions",
    timestamps: false,
    freezeTableName: true,
  },
);

module.exports = UserSessions;
