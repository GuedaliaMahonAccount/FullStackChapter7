const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true
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
  buyerId: {
    type: DataTypes.STRING(24),
    allowNull: false,
    field: 'buyer_id',
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'reviews',
  underscored: true
});

module.exports = Review;
