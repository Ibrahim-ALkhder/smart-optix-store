const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const orderController = require('../controllers/orderController');
const { authMiddleware, adminMiddleware } = require('./authRoutes');

// Configure multer for prescription photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'rx-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const prescriptionUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|pdf/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(null, ext && mime);
  }
});

// Client routes
router.post('/', authMiddleware, prescriptionUpload.single('prescription_photo'), orderController.createOrder);
router.get('/my-orders', authMiddleware, orderController.getUserOrders);
router.put('/:id/cancel', authMiddleware, orderController.cancelOrder);

// Admin routes
router.get('/', authMiddleware, adminMiddleware, orderController.getAllOrders);
router.get('/stats', authMiddleware, adminMiddleware, orderController.getOrderStats);
router.get('/sales-records', authMiddleware, adminMiddleware, orderController.getSalesRecords);
router.put('/:id/status', authMiddleware, adminMiddleware, orderController.updateOrderStatus);
router.get('/:id', authMiddleware, orderController.getOrderById);

// Multer error handler — returns clean JSON instead of generic 500
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  if (err.message && err.message.includes('Only image')) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;
