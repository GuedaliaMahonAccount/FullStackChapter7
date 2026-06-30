const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.use(verifyToken, isAdmin); // All admin routes require admin privileges

router.patch('/orders/:id/status', adminController.updateStatus);
router.get('/orders', adminController.getOrders);
router.get('/logs', adminController.getLogs);
router.get('/users', adminController.getUsers);
router.patch('/users/:id/block', adminController.toggleBlockUser);

module.exports = router;
