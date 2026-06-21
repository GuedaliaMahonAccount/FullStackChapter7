const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public routes
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductDetail);

// Protected routes (Only buyers/sellers can upload items)
router.post('/', verifyToken, upload.single('image'), productController.createProduct);
router.delete('/:id', verifyToken, productController.deleteProductListing);

module.exports = router;
