const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All product routes require authentication
router.use(verifyToken);

router.get('/', productController.getProducts);

// Protected: get logged-in seller's own products
router.get('/mine', productController.getMyProducts);

// Protected: suggest description using AI
router.post('/suggest-description', productController.suggestDescription);

// Protected: search Pexels images securely via proxy
router.get('/pexels-search', productController.searchPexels);

// Single product detail (must be AFTER special routes to prevent parameter shadowing)
router.get('/:id', productController.getProductDetail);

// Upload/edit/delete items (Only buyers/sellers can upload items)
router.post('/', upload.single('image'), productController.createProduct);
router.put('/:id', upload.single('image'), productController.updateProductListing);
router.delete('/:id', productController.deleteProductListing);

module.exports = router;
