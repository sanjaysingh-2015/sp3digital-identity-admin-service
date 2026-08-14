const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const FacilitiesUsers = sequelize.define(
  "FacilitiesUsers",
  {
    facility_user_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      primaryKey: true,
      autoIncrement: true,
    },
    facility_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    membership_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
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
    tableName: "facilities_users",
    timestamps: false,
    freezeTableName: true,
  },
);

module.exports = FacilitiesUsers;
