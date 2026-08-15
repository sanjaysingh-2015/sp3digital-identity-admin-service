module.exports = (sequelize, DataTypes) => {
  const AuthConfiguration = sequelize.define(
    'AuthConfiguration',
    {
      config_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      tenant_uuid: {
        type: DataTypes.STRING(36),
        allowNull: false
      },
      allow_password_login: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      allow_social_login: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      allow_mfa_enforcement: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      max_session_duration_minutes: {
        type: DataTypes.INTEGER,
        defaultValue: 480
      },
      status: {
        type: DataTypes.STRING(30),
        defaultValue: 'ACTIVE'
      }
    },
    {
      tableName: 'auth_configurations',
      timestamps: false
    }
  );

  return AuthConfiguration;
};