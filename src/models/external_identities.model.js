module.exports = (sequelize, DataTypes) => {
  const ExternalIdentities = sequelize.define(
    "ExternalIdentities",
    {
      external_identity_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      identity_provider_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      external_subject: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      external_username: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      external_email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      claims: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      last_login_on: {
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
      tableName: "external_identities",
      timestamps: false,
      freezeTableName: true,
    },
  );

  return ExternalIdentities;
};
