const { getDb } = require('../config/db');

// Get notifications for user
exports.getNotifications = (req, res) => {
  try {
    const db = getDb();
    const notifications = db.prepare(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
    ).all(req.user.id);
    const unreadCount = db.prepare(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0'
    ).get(req.user.id).count;
    res.json({ notifications, unreadCount });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Mark notifications as read
exports.markAsRead = (req, res) => {
  try {
    const db = getDb();
    const { ids } = req.body;
    if (ids && ids.length > 0) {
      const placeholders = ids.map(() => '?').join(',');
      db.prepare(`UPDATE notifications SET is_read = 1 WHERE id IN (${placeholders}) AND user_id = ?`)
        .run(...ids, req.user.id);
    } else {
      db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Mark notifications read error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Clear all notifications
exports.clearNotifications = (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM notifications WHERE user_id = ?').run(req.user.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Clear notifications error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
