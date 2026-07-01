const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public routes
router.get('/', productController.getProducts);

// Protected: get logged-in seller's own products
router.get('/mine', verifyToken, productController.getMyProducts);

// Protected: suggest description using AI
router.post('/suggest-description', verifyToken, productController.suggestDescription);

// Protected: search Pexels images securely via proxy
router.get('/pexels-search', verifyToken, productController.searchPexels);

// Public: single product detail (must be AFTER special routes to prevent parameter shadowing)
router.get('/:id', productController.getProductDetail);


// Protected routes (Only buyers/sellers can upload items)
router.post('/', verifyToken, upload.single('image'), productController.createProduct);
router.put('/:id', verifyToken, upload.single('image'), productController.updateProductListing);
router.delete('/:id', verifyToken, productController.deleteProductListing);

module.exports = router;
