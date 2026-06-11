const bcrypt = require('bcryptjs');
const { getDb } = require('../config/db');

// Get driver status
exports.getDriverStatus = (req, res) => {
  try {
    const db = getDb();
    const status = db.prepare('SELECT * FROM drivers_status WHERE driver_id = ?').get(req.user.id);
    if (!status) {
      return res.status(404).json({ error: 'Driver profile not found' });
    }
    res.json({ status });
  } catch (err) {
    console.error('Get driver status error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Toggle driver availability
exports.toggleAvailability = (req, res) => {
  try {
    const db = getDb();
    const { is_available } = req.body;
    const status = db.prepare('SELECT * FROM drivers_status WHERE driver_id = ?').get(req.user.id);
    if (!status) {
      return res.status(404).json({ error: 'Driver profile not found' });
    }
    db.prepare('UPDATE drivers_status SET is_available = ? WHERE driver_id = ?')
      .run(is_available ? 1 : 0, req.user.id);

    // Log activity
    db.prepare('INSERT INTO driver_activity_log (driver_id, action, details) VALUES (?, ?, ?)')
      .run(req.user.id, is_available ? 'available' : 'offline', is_available ? 'Driver went online' : 'Driver went offline');

    const updated = db.prepare('SELECT * FROM drivers_status WHERE driver_id = ?').get(req.user.id);
    res.json({ status: updated });
  } catch (err) {
    console.error('Toggle availability error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get driver's assigned orders
exports.getDriverOrders = (req, res) => {
  try {
    const db = getDb();
    const orders = db.prepare(`
      SELECT o.*, p.name_en, p.name_ar, p.image_url, p.brand,
             u.name as client_name, u.email as client_email, u.phone as client_phone
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users u ON o.user_id = u.id
      WHERE o.driver_id = ? AND o.status IN ('ready_for_delivery', 'out_for_delivery')
      ORDER BY o.created_at DESC
    `).all(req.user.id);
    res.json({ orders });
  } catch (err) {
    console.error('Get driver orders error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update order delivery status (driver action)
exports.updateDeliveryStatus = (req, res) => {
  try {
    const db = getDb();
    const { status } = req.body;
    const validStatuses = ['ready_for_delivery', 'out_for_delivery', 'delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid delivery status' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND driver_id = ?').get(req.params.id, req.user.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found or not assigned to you' });
    }

    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);

    // Log activity
    const actionMap = { out_for_delivery: 'picked_up', delivered: 'delivered', ready_for_delivery: 'assigned' };
    db.prepare('INSERT INTO driver_activity_log (driver_id, action, order_id, details) VALUES (?, ?, ?, ?)')
      .run(req.user.id, actionMap[status] || status, req.params.id, `Order #${req.params.id} status: ${status}`);

    if (status === 'delivered') {
      db.prepare('UPDATE drivers_status SET completed_deliveries = completed_deliveries + 1, active_orders = MAX(active_orders - 1, 0) WHERE driver_id = ?')
        .run(req.user.id);
    }

    const statusMessages = {
      ready_for_delivery: { en: 'Your order is ready for delivery', ar: 'طلبك جاهز للتوصيل' },
      out_for_delivery: { en: 'Your order is out for delivery', ar: 'طلبك خرج للتوصيل' },
      delivered: { en: 'Your order has been delivered', ar: 'تم توصيل طلبك' },
    };
    const msg = statusMessages[status] || { en: `Order status: ${status}`, ar: `حالة الطلب: ${status}` };
    db.prepare('INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)')
      .run(order.user_id, 'order_update', msg.en, msg.ar);

    const adminUsers = db.prepare("SELECT id FROM users WHERE role = 'admin'").all();
    for (const admin of adminUsers) {
      db.prepare('INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)')
        .run(admin.id, 'delivery_update', `Order #${order.id} delivery update`, `Order #${order.id} status: ${status}`);
    }

    const updated = db.prepare(`
      SELECT o.*, p.name_en, p.name_ar, p.image_url, p.brand,
             u.name as client_name, u.email as client_email, u.phone as client_phone
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `).get(req.params.id);

    res.json({ order: updated });
  } catch (err) {
    console.error('Update delivery status error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Smart driver auto-assignment
exports.assignDriverToOrder = (orderId) => {
  const db = getDb();
  const driver = db.prepare(`
    SELECT ds.driver_id, ds.active_orders
    FROM drivers_status ds
    WHERE ds.is_available = 1
    ORDER BY ds.active_orders ASC
    LIMIT 1
  `).get();

  if (!driver) return null;

  db.prepare('UPDATE orders SET driver_id = ?, status = ? WHERE id = ?')
    .run(driver.driver_id, 'ready_for_delivery', orderId);
  db.prepare('UPDATE drivers_status SET active_orders = active_orders + 1 WHERE driver_id = ?')
    .run(driver.driver_id);

  // Log activity
  db.prepare('INSERT INTO driver_activity_log (driver_id, action, order_id, details) VALUES (?, ?, ?, ?)')
    .run(driver.driver_id, 'assigned', orderId, `Order #${orderId} assigned to driver`);

  db.prepare('INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)')
    .run(driver.driver_id, 'new_delivery', 'New delivery assigned', `Order #${orderId} has been assigned to you`);

  return driver.driver_id;
};

// Get all drivers (admin)
exports.getAllDrivers = (req, res) => {
  try {
    const db = getDb();
    const drivers = db.prepare(`
      SELECT u.id, u.name, u.email, u.phone, u.full_name,
             ds.is_available, ds.region, ds.active_orders, ds.completed_deliveries
      FROM users u
      JOIN drivers_status ds ON u.id = ds.driver_id
      WHERE u.role = 'driver'
      ORDER BY ds.completed_deliveries DESC
    `).all();
    res.json({ drivers });
  } catch (err) {
    console.error('Get all drivers error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get driver metrics for admin
exports.getDriverMetrics = (req, res) => {
  try {
    const db = getDb();
    const { start_date, end_date } = req.query;
    let dateFilter = '';
    const params = [];
    if (start_date && end_date) {
      dateFilter = 'AND o.created_at >= ? AND o.created_at <= ?';
      params.push(start_date, end_date + ' 23:59:59');
    }

    const metrics = db.prepare(`
      SELECT u.id, u.name, u.full_name,
             ds.is_available, ds.region,
             COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) as delivered_count,
             COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) * 15 as total_earnings
      FROM users u
      JOIN drivers_status ds ON u.id = ds.driver_id
      LEFT JOIN orders o ON o.driver_id = u.id AND o.status = 'delivered' ${dateFilter}
      WHERE u.role = 'driver'
      GROUP BY u.id
      ORDER BY delivered_count DESC
    `).all(...params);

    res.json({ metrics });
  } catch (err) {
    console.error('Get driver metrics error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create new driver (admin)
exports.createDriver = (req, res) => {
  try {
    const { name, email, password, phone, full_name, region } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db.prepare(
      'INSERT INTO users (name, email, password, phone, role, full_name) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(name, email, hashedPassword, phone || '', 'driver', full_name || name);

    // Provision default driver status record
    db.prepare('INSERT INTO drivers_status (driver_id, is_available, region, active_orders, completed_deliveries) VALUES (?, 0, ?, 0, 0)')
      .run(result.lastInsertRowid, region || '');

    const user = db.prepare('SELECT id, name, email, phone, role, full_name FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ user });
  } catch (err) {
    console.error('Create driver error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete a driver (admin)
exports.deleteDriver = (req, res) => {
  try {
    const db = getDb();
    const driverId = req.params.id;

    const driver = db.prepare("SELECT id, role FROM users WHERE id = ?").get(driverId);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    if (driver.role !== 'driver') {
      return res.status(400).json({ error: 'User is not a driver' });
    }

    // Unassign any active orders from this driver
    db.prepare("UPDATE orders SET driver_id = NULL, status = 'pending' WHERE driver_id = ? AND status IN ('ready_for_delivery', 'out_for_delivery')")
      .run(driverId);

    // Remove driver status record
    db.prepare('DELETE FROM drivers_status WHERE driver_id = ?').run(driverId);

    // Remove activity logs
    db.prepare('DELETE FROM driver_activity_log WHERE driver_id = ?').run(driverId);

    // Delete user
    db.prepare('DELETE FROM users WHERE id = ?').run(driverId);

    // Notify remaining admins
    const adminUsers = db.prepare("SELECT id FROM users WHERE role = 'admin'").all();
    for (const admin of adminUsers) {
      db.prepare('INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)')
        .run(admin.id, 'driver_deleted', 'Driver Removed', `Driver #${driverId} has been removed from the system`);
    }

    res.json({ message: 'Driver deleted successfully' });
  } catch (err) {
    console.error('Delete driver error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get driver activity log (admin)
exports.getDriverActivity = (req, res) => {
  try {
    const db = getDb();
    const driverId = req.params.driverId;
    const { filter } = req.query;
    let dateFilter = '';
    const params = [driverId];

    if (filter === 'daily') {
      dateFilter = "AND DATE(dal.created_at) = DATE('now')";
    } else if (filter === 'weekly') {
      dateFilter = "AND dal.created_at >= DATE('now', '-7 days')";
    } else if (filter === 'monthly') {
      dateFilter = "AND dal.created_at >= DATE('now', 'start of month')";
    }

    const activity = db.prepare(`
      SELECT dal.*, o.total_price, o.status as order_status
      FROM driver_activity_log dal
      LEFT JOIN orders o ON dal.order_id = o.id
      WHERE dal.driver_id = ? ${dateFilter}
      ORDER BY dal.created_at DESC
      LIMIT 100
    `).all(...params);

    // Summary stats
    const stats = db.prepare(`
      SELECT
        COUNT(CASE WHEN dal.action = 'delivered' THEN 1 END) as total_deliveries,
        COUNT(CASE WHEN dal.action = 'picked_up' THEN 1 END) as total_pickups,
        COUNT(CASE WHEN dal.action = 'available' THEN 1 END) as times_available,
        COUNT(CASE WHEN dal.action = 'offline' THEN 1 END) as times_offline,
        COUNT(CASE WHEN dal.action = 'delivered' THEN 1 END) * 15 as earnings
      FROM driver_activity_log dal
      WHERE dal.driver_id = ? ${dateFilter}
    `).get(...params);

    res.json({ activity, stats });
  } catch (err) {
    console.error('Get driver activity error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
