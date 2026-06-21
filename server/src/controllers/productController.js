const productService = require('../services/productService');

const getProducts = async (req, res, next) => {
  try {
    const { categoryId, search, minPrice, maxPrice } = req.query;
    const products = await productService.getAllProducts({ categoryId, search, minPrice, maxPrice });
    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

const getProductDetail = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const { title, description, price, stockQuantity, categoryId, latitude, longitude } = req.body;
    
    // Check if image file is uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Product image file is required.'
      });
    }

    // Store relative path. The client will prefix with server URL.
    const imageUrl = `/uploads/${req.file.filename}`;

    const product = await productService.createProduct({
      title,
      description,
      price: parseFloat(price),
      imageUrl,
      stockQuantity: stockQuantity ? parseInt(stockQuantity, 10) : 1,
      categoryId: parseInt(categoryId, 10),
      sellerId: req.user.id,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null
    }, req);

    res.status(201).json({
      success: true,
      message: 'Product listing created successfully.',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

const deleteProductListing = async (req, res, next) => {
  try {
    const result = await productService.deleteProduct(req.params.id, req.user.id, req.user.role, req);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};
module.exports = {
  getProducts,
  getProductDetail,
  createProduct,
  deleteProductListing
};
