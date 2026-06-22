const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const mongoose = require('mongoose');

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.STRING(24),
    primaryKey: true,
    defaultValue: () => new mongoose.Types.ObjectId().toString()
  },
  orderId: {
    type: DataTypes.STRING(24),
    allowNull: false,
    field: 'order_id',
    references: {
      model: 'orders',
      key: 'id'
    }
  },
  productId: {
    type: DataTypes.STRING(24),
    allowNull: false,
    field: 'product_id',
    references: {
      model: 'products',
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: true,
      min: 1
    }
  },
  priceAtPurchase: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'price_at_purchase',
    validate: {
      isDecimal: true,
      min: 0.01
    }
  }
}, {
  tableName: 'order_items',
  underscored: true
});

module.exports = OrderItem;
