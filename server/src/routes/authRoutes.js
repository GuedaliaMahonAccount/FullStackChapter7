const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const { validateFields } = require('../middleware/validationMiddleware');

// Public routes
router.post('/register', validateFields(['email', 'password', 'fullName']), authController.register);
router.post('/login', validateFields(['email', 'password']), authController.login);

// Protected routes
router.get('/profile', verifyToken, authController.getProfile);
router.patch('/profile/billing', verifyToken, authController.updateProfileBilling);

module.exports = router;
