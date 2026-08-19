module.exports = (sequelize, DataTypes) => {
  const ResourceMaster = sequelize.define(
    "ResourceMaster",
    {
      resource_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        primaryKey: true,
        autoIncrement: true,
      },
      resource_code: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },

      resource_name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      resource_category: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },

      status: {
        type: DataTypes.ENUM("ACTIVE", "INACTIVE"),
        allowNull: false,
        defaultValue: "ACTIVE",
      },

      created_by: {
        type: DataTypes.CHAR(36),
        allowNull: true,
      },

      created_on: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },

      modified_by: {
        type: DataTypes.CHAR(36),
        allowNull: true,
      },

      modified_on: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "resource_master",
      timestamps: false,
      underscored: true,
    },
  );

  return ResourceMaster;
};
