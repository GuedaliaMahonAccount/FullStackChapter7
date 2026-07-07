const express = require('express');
const router = express.Router();
const { createPaymentIntent, getPublishableKey } = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/authMiddleware');

// Mount routes
router.get('/config', verifyToken, getPublishableKey);
router.post('/create-payment-intent', verifyToken, createPaymentIntent);

module.exports = router;
