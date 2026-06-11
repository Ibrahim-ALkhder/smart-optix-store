const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
const { authMiddleware } = require('./authRoutes');

router.get('/', authMiddleware, prescriptionController.getUserPrescriptions);
router.post('/', authMiddleware, prescriptionController.createPrescription);
router.delete('/:id', authMiddleware, prescriptionController.deletePrescription);

module.exports = router;
