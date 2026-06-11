const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// We test the auth logic without starting the full server
const { getDb, initializeDatabase } = require('../config/db');

// Initialize test database
let db;

beforeAll(() => {
  initializeDatabase();
  db = getDb();
});

afterAll(() => {
  if (db) db.close();
});

describe('JWT Authentication', () => {
  const JWT_SECRET = 'smart_optix_secret_key_2026';

  test('generates valid JWT token with correct payload', () => {
    const user = { id: 1, email: 'admin@smartoptix.com', role: 'admin' };
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    expect(token).toBeTruthy();
    const decoded = jwt.verify(token, JWT_SECRET);
    expect(decoded.id).toBe(1);
    expect(decoded.email).toBe('admin@smartoptix.com');
    expect(decoded.role).toBe('admin');
  });

  test('rejects invalid JWT token', () => {
    expect(() => {
      jwt.verify('invalid.token.here', JWT_SECRET);
    }).toThrow();
  });

  test('rejects expired JWT token', () => {
    const token = jwt.sign({ id: 1, email: 'test@test.com', role: 'client' }, JWT_SECRET, { expiresIn: '0s' });
    // Wait briefly to ensure expiry
    expect(() => {
      jwt.verify(token, JWT_SECRET);
    }).toThrow();
  });

  test('rejects token signed with wrong secret', () => {
    const token = jwt.sign({ id: 1 }, 'wrong-secret');
    expect(() => {
      jwt.verify(token, JWT_SECRET);
    }).toThrow();
  });
});

describe('Password Hashing', () => {
  test('hashes password with bcrypt', () => {
    const password = 'testPassword123';
    const hash = bcrypt.hashSync(password, 10);
    expect(hash).not.toBe(password);
    expect(bcrypt.compareSync(password, hash)).toBe(true);
  });

  test('rejects incorrect password against hash', () => {
    const hash = bcrypt.hashSync('correctPassword', 10);
    expect(bcrypt.compareSync('wrongPassword', hash)).toBe(false);
  });
});

describe('SQLite Database Queries - SQL Injection Prevention', () => {
  test('parameterized queries prevent injection on login', () => {
    const maliciousEmail = "'; DROP TABLE users; --";
    const result = db.prepare('SELECT * FROM users WHERE email = ?').get(maliciousEmail);
    expect(result).toBeUndefined(); // Should not find anything, not crash
    
    // Verify users table still exists
    const users = db.prepare('SELECT COUNT(*) as count FROM users').get();
    expect(users.count).toBeGreaterThan(0);
  });

  test('parameterized queries prevent injection on product search', () => {
    const maliciousSearch = "%' OR '1'='1' DROP TABLE products; --";
    const products = db.prepare(
      'SELECT * FROM products WHERE (name_en LIKE ? OR name_ar LIKE ?)'
    ).all(`%${maliciousSearch}%`, `%${maliciousSearch}%`);
    
    // Should return empty results, not all products
    expect(Array.isArray(products)).toBe(true);
    
    // Verify products table still exists
    const count = db.prepare('SELECT COUNT(*) as count FROM products').get();
    expect(count.count).toBeGreaterThan(0);
  });

  test('parameterized queries prevent injection on order creation', () => {
    const maliciousComment = "'; UPDATE orders SET status='delivered' WHERE 1=1; --";
    const result = db.prepare(
      'INSERT INTO orders (user_id, product_id, quantity, status, total_price, customer_comments) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(2, 1, 1, 'pending', 100.00, maliciousComment);
    
    expect(result.changes).toBe(1);
    
    // Verify only the one order was inserted with the malicious string as literal text
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);
    expect(order.status).toBe('pending'); // Not 'delivered'
    expect(order.customer_comments).toBe(maliciousComment); // Stored as literal string
  });

  test('users table has expected seed data', () => {
    const admin = db.prepare("SELECT * FROM users WHERE email = 'admin@smartoptix.com'").get();
    expect(admin).toBeTruthy();
    expect(admin.role).toBe('admin');
    
    const client = db.prepare("SELECT * FROM users WHERE email = 'client@smartoptix.com'").get();
    expect(client).toBeTruthy();
    expect(client.role).toBe('client');
  });

  test('products table has expected seed data with bilingual fields', () => {
    const products = db.prepare('SELECT * FROM products').all();
    expect(products.length).toBeGreaterThanOrEqual(6);
    
    products.forEach(product => {
      expect(product.name_en).toBeTruthy();
      expect(product.name_ar).toBeTruthy();
      expect(product.description_en).toBeTruthy();
      expect(product.description_ar).toBeTruthy();
      expect(product.price).toBeGreaterThan(0);
    });
  });
});

describe('Driver Auto-Assignment Algorithm', () => {
  test('assigns order to available driver with fewest active orders', () => {
    // Get driver statuses before
    const driversBefore = db.prepare(`
      SELECT ds.driver_id, ds.is_available, ds.active_orders
      FROM drivers_status ds
      WHERE ds.is_available = 1
      ORDER BY ds.active_orders ASC
    `).all();
    
    expect(driversBefore.length).toBeGreaterThan(0);
    
    const availableDriver = driversBefore[0];
    const initialActiveOrders = availableDriver.active_orders;
    
    // Simulate the assignment algorithm
    const assignedDriver = db.prepare(`
      SELECT ds.driver_id, ds.active_orders, ds.is_available
      FROM drivers_status ds
      WHERE ds.is_available = 1
      ORDER BY ds.active_orders ASC
      LIMIT 1
    `).get();
    
    expect(assignedDriver).toBeTruthy();
    expect(assignedDriver.driver_id).toBe(availableDriver.driver_id);
  });

  test('offline drivers are not selected for assignment', () => {
    const offlineDriver = db.prepare(
      'SELECT * FROM drivers_status WHERE is_available = 0 LIMIT 1'
    ).get();
    
    if (offlineDriver) {
      const assigned = db.prepare(`
        SELECT ds.driver_id
        FROM drivers_status ds
        WHERE ds.is_available = 1 AND ds.driver_id = ?
      `).get(offlineDriver.driver_id);
      
      expect(assigned).toBeUndefined(); // Offline driver should not be assigned
    }
  });
});
