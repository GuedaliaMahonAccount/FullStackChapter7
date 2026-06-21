const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  buyerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'buyer_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'total_price',
    validate: {
      isDecimal: true,
      min: 0.00
    }
  },
  shippingAddress: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'shipping_address'
  },
  paymentStatus: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'pending',
    field: 'payment_status'
  }
}, {
  tableName: 'orders',
  underscored: true
});

module.exports = Order;
