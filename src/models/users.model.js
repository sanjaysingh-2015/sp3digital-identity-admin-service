module.exports = (sequelize, DataTypes) => {
  const Users = sequelize.define(
    "Users",
    {
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        primaryKey: true,
        autoIncrement: true,
      },
      user_uuid: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      first_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      middle_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      last_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      display_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      phone_country_code: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      phone_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      user_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email_verified: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      phone_verified: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      last_login_on: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      password_changed_on: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      account_locked_until: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      failed_login_count: {
        type: DataTypes.BIGINT,
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
      tableName: "users",
      timestamps: false,
      freezeTableName: true,
    },
  );

  return Users;
};
