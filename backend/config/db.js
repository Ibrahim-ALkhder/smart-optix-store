const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'smart_optix.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initializeDatabase() {
  const db = getDb();

  db.exec(`
    DROP TABLE IF EXISTS prescriptions;
    DROP TABLE IF EXISTS notifications;
    DROP TABLE IF EXISTS drivers_status;
    DROP TABLE IF EXISTS driver_activity_log;
    DROP TABLE IF EXISTS orders;
    DROP TABLE IF EXISTS appointments;
    DROP TABLE IF EXISTS products;
    DROP TABLE IF EXISTS users;
  `);

  db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT DEFAULT '',
      role TEXT NOT NULL DEFAULT 'client',
      full_name TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_en TEXT NOT NULL,
      name_ar TEXT NOT NULL,
      description_en TEXT NOT NULL DEFAULT '',
      description_ar TEXT NOT NULL DEFAULT '',
      price REAL NOT NULL,
      old_price REAL DEFAULT NULL,
      brand TEXT NOT NULL,
      material TEXT NOT NULL,
      shape TEXT NOT NULL,
      category TEXT NOT NULL,
      image_url TEXT DEFAULT '',
      stock INTEGER NOT NULL DEFAULT 0,
      is_prescription INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      driver_id INTEGER DEFAULT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'pending',
      prescription_data TEXT DEFAULT '{}',
      total_price REAL NOT NULL,
      shipping_address TEXT DEFAULT '',
      address_details TEXT DEFAULT '{}',
      customer_comments TEXT DEFAULT '',
      lens_upgrade_fee REAL DEFAULT 0,
      shipping_fee REAL DEFAULT 0,
      payment_method TEXT DEFAULT 'cash_on_delivery',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (driver_id) REFERENCES users(id)
    );

    CREATE TABLE driver_activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      driver_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      order_id INTEGER,
      details TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (driver_id) REFERENCES users(id)
    );

    CREATE TABLE drivers_status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      driver_id INTEGER UNIQUE NOT NULL,
      is_available INTEGER DEFAULT 0,
      region TEXT DEFAULT '',
      active_orders INTEGER DEFAULT 0,
      completed_deliveries INTEGER DEFAULT 0,
      FOREIGN KEY (driver_id) REFERENCES users(id)
    );

    CREATE TABLE appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      doctor_name TEXT NOT NULL,
      branch TEXT NOT NULL,
      appointment_date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed',
      notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE prescriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      right_eye_sph TEXT DEFAULT '',
      right_eye_cyl TEXT DEFAULT '',
      right_eye_axis TEXT DEFAULT '',
      left_eye_sph TEXT DEFAULT '',
      left_eye_cyl TEXT DEFAULT '',
      left_eye_axis TEXT DEFAULT '',
      pd TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      title TEXT NOT NULL DEFAULT '',
      message TEXT NOT NULL DEFAULT '',
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX idx_orders_user_id ON orders(user_id);
    CREATE INDEX idx_orders_status ON orders(status);
    CREATE INDEX idx_orders_driver_id ON orders(driver_id);
    CREATE INDEX idx_drivers_status_available ON drivers_status(is_available);
    CREATE INDEX idx_notifications_user_id ON notifications(user_id);
    CREATE INDEX idx_products_category ON products(category);
    CREATE INDEX idx_products_brand ON products(brand);
    CREATE INDEX idx_driver_activity_driver_id ON driver_activity_log(driver_id);
    CREATE INDEX idx_driver_activity_created_at ON driver_activity_log(created_at);
  `);

  seedDatabase(db);
  return db;
}

function seedDatabase(db) {
  const hashAdmin = bcrypt.hashSync('admin123', 10);
  const hashClient = bcrypt.hashSync('client123', 10);
  const hashDriver1 = bcrypt.hashSync('driver123', 10);
  const hashDriver2 = bcrypt.hashSync('driver123', 10);

  const insertUser = db.prepare('INSERT INTO users (name, email, password, phone, role, full_name) VALUES (?, ?, ?, ?, ?, ?)');
  insertUser.run('Admin SmartOptix', 'admin@smartoptix.com', hashAdmin, '+966501234567', 'admin', 'Admin SmartOptix');
  insertUser.run('Ahmed Client', 'client@smartoptix.com', hashClient, '+966509876543', 'client', 'Ahmed Al-Mutairi');
  insertUser.run('Khalid Driver', 'driver1@smartoptix.com', hashDriver1, '+966501112233', 'driver', 'Khalid Al-Otaibi');
  insertUser.run('Fahad Driver', 'driver2@smartoptix.com', hashDriver2, '+966504445566', 'driver', 'Fahad Al-Harbi');

  const insertDriverStatus = db.prepare('INSERT INTO drivers_status (driver_id, is_available, region, active_orders, completed_deliveries) VALUES (?, ?, ?, ?, ?)');
  insertDriverStatus.run(3, 1, 'Riyadh', 1, 24);
  insertDriverStatus.run(4, 0, 'Jeddah', 0, 18);

  // ===== 100+ PRODUCT SEED =====
  const insertProduct = db.prepare(`
    INSERT INTO products (name_en, name_ar, description_en, description_ar, price, old_price, brand, material, shape, category, image_url, stock, is_prescription)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const products = [
    // ===== PRESCRIPTION GLASSES (30 items) =====
    { name_en: 'Ray-Ban RX5228', name_ar: 'ري بايت RX5228', desc_en: 'Classic rectangular prescription frames with lightweight acetate. Timeless versatility for everyday wear.', desc_ar: 'إطار طبي كلاسيكي مستطيل من الأسيتاتة الخفيفة. تنوع خالد للارتداء اليومي.', price: 189.99, old_price: 249.99, brand: 'Ray-Ban', material: 'Acetate', shape: 'Rectangle', category: 'prescription', stock: 25, is_prescription: 1, img: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400' },
    { name_en: 'Oakley OO4123 Pitch', name_ar: 'أوكلي OO4123', desc_en: 'Sporty prescription frames with O-Matter™ durability. Built for active lifestyles.', desc_ar: 'إطار طبي رياضي بمتانة O-Matter™. مصمم لأسلوب حياة نشط.', price: 165.00, old_price: null, brand: 'Oakley', material: 'O-Matter', shape: 'Rectangle', category: 'prescription', stock: 30, is_prescription: 1, img: 'https://images.unsplash.com/photo-1516961642265-531546e84af2?w=400' },
    { name_en: 'Prada PR 17WS', name_ar: 'برادا PR 17WS', desc_en: 'Elegant rectangular prescription glasses with sleek black acetate frame. Perfect blend of fashion and function.', desc_ar: 'نظارات طبية أنيقة مستطيلة بإطار أسود أنيق من الأسيتاتة. مزيج مثالي من الأناقة والوظيفة.', price: 320.00, old_price: 395.00, brand: 'Prada', material: 'Acetate', shape: 'Rectangle', category: 'prescription', stock: 20, is_prescription: 1, img: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400' },
    { name_en: 'Tom Ford FT5178', name_ar: 'توم فورد FT5178', desc_en: 'Sophisticated cat-eye prescription frames with premium acetate and gold accents. Redefine your elegance.', desc_ar: 'إطار طبي أنيق بعيون قطط من الأسيتاتة الفاخرة مع لمسات ذهبية. أعد تعريف أناقتك.', price: 395.00, old_price: 475.00, brand: 'Tom Ford', material: 'Acetate', shape: 'Cat-Eye', category: 'prescription', stock: 12, is_prescription: 1, img: 'https://images.unsplash.com/photo-1516961642265-531546e84af2?w=400' },
    { name_en: 'Gucci GG0358O', name_ar: 'غوتشي GG0358O', desc_en: 'Luxury round prescription frames with interlocking G detail. Ultimate Italian craftsmanship.', desc_ar: 'إطار طبي دائري فاخر بتفاصيل G المتشابكة. حرفية إيطالية مطلقة.', price: 420.00, old_price: 520.00, brand: 'Gucci', material: 'Acetate', shape: 'Round', category: 'prescription', stock: 15, is_prescription: 1, img: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400' },
    { name_en: 'Versace VE3235', name_ar: 'فيرساتشي VE3235', desc_en: 'Bold square prescription frames with Medusa temple detail. Make a powerful statement.', desc_ar: 'إطار طبي مربع جريء بتفاصيل ميدوسا على المعبد. اجعل بياناً قوياً.', price: 380.00, old_price: null, brand: 'Versace', material: 'Metal', shape: 'Square', category: 'prescription', stock: 18, is_prescription: 1, img: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400' },
    { name_en: 'Burberry BE2306', name_ar: 'بيربوري BE2306', desc_en: 'Classic round prescription frames with signature check pattern on temples. British elegance.', desc_ar: 'إطار طبي دائري كلاسيكي بنمط البوربري المميز. أناقة بريطانية.', price: 295.00, old_price: 340.00, brand: 'Burberry', material: 'Acetate', shape: 'Round', category: 'prescription', stock: 22, is_prescription: 1, img: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400' },
    { name_en: 'Armani Exchange AX4216', name_ar: 'أرماني إك스شينج AX4216', desc_en: 'Sleek oval prescription frames with minimalist design. Modern sophistication.', desc_ar: 'إطار طبي بيضاوي أنيق بتصميم بسيط. حداثة راقية.', price: 175.00, old_price: null, brand: 'Armani', material: 'Metal', shape: 'Oval', category: 'prescription', stock: 28, is_prescription: 1, img: 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=400' },
    { name_en: 'Coach HC6277', name_ar: 'كوتش HC6277', desc_en: 'Chic rectangular prescription frames with signature COACH engraving. Everyday luxury.', desc_ar: 'إطار طبي مستطيل أنيق بنقشة COACH المميزة. فخامة يومية.', price: 165.00, old_price: 210.00, brand: 'Coach', material: 'Acetate', shape: 'Rectangle', category: 'prescription', stock: 35, is_prescription: 1, img: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400' },
    { name_en: 'Dior Homme DH1158', name_ar: 'ديور DH1158', desc_en: 'Ultra-refined titanium prescription frames. Featherlight with Dior elegance.', desc_ar: 'إطار طبي من التيتانيوم راقي للغاية. خفيف كالريشة بأناقة ديوور.', price: 450.00, old_price: 540.00, brand: 'Dior', material: 'Titanium', shape: 'Rectangle', category: 'prescription', stock: 10, is_prescription: 1, img: 'https://images.unsplash.com/photo-1516961642265-531546e84af2?w=400' },
    { name_en: 'Fendi FF0283', name_ar: 'فيندي FF0283', desc_en: 'Geometric octagonal prescription frames with FF logo temples. Fashion-forward design.', desc_ar: 'إطار طبي هندسي مثماني مع شعار FF على المعبد. تصميم متقدم.', price: 375.00, old_price: null, brand: 'Fendi', material: 'Acetate', shape: 'Hexagon', category: 'prescription', stock: 14, is_prescription: 1, img: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400' },
    { name_en: 'Michael Kors MK3148', name_ar: 'مايكل كورس MK3148', desc_en: 'Polished cat-eye prescription frames with logo accents. Glamorous everyday style.', desc_ar: 'إطار طبي قطعي لامع مع شعار الماركة. أسلوب ساحر يومي.', price: 195.00, old_price: 250.00, brand: 'Michael Kors', material: 'Acetate', shape: 'Cat-Eye', category: 'prescription', stock: 24, is_prescription: 1, img: 'https://images.unsplash.com/photo-1516961642265-531546e84af2?w=400' },
    { name_en: 'Cartier CT0316O', name_ar: 'كارتييه CT0316O', desc_en: 'Iconic Santos prescription frames with screw detail. The epitome of luxury eyewear.', desc_ar: 'إطار طبي أيقوني بتفاصيل البراغي. نموذج فاخر للنظارات.', price: 650.00, old_price: 780.00, brand: 'Cartier', material: 'Metal', shape: 'Rectangle', category: 'prescription', stock: 5, is_prescription: 1, img: 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=400' },
    { name_en: 'Tiffany & Co. TF4173', name_ar: 'تيفاني TF4173', desc_en: 'Delicate cat-eye prescription frames with Tiffany Blue accents. Timeless femininity.', desc_ar: 'إطار طبي قطعي رقيق بلمسات تيفاني الزرقاء. أنوثة خالدة.', price: 310.00, old_price: null, brand: 'Tiffany', material: 'Acetate', shape: 'Cat-Eye', category: 'prescription', stock: 16, is_prescription: 1, img: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400' },
    { name_en: 'Valentino VO5118', name_ar: 'فالنتينو VO5118', desc_en: 'Bold butterfly prescription frames with Rockstud temple detail. Italian glamour.', desc_ar: 'إطار طبي فراشة جريء بتفاصيل روكستاد. سحر إيطالي.', price: 345.00, old_price: 420.00, brand: 'Valentino', material: 'Acetate', shape: 'Butterfly', category: 'prescription', stock: 11, is_prescription: 1, img: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400' },
    { name_en: 'Balenciaga BA0216S', name_ar: 'بالينسياغا BA0216S', desc_en: 'Oversized square prescription frames with bold branding. Avant-garde luxury.', desc_ar: 'إطار طبي مربع مبورة بعلامة تجارية جريئة. فخامة تجريبية.', price: 480.00, old_price: null, brand: 'Balenciaga', material: 'Acetate', shape: 'Square', category: 'prescription', stock: 8, is_prescription: 1, img: 'https://images.unsplash.com/photo-1516961642265-531546e84af2?w=400' },
    { name_en: 'Saint Laurent SL566', name_ar: 'سانت لوران SL566', desc_en: 'Minimalist round prescription frames with gold-plated titanium. Understated luxury.', desc_ar: 'إطار طبي دائري بسيط من التيتانيوم المذهب. فخامة م低调ة.', price: 360.00, old_price: 430.00, brand: 'Saint Laurent', material: 'Titanium', shape: 'Round', category: 'prescription', stock: 13, is_prescription: 1, img: 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=400' },
    { name_en: 'Persol PO3228V', name_ar: 'بيرسول PO3228V', desc_en: 'Iconic Italian prescription frames with Meflecto temples. Artisan craftsmanship.', desc_ar: 'إطار طبي إيطالي أيقوني بمعبد Meflecto. حرفية حرفية.', price: 280.00, old_price: null, brand: 'Persol', material: 'Acetate', shape: 'Round', category: 'prescription', stock: 19, is_prescription: 1, img: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400' },
    { name_en: 'Chanel CC6032', name_ar: 'شانيل CC6032', desc_en: 'Camellia-inspired prescription frames with interlocking CC logo. Parisian chic.', desc_ar: 'إطار طبي مستوحى من زهرة الكاميليا بشعار CC. أنيقة باريسية.', price: 520.00, old_price: 620.00, brand: 'Chanel', material: 'Acetate', shape: 'Square', category: 'prescription', stock: 7, is_prescription: 1, img: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400' },
    { name_en: 'Gucci GG0016O', name_ar: 'غوتشي GG0016O', desc_en: 'Retro round prescription frames with green acetate. Vintage meets modern.', desc_ar: 'إطار طبي دائري عتيق من الأسيتاتة الخضراء. الكلاسيكية تلتقي بالحداثة.', price: 335.00, old_price: null, brand: 'Gucci', material: 'Acetate', shape: 'Round', category: 'prescription', stock: 17, is_prescription: 1, img: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400' },
    { name_en: 'Tom Ford FT5463', name_ar: 'توم فورد FT5463', desc_en: 'Sleek rectangular prescription frames with T logo. Polished sophistication.', desc_ar: 'إطار طبي مستطيل أنيق بعلامة T. رقي مصقول.', price: 410.00, old_price: 490.00, brand: 'Tom Ford', material: 'Metal', shape: 'Rectangle', category: 'prescription', stock: 9, is_prescription: 1, img: 'https://images.unsplash.com/photo-1516961642265-531546e84af2?w=400' },
    { name_en: 'Ray-Ban RX6414', name_ar: 'ري بايت RX6414', desc_en: 'Modern pilot-style prescription frames with lightweight metal. Aviation-inspired design.', desc_ar: 'إطار طبي بأسلوب طيار حديث من المعدن الخفيف. تصميم مستوحى من الطيران.', price: 199.99, old_price: 260.00, brand: 'Ray-Ban', material: 'Metal', shape: 'Aviator', category: 'prescription', stock: 27, is_prescription: 1, img: 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=400' },
    { name_en: 'Guerlain 226S', name_ar: 'غولان 226S', desc_en: 'Elegant oval prescription frames with crystal embellishments. Jeweled eyewear.', desc_ar: 'إطار طبي بيضاوي أنيق بزخارف كريستالية. نظارات مجوهرة.', price: 290.00, old_price: null, brand: 'Guerlain', material: 'Metal', shape: 'Oval', category: 'prescription', stock: 21, is_prescription: 1, img: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400' },
    { name_en: 'Dolce & Gabbana DG2240', name_ar: 'دولتشي وغابانا DG2240', desc_en: 'Bold baroque prescription frames with ornate temple design. Sicilian luxury.', desc_ar: 'إطار طبي جريء بأسلوب باروكي مع تصميم معبد مزخرف. فخامة صقلية.', price: 395.00, old_price: 480.00, brand: 'D&G', material: 'Acetate', shape: 'Square', category: 'prescription', stock: 6, is_prescription: 1, img: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400' },
    { name_en: 'Hugo Boss BO5192', name_ar: 'هوغو بوس BO5192', desc_en: 'Clean rectangular prescription frames with matte finish. German precision.', desc_ar: 'إطار طبي مستطيل نظيف بتشطيب مطفي. دقة ألمانية.', price: 215.00, old_price: null, brand: 'Hugo Boss', material: 'Acetate', shape: 'Rectangle', category: 'prescription', stock: 32, is_prescription: 1, img: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400' },
    { name_en: 'Bvlgari BV4093', name_ar: 'بولغاري BV4093', desc_en: 'Serpenti-inspired prescription frames with temple snake motif. Roman luxury.', desc_ar: 'إطار طبي مستوحى من السيربينتي بتصميم أفعى على المعبد. فخامة رومانية.', price: 475.00, old_price: 560.00, brand: 'Bvlgari', material: 'Metal', shape: 'Rectangle', category: 'prescription', stock: 8, is_prescription: 1, img: 'https://images.unsplash.com/photo-1516961642265-531546e84af2?w=400' },
    { name_en: 'Bottega Veneta BV0157O', name_ar: 'بوتtega فينيتا BV0157O', desc_en: 'Woven-texture round prescription frames. Understated Italian luxury.', desc_ar: 'إطار طبي دائри بنسيج منسوج. فخامة إيطالية م低调ة.', price: 385.00, old_price: null, brand: 'Bottega', material: 'Acetate', shape: 'Round', category: 'prescription', stock: 11, is_prescription: 1, img: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400' },
    { name_en: 'Celine CL41539', name_ar: 'سيلين CL41539', desc_en: 'Oversized round prescription frames with bold acetate. French intellectual style.', desc_ar: 'إطار طبي دائري مبورة من الأسيتاتة الجريئة. أسلوب فكري فرنسي.', price: 430.00, old_price: 520.00, brand: 'Celine', material: 'Acetate', shape: 'Round', category: 'prescription', stock: 10, is_prescription: 1, img: 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=400' },

    // ===== PROTECTION / BLUE-LIGHT GLASSES (25 items) =====
    { name_en: 'Gunnar Phantom', name_ar: 'غنار فانتوم', desc_en: 'Advanced blue-light blocking gaming glasses with amber tint lenses. Protect your eyes during screen time.', desc_ar: 'نظارات حماية متقدمة من الضوء الأزرق بعدسات كهرمانية. حما عيونك أثناء استخدام الشاشات.', price: 99.99, old_price: null, brand: 'Gunnar', material: 'Nylon', shape: 'Rectangle', category: 'protection', stock: 45, is_prescription: 0, img: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=400' },
    { name_en: 'Ray-Ban Blaze Blue', name_ar: 'ري بايت بليز بلو', desc_en: 'Iconic blue-light filtering lenses in classic Wayfarer style. Fashion meets protection.', desc_ar: 'عدسات فلترة الضوء الأزرق أيقونية بأسلوب وايفرر الكلاسيكي. الموضة تلتقي بالحماية.', price: 163.00, old_price: 195.00, brand: 'Ray-Ban', material: 'Acetate', shape: 'Wayfarer', category: 'protection', stock: 38, is_prescription: 0, img: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400' },
    { name_en: 'Oakley Clifden', name_ar: 'أوكلي كليفادن', desc_en: 'Blue-light protection with Prizm™ lens technology. Ultimate clarity for digital life.', desc_ar: 'حماية من الضوء الأزرق بتقنية Prizm™. وضوح مطلق للحياة الرقمية.', price: 201.00, old_price: null, brand: 'Oakley', material: 'O-Matter', shape: 'Square', category: 'protection', stock: 29, is_prescription: 0, img: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=400' },
    { name_en: 'Blue光 Shield Pro', name_ar: 'شيلد برو للحماية', desc_en: 'Professional blue-light blocking glasses with anti-glare coating. Ideal for office work.', desc_ar: 'نظارات احترافية ل-blocking الضوء الأزرق مع طبقة مضادة للوهج. مثالية للعمل المكتبي.', price: 79.99, old_price: 119.99, brand: 'Generic', material: 'TR-90', shape: 'Rectangle', category: 'protection', stock: 55, is_prescription: 0, img: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400' },
    { name_en: 'Gucci GG0819O Blue', name_ar: 'غوتشي GG0819O بلو', desc_en: 'Luxury blue-light glasses with signature double-G detail. Protection with prestige.', desc_ar: 'نظارات حماية فاخرة بتفاصيل GG المميزة. حmage مع هيبة.', price: 395.00, old_price: 450.00, brand: 'Gucci', material: 'Acetate', shape: 'Round', category: 'protection', stock: 18, is_prescription: 0, img: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400' },
    { name_en: 'Tom Ford FT5635 Blue', name_ar: 'توم فورد FT5635 بلو', desc_en: 'Premium blue-light filtering square frames. Protect your vision in style.', desc_ar: 'إطار مربع فاخر بفلترة الضوء الأزرق. حما رؤيتك بأناقة.', price: 350.00, old_price: null, brand: 'Tom Ford', material: 'Acetate', shape: 'Square', category: 'protection', stock: 22, is_prescription: 0, img: 'https://images.unsplash.com/photo-1516961642265-531546e84af2?w=400' },
    { name_en: 'Nike NIKE8158', name_ar: 'نايك NIKE8158', desc_en: 'Sporty blue-light blocking glasses with impact-resistant frame. Active protection.', desc_ar: 'نظارات حماية رياضية مقاومة للصدمات. حماية نشطة.', price: 89.99, old_price: 120.00, brand: 'Nike', material: 'Grilamid', shape: 'Rectangle', category: 'protection', stock: 42, is_prescription: 0, img: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=400' },
    { name_en: 'COS CT08 Blue', name_ar: 'كوز CT08 بلو', desc_en: 'Minimalist blue-light glasses with Scandinavian design. Clean aesthetic.', desc_ar: 'نظارات حماية بسيطة بتصميم اسكندنافي. جمالية نظيفة.', price: 65.00, old_price: null, brand: 'COS', material: 'Acetate', shape: 'Round', category: 'protection', stock: 60, is_prescription: 0, img: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400' },
    { name_en: 'Prada PR 17YF Blue', name_ar: 'برادا PR 17YF بلو', desc_en: 'Elegant blue-light protection in a bold oversized frame. Luxury meets health.', desc_ar: 'حماية أنيقة من الضوء الأزرق بإطار مبورة جريء. الفخمة تلتقي بالصحة.', price: 310.00, old_price: 380.00, brand: 'Prada', material: 'Acetate', shape: 'Cat-Eye', category: 'protection', stock: 16, is_prescription: 0, img: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400' },
    { name_en: 'Warby Parker Haskell', name_ar: 'واربي باركر هاسكل', desc_en: 'Blueprint blue-light filtering lenses in vintage-inspired frames. Smart protection.', desc_ar: 'عدسات فلترة الضوء الأزرق بإطار مستوحى منVintage. حماية ذكية.', price: 95.00, old_price: null, brand: 'Warby Parker', material: 'Acetate', shape: 'Round', category: 'protection', stock: 40, is_prescription: 0, img: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400' },
    { name_en: 'Nike Vision NIKE8159', name_ar: 'نايك فيجن NIKE8159', desc_en: 'Blue-light protection with sporty wrap design. Maximum coverage for gamers.', desc_ar: 'حماية من الضوء الأزرق بتصميم رياضي لف. تغطية قصوى للألعاب.', price: 99.99, old_price: 135.00, brand: 'Nike', material: 'Nylon', shape: 'Rectangle', category: 'protection', stock: 35, is_prescription: 0, img: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=400' },
    { name_en: 'Furla FU8277 Blue', name_ar: 'فورلا FU8277 بلو', desc_en: 'Feminine blue-light blocking cat-eye with Italian charm. Pretty and protective.', desc_ar: 'نظارات قطعية حماية بإيطالية ساحرة. جميلة وحماية.', price: 185.00, old_price: null, brand: 'Furla', material: 'Acetate', shape: 'Cat-Eye', category: 'protection', stock: 25, is_prescription: 0, img: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400' },
    { name_en: 'Arctics Blue Shield', name_ar: 'آركتيك شيلد بلو', desc_en: 'Heavy-duty blue-light blocking for extended screen use. Built for developers.', desc_ar: 'حماية قوية من الضوء الأزرق للاستخدام المكثف للشاشات. مصمم للمطورين.', price: 59.99, old_price: 89.99, brand: 'Generic', material: 'TR-90', shape: 'Rectangle', category: 'protection', stock: 65, is_prescription: 0, img: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400' },
    { name_en: 'Hugo Boss BO5304 Blue', name_ar: 'هوغو بوس BO5304 بلو', desc_en: 'Sophisticated blue-light protection frames. German engineering for your eyes.', desc_ar: 'إطار حماية راقي من الضوء الأزرق. هندسة ألمانية لعيونك.', price: 225.00, old_price: 280.00, brand: 'Hugo Boss', material: 'Acetate', shape: 'Rectangle', category: 'protection', stock: 20, is_prescription: 0, img: 'https://images.unsplash.com/photo-1516961642265-531546e84af2?w=400' },
    { name_en: 'Coach HC7519 Blue', name_ar: 'كوتش HC7519 بلو', desc_en: 'Signature blue-light glasses with horse carriage detail. Classic protection.', desc_ar: 'نظارات حماية بعلامة تجارية مميزة وتفاصيل عربة الحصان. حماية كلاسيكية.', price: 145.00, old_price: null, brand: 'Coach', material: 'Acetate', shape: 'Rectangle', category: 'protection', stock: 30, is_prescription: 0, img: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400' },
    { name_en: 'Burberry BE2371 Blue', name_ar: 'بيربوري BE2371 بلو', desc_en: 'Check-pattern blue-light blocking with British heritage design.', desc_ar: 'حماية من الضوء الأزرق بنمط البوربري المميز.', price: 275.00, old_price: 330.00, brand: 'Burberry', material: 'Acetate', shape: 'Round', category: 'protection', stock: 14, is_prescription: 0, img: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400' },
    { name_en: 'Valentino VO5246 Blue', name_ar: 'فالنتينو VO5246 بلو', desc_en: 'Rockstud blue-light protection. Punk meets protection.', desc_ar: 'حماية روكستاد من الضوء الأزرق. البانك يلتقي بالحماية.', price: 320.00, old_price: null, brand: 'Valentino', material: 'Metal', shape: 'Rectangle', category: 'protection', stock: 12, is_prescription: 0, img: 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=400' },
    { name_en: 'DKNY DK6008 Blue', name_ar: 'ديเคه إن واي DK6008 بلو', desc_en: 'New York inspired blue-light glasses. Urban protection for modern lifestyle.', desc_ar: 'نظارات حماية مستوحاة من نيويورك. حماية حضرية لنمط الحياة الحديث.', price: 130.00, old_price: 170.00, brand: 'DKNY', material: 'Acetate', shape: 'Square', category: 'protection', stock: 33, is_prescription: 0, img: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400' },
    { name_en: 'Tory Burch TY2093 Blue', name_ar: 'توري بيرش TY2093 بلو', desc_en: 'Feminine tortoiseshell blue-light frames with logo detail.', desc_ar: 'إطار حماية أنثوي بلمعان السَّلَفع وتفاصيل الشعار.', price: 195.00, old_price: null, brand: 'Tory Burch', material: 'Acetate', shape: 'Round', category: 'protection', stock: 27, is_prescription: 0, img: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400' },
    { name_en: 'EyeBuyDirect Express', name_ar: 'آي بيو دايركت إكسبريس', desc_en: 'Affordable blue-light blocking with anti-reflective coating. Smart choice.', desc_ar: 'حماية من الضوء الأزرق بسعر معقول مع طبقة مضادة للانعكاس. خيار ذكي.', price: 35.00, old_price: 55.00, brand: 'EyeBuyDirect', material: 'Polycarbonate', shape: 'Rectangle', category: 'protection', stock: 80, is_prescription: 0, img: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=400' },
    { name_en: 'Maui Jim MJ Blue', name_ar: 'ماوي جيم MJ بلو', desc_en: 'Premium blue-light lenses with PolarizedPlus2® technology.', desc_ar: 'عدسات حماية فاخرة من الضوء الأزرق بتقنية PolarizedPlus2®.', price: 219.99, old_price: 269.99, brand: 'Maui Jim', material: 'Titanium', shape: 'Oval', category: 'protection', stock: 19, is_prescription: 0, img: 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=400' },
    { name_en: 'Michael Kors MK4197 Blue', name_ar: 'مايكل كورس MK4197 بلو', desc_en: 'Chic blue-light glasses with gold accent. Glamour meets health.', desc_ar: 'نظارات حماية أنيقة بلمسة ذهبية. السحر يلتقي بالصحة.', price: 175.00, old_price: null, brand: 'Michael Kors', material: 'Metal', shape: 'Cat-Eye', category: 'protection', stock: 23, is_prescription: 0, img: 'https://images.unsplash.com/photo-1516961642265-531546e84af2?w=400' },
    { name_en: 'Zenni Blox Blue', name_ar: 'زيني بلوكس بلو', desc_en: 'Budget-friendly blue-light blocking with trendy designs. Style for everyone.', desc_ar: 'حماية من الضوء الأزرق بأسعار معقولة وتصاميم عصرية. أسلوب للجميع.', price: 29.99, old_price: 49.99, brand: 'Zenni', material: 'TR-90', shape: 'Round', category: 'protection', stock: 70, is_prescription: 0, img: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400' },
    { name_en: 'Calvin Klein CK5100 Blue', name_ar: 'كالفن كلاين CK5100 بلو', desc_en: 'Minimalist blue-light frames with modern American design.', desc_ar: 'إطار حماية بسيط بتصميم أمريكي حديث.', price: 155.00, old_price: 195.00, brand: 'Calvin Klein', material: 'Acetate', shape: 'Rectangle', category: 'protection', stock: 28, is_prescription: 0, img: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400' },

    // ===== LUXURY SUNGLASSES (30 items) =====
    { name_en: 'Ray-Ban Aviator Classic', name_ar: 'ري بايت أفياتور كلاسيك', desc_en: 'Iconic aviator sunglasses with gold-tone metal frame and green G-15 lenses. Timeless style.', desc_ar: 'نظارات شمسية أيقونية بإطار معدني ذهبي وعدسات خضراء G-15. أسلوب خالد.', price: 189.99, old_price: null, brand: 'Ray-Ban', material: 'Metal', shape: 'Aviator', category: 'sunglasses', stock: 25, is_prescription: 0, img: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400' },
    { name_en: 'Gucci GG0063S', name_ar: 'غوتشي GG0063S', desc_en: 'Luxury oversized round sunglasses with acetate frame and gradient brown lenses.', desc_ar: 'نظارات شمسية فاخرة مبورة بإطار أسيتاتية وعدسات بنية متدرجة.', price: 450.00, old_price: 540.00, brand: 'Gucci', material: 'Acetate', shape: 'Round', category: 'sunglasses', stock: 15, is_prescription: 0, img: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400' },
    { name_en: 'Oakley Holbrook OO9102', name_ar: 'أوكلي هولبروك OO9102', desc_en: 'Sporty square-frame sunglasses with O-Matter™ frame and polarized lenses.', desc_ar: 'نظارات شمسية رياضية مربعة بإطار O-Matter™ وعدسات مستقطبة.', price: 171.00, old_price: null, brand: 'Oakley', material: 'O-Matter', shape: 'Square', category: 'sunglasses', stock: 30, is_prescription: 0, img: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=400' },
    { name_en: 'Maui Jim MJ-702', name_ar: 'ماوي جيم MJ-702', desc_en: 'Premium polarized oval sunglasses with titanium frame. Ultimate clarity.', desc_ar: 'نظارات شمسية مستقطبة فاخرة بإطار تيتانيوم. وضوح مطلق.', price: 249.99, old_price: 299.99, brand: 'Maui Jim', material: 'Titanium', shape: 'Oval', category: 'sunglasses', stock: 18, is_prescription: 0, img: 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=400' },
    { name_en: 'Tom Ford FT0981', name_ar: 'توم فورد FT0981', desc_en: 'Oversized square sunglasses with signature T detail on temples. Red-carpet ready.', desc_ar: 'نظارات شمسية مبورة مربعة بتفاصيل T المميزة. جاهزة للسجادة الحمراء.', price: 395.00, old_price: null, brand: 'Tom Ford', material: 'Acetate', shape: 'Square', category: 'sunglasses', stock: 12, is_prescription: 0, img: 'https://images.unsplash.com/photo-1516961642265-531546e84af2?w=400' },
    { name_en: 'Prada PR 16WS', name_ar: 'برادا PR 16WS', desc_en: 'Geometric cat-eye sunglasses with gradient lenses. Italian glamour.', desc_ar: 'نظارات شمسية هندسية قططية بعدسات متدرجة. سحر إيطالي.', price: 340.00, old_price: 420.00, brand: 'Prada', material: 'Acetate', shape: 'Cat-Eye', category: 'sunglasses', stock: 20, is_prescription: 0, img: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400' },
    { name_en: 'Versace VE4401', name_ar: 'فيرساتشي VE4401', desc_en: 'Bold cat-eye sunglasses with Medusa detail. Maximum glamour.', desc_ar: 'نظارات شمسية قططية جريئة بتفاصيل ميدوسا. أقصى درجات السحر.', price: 375.00, old_price: null, brand: 'Versace', material: 'Acetate', shape: 'Cat-Eye', category: 'sunglasses', stock: 14, is_prescription: 0, img: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400' },
    { name_en: 'Ray-Ban Wayfarer Classic', name_ar: 'ري بايت وايفرر كلاسيك', desc_en: 'The most iconic sunglasses shape in history. Timeless cool.', desc_ar: 'أكثر شكل نظارات شمسية أيقونية في التاريخ. روح خالدة.', price: 163.00, old_price: null, brand: 'Ray-Ban', material: 'Acetate', shape: 'Wayfarer', category: 'sunglasses', stock: 40, is_prescription: 0, img: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400' },
    { name_en: 'Dior DiorSoStellaire', name_ar: 'ديور ديورسوستيلاير', desc_en: 'Ultra-thin metal frame sunglasses. Elegant and ethereal.', desc_ar: 'نظارات شمسية بإطار معدني رفيع للغاية. أنيقة وخلابة.', price: 520.00, old_price: 620.00, brand: 'Dior', material: 'Metal', shape: 'Round', category: 'sunglasses', stock: 10, is_prescription: 0, img: 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=400' },
    { name_en: 'Chanel CC5389', name_ar: 'شانيل CC5389', desc_en: 'Pilot sunglasses with interlocking CC logo. Parisian luxury.', desc_ar: 'نظارات شمسية طيار بشعار CC المتشابكة. فخامة باريسية.', price: 580.00, old_price: null, brand: 'Chanel', material: 'Metal', shape: 'Aviator', category: 'sunglasses', stock: 8, is_prescription: 0, img: 'https://images.unsplash.com/photo-1516961642265-531546e84af2?w=400' },
    { name_en: 'Persol PO6649S', name_ar: 'بيرسول PO6649S', desc_en: 'Celebrities-inspired folding sunglasses. Italian craftsmanship meets innovation.', desc_ar: 'نظارات شمسية قابلة للطي مستوحاة من المشاهير. حرفية إيطالية تلتقي بالابتكار.', price: 280.00, old_price: 340.00, brand: 'Persol', material: 'Acetate', shape: 'Round', category: 'sunglasses', stock: 16, is_prescription: 0, img: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400' },
    { name_en: 'Celine CL41468', name_ar: 'سيلين CL41468', desc_en: 'Oversized round sunglasses with bold silhouette. French fashion statement.', desc_ar: 'نظارات شمسية دائري مبورة بظل جريء. بيان أزياء فرنسي.', price: 485.00, old_price: null, brand: 'Celine', material: 'Acetate', shape: 'Round', category: 'sunglasses', stock: 9, is_prescription: 0, img: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400' },
    { name_en: 'Cartier CT0332S', name_ar: 'كارتييه CT0332S', desc_en: 'Santos de Cartier sunglasses with screw motif. Ultra-luxury statement.', desc_ar: 'نظارات شمسية سانتوس دي كارتييه بتصميم البراغي. بيان فخامة فائقة.', price: 850.00, old_price: 980.00, brand: 'Cartier', material: 'Metal', shape: 'Rectangle', category: 'sunglasses', stock: 3, is_prescription: 0, img: 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=400' },
    { name_en: 'Bvlgari BV8291', name_ar: 'بولغاري BV8291', desc_en: 'Serpenti-inspired sunglasses with snake temple detail. Roman power.', desc_ar: 'نظارات شمسية مستوحاة من السيربينتي بتصميم أفعى المعبد. قوة رومانية.', price: 510.00, old_price: null, brand: 'Bvlgari', material: 'Metal', shape: 'Cat-Eye', category: 'sunglasses', stock: 7, is_prescription: 0, img: 'https://images.unsplash.com/photo-1516961642265-531546e84af2?w=400' },
    { name_en: 'Balenciaga BA0084S', name_ar: 'بالينسياغا BA0084S', desc_en: 'Oversized shield sunglasses with futuristic design. Bold avant-garde.', desc_ar: 'نظارات شمسية واقي مبورة بتصميم مستقبلي. جريئة تجريبية.', price: 425.00, old_price: 520.00, brand: 'Balenciaga', material: 'Nylon', shape: 'Shield', category: 'sunglasses', stock: 11, is_prescription: 0, img: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=400' },
    { name_en: 'Saint Laurent SL458', name_ar: 'سانت لوران SL458', desc_en: 'Western-inspired cat-eye sunglasses with rock attitude.', desc_ar: 'نظارات شمسية قططية مستوحاة من الغرب ب attitude روك.', price: 390.00, old_price: null, brand: 'Saint Laurent', material: 'Acetate', shape: 'Cat-Eye', category: 'sunglasses', stock: 13, is_prescription: 0, img: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400' },
    { name_en: 'Gucci GG0020S', name_ar: 'غوتشي GG0020S', desc_en: 'Retro-inspired shield sunglasses with double-G detail.', desc_ar: 'نظارات شمسية واقي بتأثير عتيق بتفاصيل GG المزدوجة.', price: 495.00, old_price: 580.00, brand: 'Gucci', material: 'Acetate', shape: 'Shield', category: 'sunglasses', stock: 10, is_prescription: 0, img: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400' },
    { name_en: 'Fendi FF0284S', name_ar: 'فيندي FF0284S', desc_en: 'Oversized square sunglasses with FF logo detail.', desc_ar: 'نظارات شمسية مبورة مربعة بتفاصيل شعار FF.', price: 380.00, old_price: null, brand: 'Fendi', material: 'Acetate', shape: 'Square', category: 'sunglasses', stock: 15, is_prescription: 0, img: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400' },
    { name_en: 'Hermès HL0037', name_ar: 'أرماس HL0037', desc_en: 'Lacquered round sunglasses with H-temple design. Equestrian luxury.', desc_ar: 'نظارات شمسية دائرية مصقولة بتصميم H-temple. فخمة فروسية.', price: 720.00, old_price: 850.00, brand: 'Hermès', material: 'Acetate', shape: 'Round', category: 'sunglasses', stock: 5, is_prescription: 0, img: 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=400' },
    { name_en: 'Armani EA4174', name_ar: 'أرماني EA4174', desc_en: 'Pilot sunglasses with double bridge. Italian elegance.', desc_ar: 'نظارات شمسية طيار بجسر مزدوج. أناقة إيطالية.', price: 245.00, old_price: null, brand: 'Armani', material: 'Metal', shape: 'Aviator', category: 'sunglasses', stock: 28, is_prescription: 0, img: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400' },
    { name_en: 'Burberry BE3069S', name_ar: 'بيربوري BE3069S', desc_en: 'Vintage-inspired square sunglasses with check detail.', desc_ar: 'نظارات شمسية مربعة بتأثير عتيق بتفاصيل البوربري.', price: 290.00, old_price: 350.00, brand: 'Burberry', material: 'Acetate', shape: 'Square', category: 'sunglasses', stock: 19, is_prescription: 0, img: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400' },
    { name_en: 'Coach HC7310S', name_ar: 'كوتش HC7310S', desc_en: 'Round sunglasses with horse carriage temple detail.', desc_ar: 'نظارات شمسية دائرية بتفاصيل عربة الحصان على المعبد.', price: 175.00, old_price: null, brand: 'Coach', material: 'Acetate', shape: 'Round', category: 'sunglasses', stock: 32, is_prescription: 0, img: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400' },
    { name_en: 'Michael Kors MK4087S', name_ar: 'مايكل كورس MK4087S', desc_en: 'Oversized square sunglasses with gold MK logo. Jet-set glamour.', desc_ar: 'نظارات شمسية مبورة مربعة بشعار MK الذهبي. سحر السفر.', price: 195.00, old_price: 250.00, brand: 'Michael Kors', material: 'Acetate', shape: 'Square', category: 'sunglasses', stock: 24, is_prescription: 0, img: 'https://images.unsplash.com/photo-1516961642265-531546e84af2?w=400' },
    { name_en: 'Dolce & Gabbana DG2223S', name_ar: 'دولتشي وغابانا DG2223S', desc_en: 'Baroque-inspired cat-eye sunglasses with ornate temples.', desc_ar: 'نظارات شمسية قططية مستوحاة من الباروك بمعابد مزخرفة.', price: 415.00, old_price: null, brand: 'D&G', material: 'Acetate', shape: 'Cat-Eye', category: 'sunglasses', stock: 11, is_prescription: 0, img: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400' },
    { name_en: 'Valentino VO4130S', name_ar: 'فالنتينو VO4130S', desc_en: 'Rockstud embellished sunglasses. Punk meets Roman luxury.', desc_ar: 'نظارات شمسية مزينة بروكستاد. البانك يلتقي بالفخمة الرومانية.', price: 350.00, old_price: 430.00, brand: 'Valentino', material: 'Metal', shape: 'Round', category: 'sunglasses', stock: 14, is_prescription: 0, img: 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=400' },
    { name_en: 'Bottega Veneta BV0257S', name_ar: 'بوتtega فينيتا BV0257S', desc_en: 'Intrecciato-woven sunglasses. Craftsmanship at its finest.', desc_ar: 'نظارات شمسية بنسج Intrecciato. حرفية في أبهى صورها.', price: 420.00, old_price: null, brand: 'Bottega', material: 'Acetate', shape: 'Rectangle', category: 'sunglasses', stock: 8, is_prescription: 0, img: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400' },
    { name_en: 'Mont Blanc MB0301S', name_ar: 'مونت بلانك MB0301S', desc_en: 'Stylish pilot sunglasses with star emblem. Heritage meets modern.', desc_ar: 'نظارات شمسية طيار أنيقة بشعار النجمة. التراث يلتقي بالحداثة.', price: 310.00, old_price: 380.00, brand: 'Mont Blanc', material: 'Metal', shape: 'Aviator', category: 'sunglasses', stock: 17, is_prescription: 0, img: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400' },
    { name_en: 'Givenchy GV7085', name_ar: 'جيفنشي GV7085', desc_en: 'Geometric sunglasses with bold architectural lines.', desc_ar: 'نظارات شمسية هندسية بخطوط معمارية جريئة.', price: 360.00, old_price: null, brand: 'Givenchy', material: 'Acetate', shape: 'Hexagon', category: 'sunglasses', stock: 12, is_prescription: 0, img: 'https://images.unsplash.com/photo-1516961642265-531546e84af2?w=400' },
    { name_en: 'Loewe LW40050S', name_ar: 'لوي في LW40050S', desc_en: 'Puzzle-inspired sunglasses with asymmetric design.', desc_ar: 'نظارات شمسية مستوحاة من لغز بالتصميم غير المتماثل.', price: 475.00, old_price: 560.00, brand: 'Loewe', material: 'Acetate', shape: 'Round', category: 'sunglasses', stock: 6, is_prescription: 0, img: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400' },
    { name_en: 'MaxMara MMST199S', name_ar: 'ماكس مارا MMST199S', desc_en: 'Feminine cat-eye sunglasses with tortoiseshell pattern.', desc_ar: 'نظارات شمسية قططية أنثوية بنمط السَّلَفع.', price: 220.00, old_price: null, brand: 'MaxMara', material: 'Acetate', shape: 'Cat-Eye', category: 'sunglasses', stock: 21, is_prescription: 0, img: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400' },

    // ===== CONTACT LENSES (20 items) =====
    { name_en: 'Acuvue Oasys 1-Day', name_ar: 'أكوفيو أسايتس يومي', desc_en: 'Premium daily disposable contact lenses with HydraLuxe™ technology. All-day comfort.', desc_ar: 'عدسات لاصقة يومية فاخرة بتقنية HydraLuxe™. راحة طوال اليوم.', price: 45.00, old_price: null, brand: 'Acuvue', material: 'Silicone Hydrogel', shape: 'Round', category: 'contact_lenses', stock: 100, is_prescription: 0, img: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400' },
    { name_en: 'Dailies Total1', name_ar: 'ديليز توتدل 1', desc_en: 'Water gradient contact lenses for exceptional comfort. Premium daily lenses.', desc_ar: 'عدسات لاصقة بتدرج مائي لراحة استثنائية. عدسات يومية فاخرة.', price: 52.00, old_price: 60.00, brand: 'Alcon', material: 'Silicone Hydrogel', shape: 'Round', category: 'contact_lenses', stock: 85, is_prescription: 0, img: 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=400' },
    { name_en: 'Air Optix Colors', name_ar: 'آير أوبتيكس كولرز', desc_en: 'Enhancement tint contact lenses for natural eye color boost. Stunning results.', desc_ar: 'عدسات لاصقة بلون مُعزز لتعزيز لون العين الطبيعي. نتائج مذهلة.', price: 38.00, old_price: null, brand: 'Alcon', material: 'Silicone Hydrogel', shape: 'Round', category: 'contact_lenses', stock: 60, is_prescription: 0, img: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400' },
    { name_en: 'Biofinity Toric', name_ar: 'بيوفينيتي توريك', desc_en: 'Monthly toric lenses for astigmatism. Crystal clear vision correction.', desc_ar: 'عدسات شهرية توريك للإبصار. تصحيح رؤية صافي كالكريستال.', price: 65.00, old_price: 75.00, brand: 'CooperVision', material: 'Silicone Hydrogel', shape: 'Round', category: 'contact_lenses', stock: 45, is_prescription: 0, img: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400' },
    { name_en: 'Acuvue Moist', name_ar: 'أكوفيو مويست', desc_en: 'Daily disposable lenses with Lacreon™ moisture lock. Blink-activated hydration.', desc_ar: 'عدسات يومية بلمسة الرطوبة Lacreon™. ترطيب بالرمش.', price: 40.00, old_price: null, brand: 'Acuvue', material: 'Hydrogel', shape: 'Round', category: 'contact_lenses', stock: 90, is_prescription: 0, img: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400' },
    { name_en: 'BioTrue ONEday', name_ar: 'بايوريو يومي', desc_en: 'Daily lenses inspired by biology of the eye. Natural feeling all day.', desc_ar: 'عدسات يومية مستوحاة من بيولوجيا العين. إحساس طبيعي طوال اليوم.', price: 42.00, old_price: 50.00, brand: 'Bausch+Lomb', material: 'HyperGel', shape: 'Round', category: 'contact_lenses', stock: 75, is_prescription: 0, img: 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=400' },
    { name_en: 'Colors by Solotica', name_ar: 'كولرز سولوتيكا', desc_en: 'Natural-looking colored lenses. Transform your look with lifelike colors.', desc_ar: 'عدسات ملونة تبدو طبيعية. غيّر مظهرك بألوان واقعية.', price: 55.00, old_price: null, brand: 'Solotica', material: 'Hydrogel', shape: 'Round', category: 'contact_lenses', stock: 50, is_prescription: 0, img: 'https://images.unsplash.com/photo-1516961642265-531546e84af2?w=400' },
    { name_en: 'Frequency 55 Aspheric', name_ar: 'فريكوينسي 55', desc_en: 'Aspheric monthly lenses for crisp, clear vision. Excellent oxygen permeability.', desc_ar: 'عدسات شهرية غير متناظرة لرؤية حادة وواضحة. نفاذية أكسجين ممتازة.', price: 35.00, old_price: 42.00, brand: 'CooperVision', material: 'Hydrogel', shape: 'Round', category: 'contact_lenses', stock: 55, is_prescription: 0, img: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400' },
    { name_en: 'Air Optix Plus HydraGlyde', name_ar: 'آير أوبتيكس هايدرا', desc_en: 'Monthly lenses with SmartShield® technology. Consistent comfort all month.', desc_ar: 'عدسات شهرية بتقنية SmartShield®. راحة متسقة طوال الشهر.', price: 48.00, old_price: null, brand: 'Alcon', material: 'Silicone Hydrogel', shape: 'Round', category: 'contact_lenses', stock: 65, is_prescription: 0, img: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400' },
    { name_en: 'Dailies AquaComfort Plus', name_ar: 'ديليز أكوا كومفورت بلس', desc_en: 'Triple-action moisture daily lenses. Blink-activated comfort system.', desc_ar: 'عدسات يومية بترطيب ثلاثي الإجراءات. نظام راحة بالرمش.', price: 43.00, old_price: 52.00, brand: 'Alcon', material: 'Hydrogel', shape: 'Round', category: 'contact_lenses', stock: 80, is_prescription: 0, img: 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=400' },
    { name_en: 'Acuvue Vita', name_ar: 'أكوفيو فيتا', desc_en: 'Monthly silicone hydrogel lenses with UV protection. Extended wear comfort.', desc_ar: 'عدسات شهرية من السيليكون الهيدروجيل مع حماية UV. راحة ارتداء ممتدة.', price: 47.00, old_price: null, brand: 'Acuvue', material: 'Silicone Hydrogel', shape: 'Round', category: 'contact_lenses', stock: 70, is_prescription: 0, img: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400' },
    { name_en: 'MyDay Daily', name_ar: 'ماي دي يومي', desc_en: 'Eco-friendly daily disposable lenses. Sustainable comfort for your eyes.', desc_ar: 'عدسات يومية صديقة للبيئة. راحة مستدامة لعيونك.', price: 39.00, old_price: 48.00, brand: 'CooperVision', material: 'Silicone Hydrogel', shape: 'Round', category: 'contact_lenses', stock: 55, is_prescription: 0, img: 'https://images.unsplash.com/photo-1516961642265-531546e84af2?w=400' },
    { name_en: 'Biofinity Energys', name_ar: 'بيوفينيتي إنرجيز', desc_en: 'Digital focus lenses designed for screen users. Combat digital eye strain.', desc_ar: 'عدسات تركيز رقمي مصممة لمستخدمي الشاشات. مكافحة إجهاد العين الرقمي.', price: 68.00, old_price: null, brand: 'CooperVision', material: 'Silicone Hydrogel', shape: 'Round', category: 'contact_lenses', stock: 40, is_prescription: 0, img: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400' },
    { name_en: 'Ultra Monthly', name_ar: 'أولترا شهري', desc_en: 'Premium monthly lenses with MoistureSeal™ technology. 16-hour hydration.', desc_ar: 'عدسات شهرية فاخرة بتقنية MoistureSeal™. ترطيب 16 ساعة.', price: 55.00, old_price: 65.00, brand: 'Bausch+Lomb', material: 'Silicone Hydrogel', shape: 'Round', category: 'contact_lenses', stock: 48, is_prescription: 0, img: 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=400' },
    { name_en: 'FreshLook Colorblends', name_ar: 'فريش لوك كولرز', desc_en: 'Blended color contact lenses for a natural look. Subtle color transformation.', desc_ar: 'عدسات ملونة بتأثير خليط لمظهر طبيعي. تدرج لوني خفيف.', price: 42.00, old_price: null, brand: 'Alcon', material: 'Hydrogel', shape: 'Round', category: 'contact_lenses', stock: 58, is_prescription: 0, img: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400' },
    { name_en: '1-Day Acuvue Define', name_ar: 'أكوفيو دفاين يومي', desc_en: 'Accent contact lenses that enhance your natural eye beauty.', desc_ar: 'عدسات لاصقة تبرز جمال عيونك الطبيعي.', price: 50.00, old_price: 58.00, brand: 'Acuvue', material: 'Hydrogel', shape: 'Round', category: 'contact_lenses', stock: 62, is_prescription: 0, img: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400' },
    { name_en: 'Biomedics 55 Premier', name_ar: 'بيوميديكس 55', desc_en: 'Aspheric design monthly lenses for sharp vision. Reliable everyday lenses.', desc_ar: 'عدسات شهرية بتصميم غير متناظر لرؤية حادة. عدسات يومية موثوقة.', price: 32.00, old_price: null, brand: 'CooperVision', material: 'Hydrogel', shape: 'Round', category: 'contact_lenses', stock: 72, is_prescription: 0, img: 'https://images.unsplash.com/photo-1516961642265-531546e84af2?w=400' },
    { name_en: 'Toricol Multifocal', name_ar: 'توريكول ملتي', desc_en: 'Toric multifocal lenses for presbyopia correction. See near and far.', desc_ar: 'عدسات توريك متعددة البؤر لتصحيح تصلب الم.refraction. اقرأ القريب والبعيد.', price: 72.00, old_price: 85.00, brand: 'Alcon', material: 'Silicone Hydrogel', shape: 'Round', category: 'contact_lenses', stock: 35, is_prescription: 0, img: 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=400' },
    { name_en: 'SofLens Daily Disposable', name_ar: 'سوفت لنس يومي', desc_en: 'Comfortable daily lenses with Bindit® technology. Easy and convenient.', desc_ar: 'عدسات يومية مريحة بتقنية Bindit®. سهلة ومريحة.', price: 30.00, old_price: 38.00, brand: 'Bausch+Lomb', material: 'Nelfilcon A', shape: 'Round', category: 'contact_lenses', stock: 88, is_prescription: 0, img: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400' },
  ];

  // Some products should have low stock (< 10) for testing alerts
  const lowStockProducts = [12, 28, 33, 48, 55]; // Indices 0-based

  const insertMany = db.transaction((items) => {
    for (let i = 0; i < items.length; i++) {
      const p = items[i];
      const stock = lowStockProducts.includes(i) ? Math.floor(Math.random() * 5) + 3 : p.stock;
      insertProduct.run(
        p.name_en, p.name_ar, p.desc_en, p.desc_ar,
        p.price, p.old_price, p.brand, p.material, p.shape,
        p.category, p.img, stock, p.is_prescription
      );
    }
  });
  insertMany(products);

  // ===== ORDERS SEED =====
  const insertOrder = db.prepare(`
    INSERT INTO orders (user_id, product_id, driver_id, quantity, status, prescription_data, total_price, shipping_address, address_details, customer_comments, lens_upgrade_fee, shipping_fee)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const addr1 = JSON.stringify({ city: 'Riyadh', district: 'Al Olaya', street: 'King Fahd Road', house_number: '42', special_marks: 'Kingdom Tower', instructions: 'Ring doorbell twice' });
  const addr2 = JSON.stringify({ city: 'Jeddah', district: 'Al Hamra', street: 'Corniche Road', house_number: '15', special_marks: 'Near the fountain', instructions: 'Call upon arrival' });

  insertOrder.run(2, 1, 3, 1, 'delivered', '{}', 189.99, 'Riyadh, Kingdom Tower, Apt 42', addr1, '', 0, 15);
  insertOrder.run(2, 3, 3, 1, 'preparing', JSON.stringify({ right_eye: { sph: '-2.00', cyl: '-0.75', axis: '180' }, left_eye: { sph: '-1.75', cyl: '-0.50', axis: '175' }, pd: '63' }), 320.00, 'Riyadh, Kingdom Tower, Apt 42', addr1, 'Handle with care', 50, 15);
  insertOrder.run(2, 5, null, 2, 'pending', JSON.stringify({ right_eye: { sph: '-3.50', cyl: '-1.25', axis: '90' }, left_eye: { sph: '-3.25', cyl: '-1.00', axis: '85' }, pd: '62' }), 790.00, 'Jeddah, Corniche Road, Villa 15', addr2, 'Fragile package', 100, 20);

  // ===== APPOINTMENTS SEED =====
  const insertAppointment = db.prepare(`
    INSERT INTO appointments (user_id, doctor_name, branch, appointment_date, time_slot, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertAppointment.run(2, 'Dr. Sarah Al-Harbi', 'Riyadh Main Branch', '2026-06-10', '10:00 AM - 10:30 AM', 'confirmed');
  insertAppointment.run(2, 'Dr. Mohammad Al-Fahad', 'Jeddah Branch', '2026-06-15', '02:00 PM - 02:30 PM', 'pending');

  // ===== PRESCRIPTIONS SEED =====
  const insertPrescription = db.prepare(`
    INSERT INTO prescriptions (user_id, right_eye_sph, right_eye_cyl, right_eye_axis, left_eye_sph, left_eye_cyl, left_eye_axis, pd, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertPrescription.run(2, '-2.00', '-0.75', '180', '-1.75', '-0.50', '175', '63', 'Annual eye checkup prescription');

  console.log(`Database seeded successfully with ${products.length} products!`);
}

module.exports = { getDb, initializeDatabase };
