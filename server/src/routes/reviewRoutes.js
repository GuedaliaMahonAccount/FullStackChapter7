const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken } = require('../middleware/authMiddleware');

// Protected: add review
router.post('/', verifyToken, reviewController.addReview);

// Public: view product reviews
router.get('/product/:productId', reviewController.getProductReviews);

module.exports = router;
