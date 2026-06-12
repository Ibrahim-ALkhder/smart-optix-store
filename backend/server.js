require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Smart Optix Store API running on port ${PORT}`);
});

process.on('uncaughtException', (err) => console.error('[FATAL]', err));
process.on('unhandledRejection', (reason) => console.error('[FATAL]', reason));

setTimeout(() => {
  try {
    const { initializeDatabase } = require('./config/db');
    initializeDatabase();
    console.log('Database initialized');
  } catch (err) { console.error('[SERVER] DB init failed:', err.message); }

  let authRoutes, productRoutes, orderRoutes, appointmentRoutes;
  let prescriptionRoutes, driverRoutes, notificationRoutes;

  try {
    authRoutes = require('./routes/authRoutes');
    productRoutes = require('./routes/productRoutes');
    orderRoutes = require('./routes/orderRoutes');
    appointmentRoutes = require('./routes/appointmentRoutes');
    prescriptionRoutes = require('./routes/prescriptionRoutes');
    driverRoutes = require('./routes/driverRoutes');
    notificationRoutes = require('./routes/notificationRoutes');
  } catch (err) { console.error('[SERVER] Route imports failed:', err.message); }

  if (authRoutes) {
    const helmet = require('helmet');
    const rateLimit = require('express-rate-limit');

    app.use(helmet({ contentSecurityPolicy: false }));

    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false,
      message: { error: 'Too many requests, please try again later.' }
    });
    app.use('/api/', limiter);

    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, max: 20,
      message: { error: 'Too many auth attempts, please try again later.' }
    });

    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
    app.use('/api/auth', authLimiter, authRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/orders', orderRoutes);
    app.use('/api/appointments', appointmentRoutes);
    app.use('/api/prescriptions', prescriptionRoutes);
    app.use('/api/drivers', driverRoutes);
    app.use('/api/notifications', notificationRoutes);

    app.use((err, req, res, next) => {
      console.error('Unhandled error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
  }
}, 100);
