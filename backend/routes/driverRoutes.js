const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const { authMiddleware, adminMiddleware } = require('./authRoutes');

// Driver routes
router.get('/status', authMiddleware, driverController.getDriverStatus);
router.put('/availability', authMiddleware, driverController.toggleAvailability);
router.get('/my-orders', authMiddleware, driverController.getDriverOrders);
router.put('/:id/delivery-status', authMiddleware, driverController.updateDeliveryStatus);

// Admin routes
router.get('/', authMiddleware, adminMiddleware, driverController.getAllDrivers);
router.get('/metrics', authMiddleware, adminMiddleware, driverController.getDriverMetrics);
router.post('/', authMiddleware, adminMiddleware, driverController.createDriver);
router.delete('/:id', authMiddleware, adminMiddleware, driverController.deleteDriver);
router.get('/:driverId/activity', authMiddleware, adminMiddleware, driverController.getDriverActivity);

module.exports = router;
