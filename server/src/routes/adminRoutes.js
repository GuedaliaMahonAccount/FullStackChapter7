const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.use(verifyToken, isAdmin); // All admin routes require admin privileges

router.patch('/orders/:id/status', adminController.updateStatus);

module.exports = router;
