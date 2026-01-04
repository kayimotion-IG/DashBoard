
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR);

const modules = [
  'items', 'customers', 'vendors', 'sales_orders', 'purchase_orders', 
  'invoices', 'bills', 'stock_moves', 'payments_received', 
  'payments_made', 'credit_notes', 'assemblies', 'delivery_challans', 
  'users', 'receives', 'settings'
];

const saveEntityData = (name, data) => {
  const filePath = path.join(DATA_DIR, `${name}.json`);
  if (fs.existsSync(filePath)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `${name}-${timestamp}.json`);
    fs.copyFileSync(filePath, backupPath);
    const backups = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith(name))
      .sort((a, b) => fs.statSync(path.join(BACKUP_DIR, b)).mtimeMs - fs.statSync(path.join(BACKUP_DIR, a)).mtimeMs);
    if (backups.length > 5) {
      backups.slice(5).forEach(f => fs.unlinkSync(path.join(BACKUP_DIR, f)));
    }
  }
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tempPath, filePath);
};

const loadEntityData = (name) => {
  const filePath = path.join(DATA_DIR, `${name}.json`);
  if (!fs.existsSync(filePath)) {
    if (name === 'users') return [{ id: '1', username: 'admin', name: 'System Admin', role: 'Admin', email: 'admin@klencare.net' }];
    if (name === 'settings') return { companyName: "KLENCARE ENTERPRISE", currency: "AED" };
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return [];
  }
};

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health Check
app.get('/api/ping', (req, res) => res.json({ status: 'online', storage: 'persistent_disk' }));

// Module Routes
modules.forEach(name => {
  app.get(`/api/${name}`, (req, res) => res.json(loadEntityData(name)));
  
  app.post(`/api/${name}`, (req, res) => {
    const currentData = loadEntityData(name);
    let updatedData;
    if (name === 'settings') {
      updatedData = req.body;
    } else {
      const index = currentData.findIndex(i => i.id === req.body.id);
      updatedData = [...currentData];
      if (index !== -1) updatedData[index] = req.body;
      else updatedData.unshift(req.body);
    }
    saveEntityData(name, updatedData);
    res.json(req.body);
  });

  // Specific PUT handler for individual resource updates
  app.put(`/api/${name}/:id`, (req, res) => {
    const currentData = loadEntityData(name);
    const index = currentData.findIndex(i => i.id === req.params.id);
    if (index !== -1) {
      currentData[index] = { ...currentData[index], ...req.body };
      saveEntityData(name, currentData);
      res.json(currentData[index]);
    } else {
      res.status(404).json({ error: 'Not Found' });
    }
  });
  
  app.delete(`/api/${name}/:id`, (req, res) => {
    const currentData = loadEntityData(name);
    const updatedData = currentData.filter(i => i.id !== req.params.id);
    saveEntityData(name, updatedData);
    res.json({ success: true });
  });
});

// Dispatch Simulation Routes
app.post('/api/invoices/:id/email', (req, res) => {
  console.log(`[Email Dispatch] Sending INV-${req.params.id} to ${req.body.to}`);
  res.json({ success: true, message: `Email successfully queued for ${req.body.to}` });
});

app.post('/api/invoices/:id/pdf', (req, res) => {
  res.json({ success: true, url: '#' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n KLENCARE CRM PERSISTENCE ENGINE ACTIVE ON PORT ${PORT}`);
});
