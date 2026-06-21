const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'role_id',
    references: {
      model: 'roles',
      key: 'id'
    }
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'password_hash'
  },
  fullName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'full_name'
  },
  avatarUrl: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'avatar_url'
  }
}, {
  tableName: 'users',
  underscored: true
});

module.exports = User;
