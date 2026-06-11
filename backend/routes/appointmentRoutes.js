const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { authMiddleware, adminMiddleware } = require('./authRoutes');

// Public route
router.get('/doctors', appointmentController.getDoctors);
router.get('/slots', appointmentController.getAvailableSlots);

// Client routes
router.post('/', authMiddleware, appointmentController.createAppointment);
router.get('/my-appointments', authMiddleware, appointmentController.getUserAppointments);
router.put('/:id/cancel', authMiddleware, appointmentController.cancelAppointment);

// Admin routes
router.get('/', authMiddleware, adminMiddleware, appointmentController.getAllAppointments);
router.put('/:id/status', authMiddleware, adminMiddleware, appointmentController.updateAppointmentStatus);
router.post('/set', authMiddleware, adminMiddleware, appointmentController.setAppointment);
router.get('/clients', authMiddleware, adminMiddleware, appointmentController.getClients);

module.exports = router;
