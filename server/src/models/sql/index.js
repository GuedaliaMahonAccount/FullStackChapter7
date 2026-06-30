const { sequelize } = require('../../config/database');
const Role = require('./Role');
const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Review = require('./Review');

// 1. Role <-> User
Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });
User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });

// 2. User (Seller) <-> Product
User.hasMany(Product, { foreignKey: 'sellerId', as: 'products' });
Product.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });

// 3. Category <-> Product
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

// 4. User (Buyer) <-> Order
User.hasMany(Order, { foreignKey: 'buyerId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'buyerId', as: 'buyer' });

// 5. Order <-> OrderItem
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// 6. Product <-> OrderItem
Product.hasMany(OrderItem, { foreignKey: 'productId', as: 'orderItems' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// 7. Product / User <-> Review
Product.hasMany(Review, { foreignKey: 'productId', as: 'reviews', onDelete: 'CASCADE' });
Review.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
User.hasMany(Review, { foreignKey: 'buyerId', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'buyerId', as: 'buyer' });

module.exports = {
  sequelize,
  Role,
  User,
  Category,
  Product,
  Order,
  OrderItem,
  Review
};
