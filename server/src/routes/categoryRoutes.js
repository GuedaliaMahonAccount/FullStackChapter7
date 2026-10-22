const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken } = require('../middleware/authMiddleware');

// Public: get categories
router.get('/', categoryController.getCategories);

module.exports = router;
