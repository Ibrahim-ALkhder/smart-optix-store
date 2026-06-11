const { getDb } = require('../config/db');

exports.getUserPrescriptions = (req, res) => {
  try {
    const db = getDb();

    // 1. Get saved prescriptions from the prescriptions table
    const savedPrescriptions = db.prepare(
      'SELECT * FROM prescriptions WHERE user_id = ? ORDER BY created_at DESC'
    ).all(req.user.id);

    // 2. Get prescription data embedded in orders
    const orderPrescriptions = db.prepare(`
      SELECT o.id as order_id, o.prescription_data, o.total_price, o.created_at as order_date,
             o.lens_upgrade_fee, o.status as order_status,
             p.name_en as product_name_en, p.name_ar as product_name_ar, p.image_url, p.brand
      FROM orders o
      JOIN products p ON o.product_id = p.id
      WHERE o.user_id = ? AND o.prescription_data IS NOT NULL AND o.prescription_data != '{}' AND o.prescription_data != ''
      ORDER BY o.created_at DESC
    `).all(req.user.id);

    // Parse prescription_data JSON for each order
    const ordersWithRx = orderPrescriptions.map(o => {
      let rxData = o.prescription_data;
      if (typeof rxData === 'string') {
        try { rxData = JSON.parse(rxData); } catch { rxData = {}; }
      }
      return { ...o, prescription_data: rxData };
    });

    res.json({ prescriptions: savedPrescriptions, orderPrescriptions: ordersWithRx });
  } catch (err) {
    console.error('Get prescriptions error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createPrescription = (req, res) => {
  try {
    const db = getDb();
    const { right_eye_sph, right_eye_cyl, right_eye_axis, left_eye_sph, left_eye_cyl, left_eye_axis, pd, notes } = req.body;

    const result = db.prepare(`
      INSERT INTO prescriptions (user_id, right_eye_sph, right_eye_cyl, right_eye_axis, left_eye_sph, left_eye_cyl, left_eye_axis, pd, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.id, right_eye_sph || '', right_eye_cyl || '', right_eye_axis || '', left_eye_sph || '', left_eye_cyl || '', left_eye_axis || '', pd || '', notes || '');

    const prescription = db.prepare('SELECT * FROM prescriptions WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ prescription });
  } catch (err) {
    console.error('Create prescription error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deletePrescription = (req, res) => {
  try {
    const db = getDb();
    const prescription = db.prepare('SELECT * FROM prescriptions WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    db.prepare('DELETE FROM prescriptions WHERE id = ?').run(req.params.id);
    res.json({ message: 'Prescription deleted successfully' });
  } catch (err) {
    console.error('Delete prescription error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
