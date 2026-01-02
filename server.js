const express = require('express');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'klencare-super-secret-2026';

// Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(express.json({ limit: '10mb' }));

// --- MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid session' });
    req.user = user;
    next();
  });
};

const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// --- AUTH API ---
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (user && await bcrypt.compare(password, user.password_hash)) {
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ 
        token, 
        user: { id: user.id, name: user.name, role: user.role, email: user.email, username: user.username } 
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- USER MANAGEMENT API (Admin Only) ---
app.get('/api/users', authenticateToken, authorize(['Admin']), async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, name, email, role, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/users', authenticateToken, authorize(['Admin']), async (req, res) => {
  const { name, username, email, role } = req.body;
  // Generate a random 10-character password for the team member
  const rawPassword = crypto.randomBytes(5).toString('hex').toUpperCase();
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  try {
    const result = await pool.query(
      'INSERT INTO users (name, username, email, role, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, name, role',
      [name, username, email, role, passwordHash]
    );
    res.json({ ...result.rows[0], generatedPassword: rawPassword });
  } catch (err) {
    res.status(500).json({ error: err.message.includes('unique constraint') ? 'Username already exists' : err.message });
  }
});

app.delete('/api/users/:id', authenticateToken, authorize(['Admin']), async (req, res) => {
  if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' });
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- ITEMS API ---
app.get('/api/items', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM items ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/items', authenticateToken, authorize(['Admin']), async (req, res) => {
  const { name, sku, itemType, sellingPrice, purchasePrice, category, trackInventory, openingStock } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO items (name, sku, item_type, selling_price, purchase_price, category, track_inventory, opening_stock) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [name, sku, itemType, sellingPrice, purchasePrice, category, trackInventory, openingStock]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- CUSTOMERS API ---
app.get('/api/customers', authenticateToken, async (req, res) => {
  const result = await pool.query('SELECT * FROM customers ORDER BY name ASC');
  res.json(result.rows);
});

app.post('/api/customers', authenticateToken, authorize(['Admin']), async (req, res) => {
  const { name, companyName, email, phone, billingAddress } = req.body;
  const result = await pool.query(
    'INSERT INTO customers (name, company_name, email, phone, billing_address) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [name, companyName, email, phone, billingAddress]
  );
  res.json(result.rows[0]);
});

// --- SYSTEM INITIALIZATION ---
async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE,
        password_hash TEXT,
        name TEXT,
        email TEXT,
        role TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        name TEXT,
        sku TEXT UNIQUE,
        item_type TEXT,
        selling_price NUMERIC,
        purchase_price NUMERIC,
        category TEXT,
        track_inventory BOOLEAN,
        opening_stock NUMERIC,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name TEXT,
        company_name TEXT,
        email TEXT,
        phone TEXT,
        billing_address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const userCount = await pool.query('SELECT count(*) FROM users');
    if (parseInt(userCount.rows[0].count) === 0) {
      console.log('Seeding master admin account...');
      const adminPass = await bcrypt.hash('KlenCare@2026!', 10);
      await pool.query(
        'INSERT INTO users (username, password_hash, name, role, email) VALUES ($1, $2, $3, $4, $5)',
        ['admin', adminPass, 'System Owner', 'Admin', 'admin@klencare.net']
      );
    }
  } catch (err) {
    console.error('DB Init Error:', err);
  }
}

initDb().then(() => {
  app.listen(PORT, () => console.log(`KlenCare ERP Engine running on ${PORT}`));
});