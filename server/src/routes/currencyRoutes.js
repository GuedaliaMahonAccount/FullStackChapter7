const express = require('express');
const router = express.Router();
const currencyController = require('../controllers/currencyController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/convert', currencyController.convertCurrency);
router.get('/rates', currencyController.getRates);

module.exports = router;
