const express = require('express');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '50mb' }));

// --- SYSTEM API ---

// 1. Master Backup - Actual Database File
app.get('/admin/backup/db', (req, res) => {
  const dbPath = path.join(__dirname, 'prisma/dev.db');
  if (fs.existsSync(dbPath)) {
    res.download(dbPath, 'klencare_master.db');
  } else {
    res.status(404).send('Database file not found.');
  }
});

// 2. Migration Tool - Bulk Upsert from Browser State
app.post('/api/migrate', async (req, res) => {
  const { items, customers, vendors } = req.body;
  try {
    if (items) {
      for (const item of items) {
        await prisma.item.upsert({
          where: { sku: item.sku },
          update: { 
            name: item.name,
            sellingPrice: Number(item.sellingPrice) || 0,
            purchasePrice: Number(item.purchasePrice) || 0,
            unit: item.unit,
            category: item.category,
            status: item.status
          },
          create: { 
            sku: item.sku,
            name: item.name,
            sellingPrice: Number(item.sellingPrice) || 0,
            purchasePrice: Number(item.purchasePrice) || 0,
            unit: item.unit,
            category: item.category,
            status: item.status
          }
        });
      }
    }
    // Add logic for customers and vendors migration here...
    res.json({ success: true, message: 'Migration complete' });
  } catch (err) {
    console.error('Migration Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Entity APIs
app.get('/api/items', async (req, res) => {
  const items = await prisma.item.findMany();
  res.json(items);
});

app.post('/api/items', async (req, res) => {
  try {
    const item = await prisma.item.create({ data: req.body });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/vendors', async (req, res) => {
  const v = await prisma.vendor.findMany();
  res.json(v);
});

app.post('/api/vendors', async (req, res) => {
  try {
    const v = await prisma.vendor.create({ data: req.body });
    res.json(v);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SYSTEM TEST
app.post('/admin/system-test/run', async (req, res) => {
  try {
    const itemCount = await prisma.item.count();
    const vendorCount = await prisma.vendor.count();
    res.json({
      success: true,
      report: {
        database: 'SQLITE_PRISMA_ACTIVE',
        item_count: itemCount,
        vendor_count: vendorCount,
        uptime: Math.floor(process.uptime()),
        server_time: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => console.log(`KlenCare ERP Engine (SQLite) running on ${PORT}`));