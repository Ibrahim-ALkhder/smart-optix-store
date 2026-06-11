const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authMiddleware } = require('./authRoutes');

router.get('/', authMiddleware, notificationController.getNotifications);
router.put('/read', authMiddleware, notificationController.markAsRead);
router.delete('/clear', authMiddleware, notificationController.clearNotifications);

module.exports = router;
