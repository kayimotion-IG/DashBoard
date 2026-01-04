
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { Resend } from 'resend';

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
  'users', 'receives', 'settings', 'communications'
];

const saveEntityData = (name, data) => {
  const filePath = path.join(DATA_DIR, `${name}.json`);
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tempPath, filePath);
};

const loadEntityData = (name) => {
  const filePath = path.join(DATA_DIR, `${name}.json`);
  if (!fs.existsSync(filePath)) {
    if (name === 'users') return [{ id: '1', username: 'admin', name: 'System Admin', role: 'Admin', email: 'admin@klencare.net' }];
    if (name === 'settings') return { 
      companyName: "KLENCARE ENTERPRISE", 
      currency: "AED",
      senderEmail: "billing@crm.klencare.net"
    };
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

/**
 * PRODUCTION EMAIL DISPATCH (RESEND INTEGRATION)
 * Route: POST /api/invoices/:id/email
 */
app.post('/api/invoices/:id/email', async (req, res) => {
  const { to, subject, body, sentBy, plainText } = req.body;
  const invoiceId = req.params.id;
  const settings = loadEntityData('settings');

  // Verify Configuration
  const apiKey = settings.emailApiKey;
  const fromEmail = settings.senderEmail || 'billing@crm.klencare.net';

  if (!apiKey) {
    console.warn('[CRM] Dispatch aborted: No API Key found in settings.');
    return res.status(400).json({ 
      success: false, 
      message: 'Email service not configured. Please add your Resend API Key in Settings.' 
    });
  }

  const resend = new Resend(apiKey);

  try {
    console.log(`[Resend] Dispatching to ${to} from ${fromEmail}...`);
    
    const { data, error } = await resend.emails.send({
      from: `${settings.companyName || 'KlenCare CRM'} <${fromEmail}>`,
      to: [to],
      subject: subject,
      // If plainText is true, use 'text' field, otherwise wrap in simple HTML for Resend
      text: plainText ? body : undefined,
      html: plainText ? undefined : `<div style="font-family: sans-serif; line-height: 1.5; color: #333;">${body.replace(/\n/g, '<br>')}</div>`,
    });

    if (error) {
      throw error;
    }

    // Record Success in Communications Log
    const comms = loadEntityData('communications');
    const newLog = {
      id: `COMM-${Date.now()}`,
      entityId: invoiceId,
      entityType: invoiceId === 'TEST' ? 'SYSTEM' : 'INVOICE',
      recipient: to,
      subject,
      body,
      sentBy,
      timestamp: new Date().toISOString(),
      status: 'Gone',
      providerId: data.id // Store Resend ID for tracking
    };
    
    comms.unshift(newLog);
    saveEntityData('communications', comms);

    res.json({ 
      success: true, 
      message: `Email successfully dispatched via Resend`, 
      log: newLog 
    });

  } catch (err) {
    console.error('[Resend Error]:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send email through Resend.', 
      details: err.message 
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n KLENCARE CRM PERSISTENCE ENGINE ACTIVE ON PORT ${PORT}`);
});
