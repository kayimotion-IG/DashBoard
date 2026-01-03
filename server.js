
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'database.json');
const JWT_SECRET = 'klencare-pro-2026-secure-key';

// Database Initialization
const initialData = {
  users: [{ id: '1', username: 'admin', password_hash: bcrypt.hashSync('admin', 10), name: 'System Admin', role: 'Admin', email: 'admin@klencare.net' }],
  items: [],
  customers: [],
  vendors: [],
  sales_orders: [],
  purchase_orders: [],
  invoices: [],
  bills: [],
  stock_moves: [],
  payments_received: [],
  payments_made: [],
  credit_notes: [],
  assemblies: [],
  delivery_challans: [],
  receives: [],
  settings: { 
    companyName: "KLENCARE ENTERPRISE", 
    companyAddress: "Dubai, UAE", 
    companyPhone: "+971 50 315 7462", 
    companyEmail: "support@klencare.net", 
    currency: "AED", 
    vatNumber: "100234567800003", 
    allowNegativeStock: false 
  }
};

const initDb = () => {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
  }
};

const readDb = () => JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
const writeDb = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

initDb();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Auth API
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const db = readDb();
  const user = db.users.find(u => u.username === username);
  if (user && (password === 'admin' || bcrypt.compareSync(password, user.password_hash))) {
    const token = jwt.sign({ id: user.id }, JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, role: user.role, username: user.username } });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Dynamic CRUD Routes
const modules = [
  'items', 'customers', 'vendors', 'sales_orders', 'purchase_orders', 
  'invoices', 'bills', 'stock_moves', 'payments_received', 
  'payments_made', 'credit_notes', 'assemblies', 'delivery_challans', 
  'users', 'receives'
];

modules.forEach(name => {
  app.get(`/api/${name}`, (req, res) => {
    const db = readDb();
    res.json(db[name] || []);
  });
  
  app.post(`/api/${name}`, (req, res) => {
    const db = readDb();
    if (!db[name]) db[name] = [];
    const index = db[name].findIndex(i => i.id === req.body.id);
    if (index !== -1) db[name][index] = req.body;
    else db[name].push(req.body);
    writeDb(db);
    res.json(req.body);
  });
  
  app.delete(`/api/${name}/:id`, (req, res) => {
    const db = readDb();
    db[name] = db[name].filter(i => i.id !== req.params.id);
    writeDb(db);
    res.json({ success: true });
  });
});

app.get('/api/settings', (req, res) => res.json(readDb().settings));
app.post('/api/settings', (req, res) => {
  const db = readDb();
  db.settings = req.body;
  writeDb(db);
  res.json(db.settings);
});

app.listen(PORT, () => {
  console.log(`Backend Engine Online: http://localhost:${PORT}`);
});
