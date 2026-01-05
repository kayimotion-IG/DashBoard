
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';

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
  'users', 'receives', 'settings', 'communications', 'expenses'
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
      senderEmail: "billing@crm.klencare.net",
      smtpHost: "smtp.hostinger.com",
      smtpPort: "465"
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
    if (name === 'settings') updatedData = req.body;
    else {
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
    } else res.status(404).json({ error: 'Not Found' });
  });
  app.delete(`/api/${name}/:id`, (req, res) => {
    const currentData = loadEntityData(name);
    const updatedData = currentData.filter(i => i.id !== req.params.id);
    saveEntityData(name, updatedData);
    res.json({ success: true });
  });
});

/**
 * PRODUCTION EMAIL DISPATCH
 */
app.post('/api/invoices/:id/email', async (req, res) => {
  const { to, subject, body, sentBy, plainText } = req.body;
  const invoiceId = req.params.id;
  const settings = loadEntityData('settings');

  console.log(`[DISPATCH REQUEST] Recipient: ${to}, Method: SMTP`);

  const smtpPort = parseInt(settings.smtpPort) || 465;
  const useSmtp = settings.smtpHost && (settings.smtpHost.includes('hostinger') || smtpPort !== 0);
  const apiKey = settings.emailApiKey; 
  const fromEmail = settings.senderEmail;

  if (!apiKey || !fromEmail) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email credentials (Email or Password) are missing in Settings.' 
    });
  }

  try {
    let messageId = '';

    if (useSmtp) {
      console.log(`[SMTP] Handshaking with ${settings.smtpHost}:${smtpPort}...`);
      const transporter = nodemailer.createTransport({
        host: settings.smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: fromEmail,
          pass: apiKey,
        },
        tls: {
          rejectUnauthorized: false 
        },
        connectionTimeout: 10000 // 10s timeout
      });

      // Rapid Verification
      await transporter.verify();

      const info = await transporter.sendMail({
        from: `"${settings.companyName}" <${fromEmail}>`,
        to,
        subject,
        text: body,
        html: plainText ? undefined : `<div style="font-family: sans-serif; line-height: 1.6; color: #1e293b;">${body.replace(/\n/g, '<br>')}</div>`,
      });
      messageId = info.messageId;
      console.log(`[SMTP] Success: ${messageId}`);
    } else {
      const resend = new Resend(apiKey);
      const { data, error } = await resend.emails.send({
        from: `${settings.companyName} <${fromEmail}>`,
        to: [to],
        subject: subject,
        text: plainText ? body : undefined,
        html: plainText ? undefined : `<div style="font-family: sans-serif; line-height: 1.6; color: #1e293b;">${body.replace(/\n/g, '<br>')}</div>`,
      });
      if (error) throw error;
      messageId = data.id;
    }

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
      providerId: messageId
    };
    
    comms.unshift(newLog);
    saveEntityData('communications', comms);
    res.json({ success: true, message: `Email dispatched successfully`, log: newLog });

  } catch (err) {
    console.error('[SMTP ENGINE ERROR]:', err.code, err.message);
    let errorMsg = err.message;
    if (err.code === 'EAUTH') errorMsg = 'Hostinger Authentication Failed: Check your Email Password.';
    if (err.code === 'ESOCKET') errorMsg = 'Network Error: Hostinger server timed out or blocked connection.';
    
    res.status(500).json({ success: false, message: errorMsg });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n KLENCARE CRM PERSISTENCE ENGINE ACTIVE ON PORT ${PORT}`);
});
