const express = require('express');
const router = express.Router();
const geocodingController = require('../controllers/geocodingController');
const { verifyToken } = require('../middleware/authMiddleware');

// Secure geocoding endpoints using authorization token middleware
router.use(verifyToken);

router.get('/reverse', geocodingController.reverseGeocode);

module.exports = router;
