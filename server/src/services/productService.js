const { Op } = require('sequelize');
const { Product, User, Category, Review } = require('../models/sql');
const { logEvent } = require('../utils/logger');

const createProduct = async ({ title, description, price, imageUrl, stockQuantity, categoryId, sellerId, latitude, longitude, address, currency, barcode }, req = null) => {
  // Ensure category exists
  const category = await Category.findByPk(categoryId);
  if (!category) {
    throw { statusCode: 400, message: 'Invalid category selection.' };
  }

  const product = await Product.create({
    title,
    description,
    price,
    imageUrl,
    stockQuantity: stockQuantity || 1,
    categoryId,
    sellerId,
    latitude: latitude ? parseFloat(latitude) : null,
    longitude: longitude ? parseFloat(longitude) : null,
    address: address || null,
    currency: currency || 'USD',
    barcode: barcode || null
  });

  // Log product listing event
  await logEvent({
    eventType: 'PRODUCT_CREATED',
    userId: sellerId,
    details: { productId: product.id, title, price, categoryName: category.name },
    req
  });

  return product;
};

const getAllProducts = async (filters = {}) => {
  const { categoryId, search, minPrice, maxPrice } = filters;
  const whereClause = {};

  // 1. Filter by category
  if (categoryId) {
    whereClause.categoryId = categoryId;
  }

  // 2. Filter by search query (case-insensitive title/description search)
  if (search) {
    whereClause[Op.or] = [
      { title: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } }
    ];
  }

  // 3. Filter by price range
  if (minPrice !== undefined || maxPrice !== undefined) {
    whereClause.price = {};
    if (minPrice !== undefined) {
      whereClause.price[Op.gte] = parseFloat(minPrice);
    }
    if (maxPrice !== undefined) {
      whereClause.price[Op.lte] = parseFloat(maxPrice);
    }
  }

  // Return all matching products, including seller and category info
  return await Product.findAll({
    where: whereClause,
    include: [
      { model: User, as: 'seller', attributes: ['id', 'fullName', 'email'] },
      { model: Category, as: 'category', attributes: ['id', 'name'] },
      { model: Review, as: 'reviews', attributes: ['rating'] }
    ],
    order: [['createdAt', 'DESC']]
  });
};

const getProductById = async (productId) => {
  const product = await Product.findByPk(productId, {
    include: [
      { model: User, as: 'seller', attributes: ['id', 'fullName', 'email', 'avatarUrl'] },
      { model: Category, as: 'category', attributes: ['id', 'name'] }
    ]
  });

  if (!product) {
    throw { statusCode: 404, message: 'Product listing not found.' };
  }

  return product;
};

const deleteProduct = async (productId, sellerId, userRole, req = null) => {
  const product = await Product.findByPk(productId);
  if (!product) {
    throw { statusCode: 404, message: 'Product listing not found.' };
  }

  // Verify ownership (unless Admin)
  if (userRole !== 'admin' && product.sellerId !== sellerId) {
    throw { statusCode: 403, message: 'Unauthorized: You are not the owner of this product listing.' };
  }

  await product.destroy();

  // Log product deletion
  await logEvent({
    eventType: 'PRODUCT_DELETED',
    userId: sellerId,
    details: { productId, title: product.title },
    req
  });

  return { success: true, message: 'Product listing deleted successfully.' };
};

const getProductsBySellerId = async (sellerId) => {
  return await Product.findAll({
    where: { sellerId },
    include: [
      { model: Category, as: 'category', attributes: ['id', 'name'] }
    ],
    order: [['createdAt', 'DESC']]
  });
};

const updateProduct = async (productId, sellerId, userRole, updates, req = null) => {
  const product = await Product.findByPk(productId);
  if (!product) {
    throw { statusCode: 404, message: 'Product listing not found.' };
  }

  // Verify ownership (unless Admin)
  if (userRole !== 'admin' && product.sellerId !== sellerId) {
    throw { statusCode: 403, message: 'Unauthorized: You are not the owner of this product listing.' };
  }

  const { title, description, price, stockQuantity, categoryId, latitude, longitude, address, currency, barcode, imageUrl } = updates;

  if (categoryId) {
    const category = await Category.findByPk(categoryId);
    if (!category) throw { statusCode: 400, message: 'Invalid category selection.' };
  }

  await product.update({
    ...(title !== undefined && { title }),
    ...(description !== undefined && { description }),
    ...(price !== undefined && { price: parseFloat(price) }),
    ...(stockQuantity !== undefined && { stockQuantity: parseInt(stockQuantity, 10) }),
    ...(categoryId !== undefined && { categoryId }),
    ...(latitude !== undefined && { latitude: latitude ? parseFloat(latitude) : null }),
    ...(longitude !== undefined && { longitude: longitude ? parseFloat(longitude) : null }),
    ...(address !== undefined && { address: address || null }),
    ...(currency !== undefined && { currency }),
    ...(barcode !== undefined && { barcode: barcode || null }),
    ...(imageUrl !== undefined && { imageUrl }),
  });

  await logEvent({
    eventType: 'PRODUCT_UPDATED',
    userId: sellerId,
    details: { productId, updates },
    req
  });

  return product.reload({
    include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }]
  });
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  deleteProduct,
  getProductsBySellerId,
  updateProduct
};
