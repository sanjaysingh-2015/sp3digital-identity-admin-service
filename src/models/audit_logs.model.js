module.exports = (sequelize, DataTypes) => {
  const AuditLogs = sequelize.define(
    "AuditLogs",
    {
      audit_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      tenant_uuid: {
        type: DataTypes.STRING(36),
        allowNull: true,
      },
      actor_user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      action: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      target_resource: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      changes: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      created_on: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
    },
    {
      tableName: "audit_logs",
      timestamps: false,
      freezeTableName: true,
    }
  );

  return AuditLogs;
};