const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const OauthClients = sequelize.define('OauthClients', {
    oauth_client_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      primaryKey: true,
autoIncrement: true,
    },
    client_uuid: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    client_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    client_name: {
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
    redirect_uris: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    allowed_scopes: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    grant_types: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    token_endpoint_auth_method: {
      type: DataTypes.STRING,
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
}, {
  tableName: 'oauth_clients',
  timestamps: false,
  freezeTableName: true
});

module.exports = OauthClients;
