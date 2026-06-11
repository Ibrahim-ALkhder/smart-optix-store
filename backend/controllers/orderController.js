const { getDb } = require('../config/db');
const { assignDriverToOrder } = require('./driverController');

// Create order
exports.createOrder = (req, res) => {
  try {
    const db = getDb();
    const { product_id, quantity, prescription_data, shipping_address, address_details, customer_comments, lens_upgrade_fee, shipping_fee, payment_method } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const qty = parseInt(quantity) || 1;

    if (product.stock < qty) {
      return res.status(400).json({ error: `Only ${product.stock} item${product.stock !== 1 ? 's' : ''} available for "${product.name_en}". Please reduce your quantity.` });
    }

    const basePrice = product.price * qty;
    const lensFee = parseFloat(lens_upgrade_fee) || 0;
    const shipFee = parseFloat(shipping_fee) || 15;
    const totalPrice = basePrice + lensFee + shipFee;

    // Ensure prescription_data is serialized as JSON string
    let prescriptionJson = typeof prescription_data === 'object'
      ? JSON.stringify(prescription_data)
      : (prescription_data || '{}');

    // If a prescription photo was uploaded, embed the URL in prescription_data
    if (req.file) {
      const photoUrl = `/uploads/${req.file.filename}`;
      try {
        const rxData = JSON.parse(prescriptionJson);
        rxData.prescription_photo = photoUrl;
        prescriptionJson = JSON.stringify(rxData);
      } catch {
        prescriptionJson = JSON.stringify({ prescription_photo: photoUrl });
      }
    }

    const paymentMethod = ['card', 'cash_on_delivery'].includes(payment_method) ? payment_method : 'cash_on_delivery';

    const addrDetails = typeof address_details === 'string' ? address_details : JSON.stringify(address_details || {});
    const result = db.prepare(`
      INSERT INTO orders (user_id, product_id, quantity, status, prescription_data, total_price, shipping_address, address_details, customer_comments, lens_upgrade_fee, shipping_fee, payment_method)
      VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.id, product_id, qty, prescriptionJson, totalPrice, shipping_address || '', addrDetails, customer_comments || '', lensFee, shipFee, paymentMethod);

    // Automatic stock decrement
    db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(qty, product_id);

    // Check low stock and notify admin
    const updatedProduct = db.prepare('SELECT stock FROM products WHERE id = ?').get(product_id);
    if (updatedProduct && updatedProduct.stock < 10) {
      const adminUsers = db.prepare("SELECT id FROM users WHERE role = 'admin'").all();
      for (const admin of adminUsers) {
        db.prepare('INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)')
          .run(admin.id, 'low_stock', 'Low Stock Alert',
            `Product "${product.name_en}" is low on stock (${updatedProduct.stock} remaining)`);
      }
    }

    // Notify admin of new order
    const adminUsers = db.prepare("SELECT id FROM users WHERE role = 'admin'").all();
    for (const admin of adminUsers) {
      db.prepare('INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)')
        .run(admin.id, 'new_order', 'New Order Received', `Order #${result.lastInsertRowid} placed for ${product.name_en}`);
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ order });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get user orders
exports.getUserOrders = (req, res) => {
  try {
    const db = getDb();
    const orders = db.prepare(`
      SELECT o.*, p.name_en, p.name_ar, p.image_url, p.brand,
             u.name as user_name, u.email as user_email
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users u ON o.user_id = u.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `).all(req.user.id);
    res.json({ orders });
  } catch (err) {
    console.error('Get user orders error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all orders (admin) — returns full prescription_data as parsed JSON
exports.getAllOrders = (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT o.*, p.name_en, p.name_ar, p.image_url, p.brand,
             u.name as user_name, u.email as user_email,
             d.name as driver_name
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users u ON o.user_id = u.id
      LEFT JOIN users d ON o.driver_id = d.id
      ORDER BY o.created_at DESC
    `).all();

    // Deserialize prescription_data for frontend rendering
    const orders = rows.map(o => ({
      ...o,
      prescription_data: o.prescription_data ? safeParse(o.prescription_data) : {},
      address_details: o.address_details ? safeParse(o.address_details) : {},
    }));

    res.json({ orders });
  } catch (err) {
    console.error('Get all orders error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};



// Update order status (admin) - triggers driver auto-assignment
// LOCK: Once cancelled or delivered, status is terminal — cannot be changed
exports.updateOrderStatus = (req, res) => {
  try {
    const db = getDb();
    const { status } = req.body;

    // Admin can only manage: pending → confirmed → preparing → ready_for_delivery (or cancel)
    // Driver handles: out_for_delivery → delivered
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready_for_delivery', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // LOCK: Once cancelled or delivered, status is terminal — cannot be changed
    const terminalStatuses = ['cancelled', 'delivered'];
    if (terminalStatuses.includes(order.status)) {
      return res.status(400).json({ error: `Order is already ${order.status}. Cannot change status.` });
    }

    // If cancelling, restore stock
    if (status === 'cancelled' && order.status !== 'cancelled') {
      restoreStock(db, order.product_id, order.quantity);
    }

    // When admin sets status to ready_for_delivery, auto-assign an available driver
    // assignDriverToOrder already updates the order status + driver_id in one step
    let assignedDriver = null;
    if (status === 'ready_for_delivery' && !order.driver_id) {
      assignedDriver = assignDriverToOrder(parseInt(req.params.id));
      if (!assignedDriver) {
        // No driver available — still set the status so admin can proceed
        db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
      }
    } else {
      db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
    }

    // Create notification for client
    const statusMessages = {
      pending: { en: 'Order confirmed', ar: 'تم تأكيد الطلب' },
      confirmed: { en: 'Order confirmed', ar: 'تم تأكيد الطلب' },
      preparing: { en: 'Your order is being prepared', ar: 'جاري تجهيز طلبك' },
      ready_for_delivery: { en: 'Your order is ready for delivery', ar: 'طلبك جاهز للتوصيل' },
      out_for_delivery: { en: 'Your order is out for delivery', ar: 'طلبك خرج للتوصيل' },
      delivered: { en: 'Your order has been delivered', ar: 'تم توصيل طلبك' },
      cancelled: { en: 'Your order has been cancelled', ar: 'تم إلغاء طلبك' },
    };
    const msg = statusMessages[status] || { en: `Status: ${status}`, ar: `الحالة: ${status}` };
    db.prepare('INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)')
      .run(order.user_id, 'order_update', msg.en, msg.ar);

    const updatedRow = db.prepare(`
      SELECT o.*, p.name_en, p.name_ar, p.image_url, p.brand,
             u.name as user_name, u.email as user_email,
             d.name as driver_name
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users u ON o.user_id = u.id
      LEFT JOIN users d ON o.driver_id = d.id
      WHERE o.id = ?
    `).get(req.params.id);

    const updated = {
      ...updatedRow,
      prescription_data: updatedRow.prescription_data ? safeParse(updatedRow.prescription_data) : {},
      address_details: updatedRow.address_details ? safeParse(updatedRow.address_details) : {},
    };

    res.json({ order: updated, assignedDriver });
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Customer cancel order (with stock restore)
exports.cancelOrder = (req, res) => {
  try {
    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Cannot cancel delivered or already cancelled orders
    if (order.status === 'delivered') {
      return res.status(400).json({ error: 'Cannot cancel a delivered order' });
    }
    if (order.status === 'cancelled') {
      return res.status(400).json({ error: 'Order is already cancelled' });
    }

    // Restore stock
    restoreStock(db, order.product_id, order.quantity);

    db.prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?").run(req.params.id);

    // Notify admin
    const adminUsers = db.prepare("SELECT id FROM users WHERE role = 'admin'").all();
    for (const admin of adminUsers) {
      db.prepare('INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)')
        .run(admin.id, 'order_cancelled', 'Order Cancelled', `Order #${order.id} has been cancelled by customer`);
    }

    res.json({ message: 'Order cancelled successfully' });
  } catch (err) {
    console.error('Cancel order error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get order by ID
exports.getOrderById = (req, res) => {
  try {
    const db = getDb();
    const row = db.prepare(`
      SELECT o.*, p.name_en, p.name_ar, p.image_url, p.brand,
             u.name as user_name, u.email as user_email
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Order not found' });
    const order = {
      ...row,
      prescription_data: row.prescription_data ? safeParse(row.prescription_data) : {},
      address_details: row.address_details ? safeParse(row.address_details) : {},
    };
    res.json({ order });
  } catch (err) {
    console.error('Get order error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get order stats (admin) with time-range filtering
exports.getOrderStats = (req, res) => {
  try {
    const db = getDb();
    const { start_date, end_date, filter } = req.query;
    let dateFilter = '';
    const params = [];

    if (filter === 'today') {
      dateFilter = "AND DATE(o.created_at) = DATE('now')";
    } else if (filter === 'week') {
      dateFilter = "AND o.created_at >= DATE('now', '-7 days')";
    } else if (filter === 'month') {
      dateFilter = "AND o.created_at >= DATE('now', '-30 days')";
    } else if (start_date && end_date) {
      dateFilter = 'AND o.created_at >= ? AND o.created_at <= ?';
      params.push(start_date, end_date + ' 23:59:59');
    }

    const totalOrders = db.prepare(`SELECT COUNT(*) as count FROM orders o WHERE 1=1 ${dateFilter}`).get(...params).count;
    const totalRevenue = db.prepare(`SELECT COALESCE(SUM(o.total_price), 0) as total FROM orders o WHERE o.status != 'cancelled' ${dateFilter}`).get(...params).total;
    const pendingOrders = db.prepare(`SELECT COUNT(*) as count FROM orders o WHERE o.status = 'pending' ${dateFilter}`).get(...params).count;
    const deliveredOrders = db.prepare(`SELECT COUNT(*) as count FROM orders o WHERE o.status = 'delivered' ${dateFilter}`).get(...params).count;
    const lowStockProducts = db.prepare('SELECT COUNT(*) as count FROM products WHERE stock < 10').get().count;
    const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'client'").get().count;
    const totalAppointments = db.prepare('SELECT COUNT(*) as count FROM appointments').get().count;
    const totalDrivers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'driver'").get().count;

    res.json({
      totalOrders, totalRevenue, pendingOrders, deliveredOrders,
      lowStockProducts, totalProducts, totalUsers, totalAppointments, totalDrivers
    });
  } catch (err) {
    console.error('Get order stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get filtered sales records for CSV export
exports.getSalesRecords = (req, res) => {
  try {
    const db = getDb();
    const { start_date, end_date, filter } = req.query;
    let dateFilter = '';
    const params = [];

    if (filter === 'today') {
      dateFilter = "AND DATE(o.created_at) = DATE('now')";
    } else if (filter === 'week') {
      dateFilter = "AND o.created_at >= DATE('now', '-7 days')";
    } else if (filter === 'month') {
      dateFilter = "AND o.created_at >= DATE('now', '-30 days')";
    } else if (start_date && end_date) {
      dateFilter = 'AND o.created_at >= ? AND o.created_at <= ?';
      params.push(start_date, end_date + ' 23:59:59');
    }

    const records = db.prepare(`
      SELECT o.id, o.created_at, o.total_price, o.status,
             p.name_en as product_name, u.name as customer_name, u.email as customer_email
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users u ON o.user_id = u.id
      WHERE o.status != 'cancelled' ${dateFilter}
      ORDER BY o.created_at DESC
    `).all(...params);

    const headers = ['Order ID', 'Date', 'Customer', 'Email', 'Product', 'Total Price', 'Status'];
    const rows = records.map(r => [
      r.id, r.created_at, r.customer_name, r.customer_email, r.product_name, `$${r.total_price.toFixed(2)}`, r.status
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.csv');
    res.send(csv);
  } catch (err) {
    console.error('Get sales records error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Helper: Restore product stock on cancellation
function restoreStock(db, productId, quantity) {
  db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(quantity, productId);
}

// Helper: safe JSON parse
function safeParse(str) {
  try { return JSON.parse(str); } catch { return str; }
}
