const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const RefreshTokens = sequelize.define(
  "RefreshTokens",
  {
    refresh_token_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      primaryKey: true,
      autoIncrement: true,
    },
    token_uuid: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    token_hash: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    oauth_client_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    session_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    parent_token_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    scopes: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    issued_on: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expires_on: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    used_on: {
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
    tableName: "refresh_tokens",
    timestamps: false,
    freezeTableName: true,
  },
);

module.exports = RefreshTokens;
