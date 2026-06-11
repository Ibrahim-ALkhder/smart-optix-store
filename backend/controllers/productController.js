const { getDb } = require('../config/db');

exports.getAllProducts = (req, res) => {
  try {
    const db = getDb();
    const { brand, material, shape, category, search } = req.query;

    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (brand) {
      query += ' AND brand = ?';
      params.push(brand);
    }
    if (material) {
      query += ' AND material = ?';
      params.push(material);
    }
    if (shape) {
      query += ' AND shape = ?';
      params.push(shape);
    }
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (search) {
      query += ' AND (name_en LIKE ? OR name_ar LIKE ? OR description_en LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY created_at DESC';

    const products = db.prepare(query).all(...params);
    res.json({ products });
  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getProductById = (req, res) => {
  try {
    const db = getDb();
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ product });
  } catch (err) {
    console.error('Get product error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createProduct = (req, res) => {
  try {
    const db = getDb();
    const { name_en, name_ar, description_en, description_ar, price, old_price, brand, material, shape, category, stock, is_prescription } = req.body;

    if (!name_en || !name_ar || !price || !brand || !material || !shape || !category) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    // Handle uploaded image file
    let image_url = '';
    if (req.file) {
      image_url = `/uploads/${req.file.filename}`;
    } else if (req.body.image_url) {
      image_url = req.body.image_url;
    }

    const result = db.prepare(`
      INSERT INTO products (name_en, name_ar, description_en, description_ar, price, old_price, brand, material, shape, category, image_url, stock, is_prescription)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name_en, name_ar, description_en || '', description_ar || '', parseFloat(price), old_price ? parseFloat(old_price) : null, brand, material, shape, category, image_url, parseInt(stock) || 0, is_prescription || 0);

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ product });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateProduct = (req, res) => {
  try {
    const db = getDb();
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { name_en, name_ar, description_en, description_ar, price, old_price, brand, material, shape, category, stock, is_prescription } = req.body;

    // Handle uploaded image file
    let image_url = product.image_url; // keep existing by default
    if (req.file) {
      image_url = `/uploads/${req.file.filename}`;
    } else if (req.body.image_url !== undefined) {
      image_url = req.body.image_url;
    }

    db.prepare(`
      UPDATE products SET
        name_en = COALESCE(?, name_en),
        name_ar = COALESCE(?, name_ar),
        description_en = COALESCE(?, description_en),
        description_ar = COALESCE(?, description_ar),
        price = COALESCE(?, price),
        old_price = ?,
        brand = COALESCE(?, brand),
        material = COALESCE(?, material),
        shape = COALESCE(?, shape),
        category = COALESCE(?, category),
        image_url = ?,
        stock = COALESCE(?, stock),
        is_prescription = COALESCE(?, is_prescription)
      WHERE id = ?
    `).run(
      name_en || null, name_ar || null,
      description_en || null, description_ar || null,
      price ? parseFloat(price) : null,
      old_price !== undefined && old_price !== '' ? parseFloat(old_price) : null,
      brand || null, material || null, shape || null, category || null,
      image_url,
      stock !== undefined ? parseInt(stock) : null,
      is_prescription !== undefined ? parseInt(is_prescription) : null,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    res.json({ product: updated });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteProduct = (req, res) => {
  try {
    const db = getDb();
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getFilterOptions = (req, res) => {
  try {
    const db = getDb();
    const brands = db.prepare('SELECT DISTINCT brand FROM products ORDER BY brand').all().map(r => r.brand);
    const materials = db.prepare('SELECT DISTINCT material FROM products ORDER BY material').all().map(r => r.material);
    const shapes = db.prepare('SELECT DISTINCT shape FROM products ORDER BY shape').all().map(r => r.shape);
    const categories = db.prepare('SELECT DISTINCT category FROM products ORDER BY category').all().map(r => r.category);

    res.json({ brands, materials, shapes, categories });
  } catch (err) {
    console.error('Get filters error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
