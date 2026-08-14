module.exports = (sequelize, DataTypes) => {
  const ApiClientScopes = sequelize.define(
    "ApiClientScopes",
    {
      api_client_scope_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        primaryKey: true,
        autoIncrement: true,
      },
      api_client_id: {
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
      tableName: "api_client_scopes",
      timestamps: false,
      freezeTableName: true,
    },
  );

  return ApiClientScopes;
};
