const express = require('express');
const router = express.Router();
const geocodingController = require('../controllers/geocodingController');
const { verifyToken } = require('../middleware/authMiddleware');

// Public: reverse geocode coordinate to human-readable address
router.get('/reverse', geocodingController.reverseGeocode);

module.exports = router;
