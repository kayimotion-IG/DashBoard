const express = require('express');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));

// --- AUTH API ---
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  // Security logic matching App.tsx production requirements
  if (username === 'testadmin' && password === 'KlenCare@2026!') {
    return res.json({ 
      success: true, 
      user: { id: '1', name: 'KlenCare Admin', email: 'testadmin@klencare.com', role: 'Admin' } 
    });
  }
  res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// --- ITEMS API ---
app.get('/api/items', async (req, res) => {
  try {
    const items = await prisma.item.findMany({ include: { stockMoves: true } });
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/items', async (req, res) => {
  try {
    const item = await prisma.item.create({ data: req.body });
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/items/:id', async (req, res) => {
  try {
    const item = await prisma.item.update({ where: { id: req.params.id }, data: req.body });
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/items/:id', async (req, res) => {
  try {
    await prisma.item.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- CUSTOMERS API ---
app.get('/api/customers', async (req, res) => {
  const c = await prisma.customer.findMany();
  res.json(c);
});

app.post('/api/customers', async (req, res) => {
  const c = await prisma.customer.create({ data: req.body });
  res.json(c);
});

// --- VENDORS API ---
app.get('/api/vendors', async (req, res) => {
  const v = await prisma.vendor.findMany();
  res.json(v);
});

app.post('/api/vendors', async (req, res) => {
  const v = await prisma.vendor.create({ data: req.body });
  res.json(v);
});

// --- ADMIN & SYSTEM ---
app.get('/admin/backup/db', (req, res) => {
  const dbPath = path.join(__dirname, 'prisma/dev.db');
  if (fs.existsSync(dbPath)) res.download(dbPath, 'klencare_master.db');
  else res.status(404).send('Database not found.');
});

app.post('/admin/system-test/run', async (req, res) => {
  try {
    const count = await prisma.item.count();
    res.json({ success: true, report: { database: 'SQLITE_ACTIVE', items: count, time: new Date() } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.listen(PORT, () => console.log(`KlenCare ERP Engine running on ${PORT}`));