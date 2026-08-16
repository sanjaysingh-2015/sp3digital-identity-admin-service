module.exports = (sequelize, DataTypes) => {
  const MfaMethods = sequelize.define(
    "MfaMethods",
    {
      mfa_method_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        primaryKey: true,
        autoIncrement: true,
      },
      tenant_uuid: {
        type: DataTypes.STRING(36),
        allowNull: true,
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      method_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      method_identifier: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      secret_encrypted: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      secret_key_version: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      failed_verification_count: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      locked_until: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      is_primary: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      is_verified: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      verified_on: {
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
      tableName: "mfa_methods",
      timestamps: false,
      freezeTableName: true,
    },
  );

  return MfaMethods;
};
