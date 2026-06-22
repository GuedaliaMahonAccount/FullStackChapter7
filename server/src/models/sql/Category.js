const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const mongoose = require('mongoose');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.STRING(24),
    primaryKey: true,
    defaultValue: () => new mongoose.Types.ObjectId().toString()
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'categories',
  underscored: true
});

module.exports = Category;
