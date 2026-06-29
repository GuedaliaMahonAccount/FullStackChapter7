const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const mongoose = require('mongoose');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.STRING(24),
    primaryKey: true,
    defaultValue: () => new mongoose.Types.ObjectId().toString()
  },
  sellerId: {
    type: DataTypes.STRING(24),
    allowNull: false,
    field: 'seller_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  categoryId: {
    type: DataTypes.STRING(24),
    allowNull: false,
    field: 'category_id',
    references: {
      model: 'categories',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      isDecimal: true,
      min: 0.01
    }
  },
  imageUrl: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'image_url'
  },
  stockQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    field: 'stock_quantity',
    validate: {
      isInt: true,
      min: 0
    }
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  address: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'USD'
  },
  barcode: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'products',
  underscored: true,
  paranoid: true
});

module.exports = Product;
