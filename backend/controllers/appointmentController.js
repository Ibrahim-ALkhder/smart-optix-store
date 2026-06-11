const { getDb } = require('../config/db');

exports.createAppointment = (req, res) => {
  try {
    const db = getDb();
    const { doctor_name, branch, appointment_date, time_slot, notes } = req.body;

    if (!doctor_name || !branch || !appointment_date || !time_slot) {
      return res.status(400).json({ error: 'Doctor, branch, date, and time slot are required' });
    }

    // Check for conflicting appointment
    const conflict = db.prepare(
      "SELECT id FROM appointments WHERE doctor_name = ? AND appointment_date = ? AND time_slot = ? AND status != 'cancelled'"
    ).get(doctor_name, appointment_date, time_slot);

    if (conflict) {
      return res.status(409).json({ error: 'This time slot is already booked' });
    }

    const result = db.prepare(`
      INSERT INTO appointments (user_id, doctor_name, branch, appointment_date, time_slot, status, notes)
      VALUES (?, ?, ?, ?, ?, 'confirmed', ?)
    `).run(req.user.id, doctor_name, branch, appointment_date, time_slot, notes || '');

    const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ appointment });
  } catch (err) {
    console.error('Create appointment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getUserAppointments = (req, res) => {
  try {
    const db = getDb();
    const appointments = db.prepare(
      'SELECT * FROM appointments WHERE user_id = ? ORDER BY appointment_date DESC, time_slot DESC'
    ).all(req.user.id);

    res.json({ appointments });
  } catch (err) {
    console.error('Get user appointments error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getAllAppointments = (req, res) => {
  try {
    const db = getDb();
    const appointments = db.prepare(`
      SELECT a.*, u.name as user_name, u.email as user_email, u.phone as user_phone
      FROM appointments a
      JOIN users u ON a.user_id = u.id
      ORDER BY a.appointment_date DESC, a.time_slot DESC
    `).all();

    res.json({ appointments });
  } catch (err) {
    console.error('Get all appointments error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateAppointmentStatus = (req, res) => {
  try {
    const db = getDb();
    const { status } = req.body;

    const validStatuses = ['confirmed', 'pending', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // LOCK: Prevent status changes on completed or cancelled appointments
    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
      return res.status(400).json({ error: `Cannot modify a ${appointment.status} appointment` });
    }

    db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(status, req.params.id);

    const updated = db.prepare(`
      SELECT a.*, u.name as user_name, u.email as user_email
      FROM appointments a
      JOIN users u ON a.user_id = u.id
      WHERE a.id = ?
    `).get(req.params.id);

    res.json({ appointment: updated });
  } catch (err) {
    console.error('Update appointment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getAvailableSlots = (req, res) => {
  try {
    const db = getDb();
    const { doctor_name, branch, date } = req.query;

    const allSlots = [
      '09:00 AM - 09:30 AM', '09:30 AM - 10:00 AM', '10:00 AM - 10:30 AM',
      '10:30 AM - 11:00 AM', '11:00 AM - 11:30 AM', '11:30 AM - 12:00 PM',
      '01:00 PM - 01:30 PM', '01:30 PM - 02:00 PM', '02:00 PM - 02:30 PM',
      '02:30 PM - 03:00 PM', '03:00 PM - 03:30 PM', '03:30 PM - 04:00 PM',
      '04:00 PM - 04:30 PM', '04:30 PM - 05:00 PM'
    ];

    let bookedSlots = [];
    if (doctor_name && date) {
      bookedSlots = db.prepare(
        "SELECT time_slot FROM appointments WHERE doctor_name = ? AND appointment_date = ? AND status != 'cancelled'"
      ).all(doctor_name, date).map(r => r.time_slot);
    }

    const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

    res.json({ availableSlots, bookedSlots });
  } catch (err) {
    console.error('Get available slots error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getDoctors = (req, res) => {
  try {
    const doctors = [
      { id: 1, name_en: 'Dr. Sarah Al-Harbi', name_ar: 'د. سارة الحربي', specialty_en: 'Optometrist', specialty_ar: 'أخصائية بصريات', branch: 'Riyadh Main Branch' },
      { id: 2, name_en: 'Dr. Mohammad Al-Fahad', name_ar: 'د. محمد الفهد', specialty_en: 'Ophthalmologist', specialty_ar: 'طبيب عيون', branch: 'Jeddah Branch' },
      { id: 3, name_en: 'Dr. Noura Al-Rashid', name_ar: 'د. نورة الراشد', specialty_en: 'Optometrist', specialty_ar: 'أخصائية بصريات', branch: 'Riyadh Main Branch' },
      { id: 4, name_en: 'Dr. Ahmed Al-Saeed', name_ar: 'د. أحمد السعيد', specialty_en: 'Ophthalmologist', specialty_ar: 'طبيب عيون', branch: 'Jeddah Branch' },
    ];

    const branches = [
      { id: 1, name_en: 'Riyadh Main Branch', name_ar: 'الفرع الرئيسي - الرياض' },
      { id: 2, name_en: 'Jeddah Branch', name_ar: 'فرع جدة' },
    ];

    res.json({ doctors, branches });
  } catch (err) {
    console.error('Get doctors error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Admin: Set appointment for a customer
exports.setAppointment = (req, res) => {
  try {
    const db = getDb();
    const { customer_id, doctor_name, branch, appointment_date, time_slot, notes } = req.body;

    if (!customer_id || !doctor_name || !branch || !appointment_date || !time_slot) {
      return res.status(400).json({ error: 'Customer, doctor, branch, date, and time slot are required' });
    }

    // Verify customer exists
    const customer = db.prepare("SELECT id, name FROM users WHERE id = ? AND role = 'client'").get(customer_id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Check for conflicting appointment
    const conflict = db.prepare(
      "SELECT id FROM appointments WHERE doctor_name = ? AND appointment_date = ? AND time_slot = ? AND status != 'cancelled'"
    ).get(doctor_name, appointment_date, time_slot);

    if (conflict) {
      return res.status(409).json({ error: 'This time slot is already booked' });
    }

    const result = db.prepare(`
      INSERT INTO appointments (user_id, doctor_name, branch, appointment_date, time_slot, status, notes)
      VALUES (?, ?, ?, ?, ?, 'confirmed', ?)
    `).run(customer_id, doctor_name, branch, appointment_date, time_slot, notes || '');

    // Notify customer
    db.prepare('INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)')
      .run(customer_id, 'appointment_set', 'Appointment Scheduled',
        `An appointment has been scheduled for you with ${doctor_name} on ${appointment_date} at ${time_slot}`);

    const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ appointment });
  } catch (err) {
    console.error('Set appointment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all clients (admin)
exports.getClients = (req, res) => {
  try {
    const db = getDb();
    const clients = db.prepare(
      "SELECT id, name, email, phone FROM users WHERE role = 'client' ORDER BY name"
    ).all();
    res.json({ clients });
  } catch (err) {
    console.error('Get clients error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.cancelAppointment = (req, res) => {
  try {
    const db = getDb();
    const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // LOCK: Cannot cancel already completed or cancelled appointments
    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
      return res.status(400).json({ error: `Appointment is already ${appointment.status}` });
    }

    db.prepare("UPDATE appointments SET status = 'cancelled' WHERE id = ?").run(req.params.id);

    // Notify admin about cancellation
    const adminUsers = db.prepare("SELECT id FROM users WHERE role = 'admin'").all();
    for (const admin of adminUsers) {
      db.prepare('INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)')
        .run(admin.id, 'appointment_cancelled', 'Appointment Cancelled',
          `Appointment with ${appointment.doctor_name} on ${appointment.appointment_date} has been cancelled`);
    }

    res.json({ message: 'Appointment cancelled successfully' });
  } catch (err) {
    console.error('Cancel appointment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
