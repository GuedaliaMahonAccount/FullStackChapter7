const express = require('express');
const router = express.Router();
const currencyController = require('../controllers/currencyController');

router.get('/convert', currencyController.convertCurrency);
router.get('/rates', currencyController.getRates);

module.exports = router;
