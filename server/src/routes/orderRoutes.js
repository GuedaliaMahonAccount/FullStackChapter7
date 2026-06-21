const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken); // All order routes require authentication

router.post('/', orderController.placeOrder);
router.get('/buyer', orderController.getBuyerOrders);
router.get('/:id', orderController.getOrderDetails);

module.exports = router;
