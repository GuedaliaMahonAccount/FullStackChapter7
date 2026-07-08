const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', categoryController.getCategories);

module.exports = router;
