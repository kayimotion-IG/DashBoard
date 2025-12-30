
import React, { useState } from 'react';
import { 
  Building2, Save, Globe, Phone, Mail, 
  Settings as SettingsIcon, FileText, Image as ImageIcon,
  Database, Download, Upload, AlertCircle, Terminal,
  Server, ShieldCheck, CheckCircle2, FlaskConical, FileArchive, FileJson,
  Users, ShoppingCart, Truck, Boxes, Receipt, Package
} from 'lucide-react';
import { itemService } from '../services/item.service';
import { backupService } from '../services/backup.service';
import { AppSettings } from '../types';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AppSettings>(itemService.getSettings());
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [activeTab, setActiveTab] = useState<'profile' | 'system' | 'deployment'>('profile');

  const handleSave = () => {
    setSaveStatus('saving');
    itemService.updateSettings(settings);
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1000);
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
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Control Center</h1>
          <p className="text-slate-500 text-sm">System administration and organizational configuration.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saveStatus !== 'idle'}
          className={`flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-sm shadow-xl transition-all active:scale-95 ${
            saveStatus === 'saved' ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Changes Saved!' : <><Save size={18} /> Save Config</>}
        </button>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 mb-6">
        {[
          { id: 'profile', label: 'Organization Profile', icon: <Building2 size={16} /> },
          { id: 'system', label: 'System Maintenance', icon: <Database size={16} /> },
          { id: 'deployment', label: 'Deployment Guide', icon: <Server size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 ${
              activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'
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
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Name</label>
                  <input value={settings.companyName} onChange={e => setSettings({...settings, companyName: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 text-sm !bg-white !text-slate-900" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">VAT Registration #</label>
                  <input value={settings.vatNumber} onChange={e => setSettings({...settings, vatNumber: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 text-sm !bg-white !text-slate-900" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Physical Address</label>
                  <textarea value={settings.companyAddress} onChange={e => setSettings({...settings, companyAddress: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 text-sm h-20 !bg-white !text-slate-900" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><Download size={24} /></div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Backups & Data Safety</h3>
                  <p className="text-xs text-slate-500">Save your complete organizational records to your desktop.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="p-6 bg-slate-900 rounded-3xl text-white space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                     <Database size={24} className="text-blue-400" />
                     <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Server File</span>
                  </div>
                  <div>
                    <p className="text-lg font-black tracking-tight">Database Backup (.db)</p>
                    <p className="text-xs text-slate-400 leading-relaxed">Download the raw SQLite master database file containing all persistent records.</p>
                  </div>
                  <button onClick={() => backupService.downloadDbFile()} className="w-full py-3 bg-blue-600 rounded-xl text-xs font-black uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/50">Download Database</button>
                </div>

                <div className="p-6 bg-white border border-slate-200 rounded-3xl space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                     <FileArchive size={24} className="text-slate-600" />
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bundle</span>
                  </div>
                  <div>
                    <p className="text-lg font-black tracking-tight text-slate-900">Full System State</p>
                    <p className="text-xs text-slate-500 leading-relaxed">Download a complete snapshot including uploads, database, and configurations.</p>
                  </div>
                  <button onClick={() => backupService.downloadFullBackup()} className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-lg">Download Bundle</button>
                </div>
              </div>

              <div className="space-y-6 pt-6 border-t border-slate-100">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <FileJson size={14} /> Master Data CSV Exports
                 </h4>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <ExportButton label="Items Catalog" icon={<Package size={16}/>} onClick={() => backupService.exportItems()} />
                    <ExportButton label="Vendor Master" icon={<Truck size={16}/>} onClick={() => backupService.exportVendors()} />
                    <ExportButton label="Customer Master" icon={<Users size={16}/>} onClick={() => backupService.exportCustomers()} />
                    <ExportButton label="Sales Ledger" icon={<Receipt size={16}/>} onClick={() => backupService.exportInvoices()} />
                    <ExportButton label="Purchase Ledger" icon={<ShoppingCart size={16}/>} onClick={() => backupService.exportBills()} />
                    <ExportButton label="Stock History" icon={<Boxes size={16}/>} onClick={() => backupService.exportStockMoves()} />
                 </div>
              </div>

              <div className="mt-10 pt-8 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <FlaskConical size={20} className="text-blue-600" />
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">System Integrity Test</h4>
                  </div>
                  <button 
                    onClick={() => navigate('/health')}
                    className="flex items-center gap-2 px-8 py-2.5 bg-blue-50 text-blue-700 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-100 active:scale-95 transition-all border border-blue-100"
                  >
                    Run Logic Validation
                  </button>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">Validates linking between Inventory, AR, and AP modules by simulating a full transaction cycle with temporary test records.</p>
              </div>
            </div>

            <div className="bg-red-50 p-8 rounded-[32px] border border-red-100">
               <div className="flex items-center gap-3 text-red-700 mb-4">
                  <AlertCircle size={20} />
                  <h3 className="text-xs font-black uppercase tracking-widest">Emergency Safety Zone</h3>
               </div>
               <p className="text-sm text-red-600 mb-6 font-medium">Resetting local session data will log you out and clear browser-cached transactions. This does not affect the server database.</p>
               <button onClick={() => { if(confirm('Reset local cache and session?')) { localStorage.clear(); window.location.reload(); } }} className="px-8 py-3 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-red-200 hover:bg-red-700 transition-all">Clear Local Data</button>
            </div>
          </div>
        )}

        {activeTab === 'deployment' && (
          <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
            <div className="bg-slate-900 p-10 rounded-[40px] text-white shadow-2xl">
              <div className="flex items-center gap-4 mb-8">
                 <Terminal size={32} className="text-blue-400" />
                 <div>
                    <h3 className="text-2xl font-black tracking-tight">Deployment Strategy</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Enterprise Production Configuration</p>
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2"> <CheckCircle2 size={12} /> Backend Initialization </p>
                    <div className="p-5 bg-slate-800 rounded-2xl font-mono text-xs text-blue-200 leading-relaxed border border-slate-700">
                       npm install <br/>
                       npx prisma migrate deploy <br/>
                       npm run build <br/>
                       npm start
                    </div>
                 </div>
                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2"> <CheckCircle2 size={12} /> High Availability (PM2) </p>
                    <div className="p-5 bg-slate-800 rounded-2xl font-mono text-xs text-blue-200 leading-relaxed border border-slate-700">
                       pm2 start server.js --name klencare <br/>
                       pm2 save <br/>
                       pm2 startup
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
