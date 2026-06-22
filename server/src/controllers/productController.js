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
    const { title, description, price, stockQuantity, categoryId, latitude, longitude, address, currency, imageUrl: bodyImageUrl } = req.body;
    
    // Check if image file is uploaded or remote imageUrl is provided
    let imageUrl = '';
    if (req.file) {
      // Store relative path. The client will prefix with server URL.
      imageUrl = `/uploads/${req.file.filename}`;
    } else if (bodyImageUrl && (bodyImageUrl.startsWith('http://') || bodyImageUrl.startsWith('https://'))) {
      imageUrl = bodyImageUrl;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Product image file or a valid remote image URL is required.'
      });
    }

    const product = await productService.createProduct({
      title,
      description,
      price: parseFloat(price),
      imageUrl,
      stockQuantity: stockQuantity ? parseInt(stockQuantity, 10) : 1,
      categoryId,
      sellerId: req.user.id,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      address: address || null,
      currency: currency || 'USD'
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

const updateProductListing = async (req, res, next) => {
  try {
    const { title, description, price, stockQuantity, categoryId, latitude, longitude, address, currency } = req.body;
    const updated = await productService.updateProduct(
      req.params.id,
      req.user.id,
      req.user.role,
      { title, description, price, stockQuantity, categoryId, latitude, longitude, address, currency },
      req
    );
    res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};
const getMyProducts = async (req, res, next) => {
  try {
    const products = await productService.getProductsBySellerId(req.user.id);
    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductDetail,
  createProduct,
  deleteProductListing,
  updateProductListing,
  getMyProducts
};
