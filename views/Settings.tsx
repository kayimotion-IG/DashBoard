
import React, { useState } from 'react';
import { 
  Building2, Save, Globe, Phone, Mail, 
  Settings as SettingsIcon, FileText, Image as ImageIcon,
  Database, Download, Upload, AlertCircle, Terminal,
  Server, ShieldCheck, CheckCircle2, FlaskConical, FileArchive, FileJson,
  Users, ShoppingCart, Truck, Boxes, Receipt, Package, Eye, X, FileDown
} from 'lucide-react';
import { itemService } from '../services/item.service';
import { backupService } from '../services/backup.service';
import { pdfService } from '../services/pdf.service';
import { AppSettings } from '../types';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AppSettings>(itemService.getSettings());
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [activeTab, setActiveTab] = useState<'profile' | 'templates' | 'system' | 'deployment'>('profile');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleSave = () => {
    setSaveStatus('saving');
    itemService.updateSettings(settings);
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1000);
  };

  const showPreview = (type: 'INV' | 'SO' | 'PO' | 'ST' | 'CN') => {
    const dummyCust = { 
      id: 'DUMMY', 
      name: 'Standard Global UAE', 
      companyName: 'Standard Global Trading LLC', 
      billingAddress: 'Downtown Dubai, UAE', 
      shippingAddress: 'Downtown Dubai, UAE', 
      email: 'finance@standard.ae', 
      phone: '+971 4 000 0000', 
      currency: 'AED', 
      status: 'Active' as const, 
      createdAt: new Date().toISOString() 
    };
    const dummyVendor = { id: 'VND', name: 'Premium Supplier', companyName: 'Premium Supplier Trading', email: 'orders@premium.com', phone: '+971 4 111 1111', currency: 'AED', address: 'JAFZA South, Dubai, UAE', status: 'Active' as const, createdAt: new Date().toISOString() };
    
    let url: any = '';
    if (type === 'INV') {
      url = pdfService.generateInvoice({ id: '1', invoiceNumber: 'INV-TEMP-001', customerId: 'DUMMY', date: new Date().toISOString(), dueDate: new Date().toISOString(), total: 5250, balanceDue: 5250, status: 'Sent', lines: [{ id: '1', itemId: '1', itemName: 'Professional Industrial Service Unit', quantity: 2, rate: 2500, taxAmount: 250, total: 5250 }] }, dummyCust, null, true);
    } else if (type === 'SO') {
      url = pdfService.generateSalesOrder({ id: '1', orderNumber: 'SO-TEMP-001', customerId: 'DUMMY', date: new Date().toISOString(), status: 'Confirmed', subTotal: 5000, taxTotal: 250, total: 5250, lines: [{ id: '1', itemId: '1', itemName: 'Inventory Batch IC-001', quantity: 2, rate: 2500, taxAmount: 250, total: 5250 }] }, dummyCust, null, true);
    } else if (type === 'PO') {
      url = pdfService.generatePurchaseOrder({ id: '1', poNumber: 'PO-TEMP-001', vendorId: 'VND', date: new Date().toISOString(), status: 'Issued', total: 4000, lines: [{ id: '1', itemId: '1', itemName: 'Bulk Raw Material', quantity: 100, rate: 40, total: 4000 }] }, dummyVendor, null, true);
    } else if (type === 'ST') {
      url = pdfService.generateStatement(dummyCust, null, true);
    } else if (type === 'CN') {
      url = pdfService.generateCreditNote({ id: '1', creditNoteNumber: 'CN-TEMP-001', customerId: 'DUMMY', date: new Date().toISOString(), amount: 500, status: 'Open', reason: 'Billing Adjustment' }, dummyCust, null, true);
    }
    setPreviewUrl(url ? url.toString() : null);
  };

  const ExportButton = ({ label, icon, onClick, color = "bg-slate-50 text-slate-700" }: any) => (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all ${color}`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Control Center</h1>
          <p className="text-slate-500 text-sm">Branding and organizational master data configuration.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saveStatus !== 'idle'}
          className={`flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-sm shadow-xl transition-all active:scale-95 ${
            saveStatus === 'saved' ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Config Locked!' : <><Save size={18} /> Commit Configuration</>}
        </button>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 mb-6 overflow-x-auto">
        {[
          { id: 'profile', label: 'Identity Profile', icon: <Building2 size={16} /> },
          { id: 'templates', label: 'Document Branding', icon: <FileText size={16} /> },
          { id: 'system', label: 'Data Resilience', icon: <Database size={16} /> },
          { id: 'deployment', label: 'Operations Guide', icon: <Server size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab.id ? 'border-[#2563eb] text-[#2563eb]' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Entity Name</label>
                  <input value={settings.companyName} onChange={e => setSettings({...settings, companyName: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 text-sm font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">TRN (UAE Tax Number)</label>
                  <input value={settings.vatNumber} onChange={e => setSettings({...settings, vatNumber: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 text-sm font-mono" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Registered Address</label>
                  <textarea value={settings.companyAddress} onChange={e => setSettings({...settings, companyAddress: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 text-sm h-24 leading-relaxed" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Standard Invoice Footer (T&C)</label>
                  <input value={settings.pdfFooter} onChange={e => setSettings({...settings, pdfFooter: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 text-sm" placeholder="Terms and conditions apply..." />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-10">
               <div className="flex items-center gap-4 mb-10">
                  <div className="w-14 h-14 bg-orange-50 text-[#f97316] rounded-2xl flex items-center justify-center border border-orange-100 shadow-sm">
                    <FileText size={28} />
                  </div>
                  <div>
                    <h3 className="text-base font-black uppercase tracking-widest text-slate-900">Document Visual Verification</h3>
                    <p className="text-xs text-slate-500 font-medium">Test how your Orange & Blue branding renders in official PDF exports.</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                    { id: 'INV', label: 'Tax Invoice (TRN)', icon: <Receipt size={22} />, color: 'bg-[#2563eb]' },
                    { id: 'SO', label: 'Sales Order', icon: <ShoppingCart size={22} />, color: 'bg-indigo-600' },
                    { id: 'PO', label: 'Purchase Order', icon: <Truck size={22} />, color: 'bg-rose-600' },
                    { id: 'CN', label: 'Credit Note', icon: <FileText size={22} />, color: 'bg-[#f97316]' },
                    { id: 'ST', label: 'Client Statement', icon: <Users size={22} />, color: 'bg-emerald-600' },
                  ].map(tpl => (
                    <div key={tpl.id} className="p-8 border border-slate-200 rounded-[28px] hover:border-blue-400 hover:shadow-2xl transition-all group bg-slate-50/30">
                       <div className="flex items-center justify-between mb-6">
                          <div className={`p-4 rounded-2xl ${tpl.color} text-white shadow-lg`}>{tpl.icon}</div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verified</span>
                       </div>
                       <h4 className="text-sm font-black text-slate-900 mb-8">{tpl.label}</h4>
                       <button 
                         onClick={() => showPreview(tpl.id as any)}
                         className="w-full flex items-center justify-center gap-3 py-3.5 bg-white text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest border-2 border-slate-100 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all shadow-sm"
                       >
                         <Eye size={16} /> Open Preview
                       </button>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
            <div className="bg-white p-10 rounded-[32px] border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-14 h-14 bg-blue-50 text-[#2563eb] rounded-2xl flex items-center justify-center"><Download size={28} /></div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-widest text-slate-900">Server & Data Persistence</h3>
                  <p className="text-xs text-slate-500 font-medium">Export master records for cold storage or system migration.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="p-8 bg-slate-900 rounded-[32px] text-white space-y-6 shadow-2xl">
                  <div className="flex items-center justify-between">
                     <Database size={28} className="text-[#2563eb]" />
                     <span className="text-[10px] font-black text-[#2563eb] uppercase tracking-widest">Production DB</span>
                  </div>
                  <div>
                    <p className="text-xl font-black tracking-tight">Main SQLite File (.db)</p>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">Download the physical database file containing all structured organizational data.</p>
                  </div>
                  <button onClick={() => backupService.downloadDbFile()} className="w-full py-4 bg-[#2563eb] rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-xl">Download Binary</button>
                </div>

                <div className="p-8 bg-white border border-slate-200 rounded-[32px] space-y-6 shadow-sm">
                  <div className="flex items-center justify-between">
                     <FileArchive size={28} className="text-slate-600" />
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deployment</span>
                  </div>
                  <div>
                    <p className="text-xl font-black tracking-tight text-slate-900">Full System Snapshot</p>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">Generate a complete package of current assets, configs, and ledger states.</p>
                  </div>
                  <button onClick={() => backupService.downloadFullBackup()} className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl">Generate Bundle</button>
                </div>
              </div>

              <div className="space-y-8 pt-8 border-t border-slate-100">
                 <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                    <FileJson size={16} /> Human-Readable Ledger Exports (CSV)
                 </h4>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <ExportButton label="Stock Ledger" icon={<Package size={18}/>} onClick={() => backupService.exportStockMoves()} />
                    <ExportButton label="Receivables" icon={<Receipt size={18}/>} onClick={() => backupService.exportInvoices()} />
                    <ExportButton label="Payables" icon={<ShoppingCart size={18}/>} onClick={() => backupService.exportBills()} />
                    <ExportButton label="Item Master" icon={<Boxes size={18}/>} onClick={() => backupService.exportItems()} />
                    <ExportButton label="CRM Master" icon={<Users size={18}/>} onClick={() => backupService.exportCustomers()} />
                    <ExportButton label="Vendor List" icon={<Truck size={18}/>} onClick={() => backupService.exportVendors()} />
                 </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'deployment' && (
          <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
            <div className="bg-slate-900 p-12 rounded-[48px] text-white shadow-2xl">
              <div className="flex items-center gap-5 mb-10">
                 <div className="p-4 bg-white/10 rounded-[20px]"><Terminal size={32} className="text-[#2563eb]" /></div>
                 <div>
                    <h3 className="text-3xl font-black tracking-tight">Deployment Strategy</h3>
                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Enterprise Bare-Metal Configuration</p>
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-6">
                    <p className="text-[11px] font-black text-[#2563eb] uppercase tracking-widest flex items-center gap-3"> <CheckCircle2 size={16} /> Server Initialization </p>
                    <div className="p-6 bg-slate-800/50 rounded-3xl font-mono text-sm text-blue-200 leading-loose border border-white/5 shadow-inner">
                       git clone klencare-crm <br/>
                       npm install <br/>
                       npx prisma migrate deploy <br/>
                       npm run build <br/>
                       node dist/server.js
                    </div>
                 </div>
                 <div className="space-y-6">
                    <p className="text-[11px] font-black text-[#f97316] uppercase tracking-widest flex items-center gap-3"> <ShieldCheck size={16} /> PM2 Instance Mgmt </p>
                    <div className="p-6 bg-slate-800/50 rounded-3xl font-mono text-sm text-orange-200 leading-loose border border-white/5 shadow-inner">
                       pm2 start server.js --name klencare <br/>
                       pm2 set max_memory 2G <br/>
                       pm2 monit <br/>
                       pm2 save
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal - Production Ready with Safe Fallback */}
      {previewUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl h-[92vh] rounded-[48px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col border border-white/10">
             <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-blue-50 text-[#2563eb] rounded-2xl"><Eye size={24}/></div>
                   <div>
                      <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">Template Logic Verification</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Render Engine: jspdf-autotable @ 3.8.2</p>
                   </div>
                </div>
                <div className="flex gap-3">
                   {/* SAFE FALLBACK: If iframe is blocked by Chrome, users can force download */}
                   <button 
                     onClick={() => window.open(previewUrl)}
                     className="px-6 py-3 bg-[#2563eb] text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95"
                   >
                     <FileDown size={18}/> Force View / Download
                   </button>
                   <button 
                     onClick={() => setPreviewUrl(null)}
                     className="p-3 text-slate-400 hover:text-red-500 transition-colors bg-slate-100 rounded-2xl"
                   >
                     <X size={24} />
                   </button>
                </div>
             </div>
             <div className="flex-1 bg-slate-200/50 p-10 overflow-hidden relative">
                <iframe src={previewUrl} className="w-full h-full rounded-[32px] shadow-2xl bg-white border border-slate-300" title="PDF Preview" />
                <div className="absolute bottom-12 right-12 p-4 bg-white/80 backdrop-blur rounded-2xl border border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest pointer-events-none">
                   Live Preview Mode
                </div>
             </div>
             <div className="p-6 bg-blue-50 border-t border-blue-100 shrink-0 text-center">
                <p className="text-[11px] text-blue-700 font-black uppercase tracking-widest flex items-center justify-center gap-2">
                   <ShieldCheck size={14}/> Note: Chrome may block inline previews in some security contexts. Use "Force View" if blank.
                </p>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
