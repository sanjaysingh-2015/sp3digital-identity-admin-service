module.exports = (sequelize, DataTypes) => {
  const UserCredentialHistory = sequelize.define(
    "UserCredentialHistory",
    {
      history_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      credential_type: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "PASSWORD",
      },
      password_hash: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      password_algorithm: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "bcrypt",
      },
      created_on: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "user_credential_history",
      timestamps: false,
      freezeTableName: true,
    },
  );

  return UserCredentialHistory;
};
