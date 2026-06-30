const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const mongoose = require('mongoose');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.STRING(24),
    primaryKey: true,
    defaultValue: () => new mongoose.Types.ObjectId().toString()
  },
  roleId: {
    type: DataTypes.STRING(24),
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
  },
  isBlocked: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_blocked'
  },
  savedAddress: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'saved_address'
  },
  savedCardLast4: {
    type: DataTypes.STRING(4),
    allowNull: true,
    field: 'saved_card_last4'
  },
  savedCardExpiry: {
    type: DataTypes.STRING(5),
    allowNull: true,
    field: 'saved_card_expiry'
  }
}, {
  tableName: 'users',
  underscored: true
});

module.exports = User;
