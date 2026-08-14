module.exports = (sequelize, DataTypes) => {
  const UserDevices = sequelize.define(
    "UserDevices",
    {
      device_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      device_uuid: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      device_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      device_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      operating_system: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      os_version: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      app_version: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      push_token: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      last_ip_address: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      last_seen_on: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      is_trusted: {
        type: DataTypes.BOOLEAN,
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
      tableName: "user_devices",
      timestamps: false,
      freezeTableName: true,
    },
  );

  return UserDevices;
};
