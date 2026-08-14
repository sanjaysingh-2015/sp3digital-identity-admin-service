module.exports = (sequelize, DataTypes) => {
  const UserPreferences = sequelize.define(
    "UserPreferences",
    {
      preference_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      preference_key: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      preference_value: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      preference_type: {
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
      tableName: "user_preferences",
      timestamps: false,
      freezeTableName: true,
    },
  );

  return UserPreferences;
};
