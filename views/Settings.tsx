
import React, { useState } from 'react';
import { 
  Building2, Save, Globe, Phone, Mail, 
  Settings as SettingsIcon, FileText, Image as ImageIcon,
  Database, Download, Upload, AlertCircle, Terminal,
  Server, ShieldCheck, CheckCircle2, FlaskConical, FileArchive, FileJson,
  Users, ShoppingCart, Truck, Boxes, Receipt, Package, Eye, X, FileDown,
  RefreshCw
} from 'lucide-react';
import { itemService } from '../services/item.service';
import { backupService } from '../services/backup.service';
import { pdfService } from '../services/pdf.service';
import { AppSettings } from '../types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

export default function Settings() {
  const { refreshSettings } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(itemService.getSettings());
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [activeTab, setActiveTab] = useState<'profile' | 'templates' | 'system' | 'deployment'>('profile');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleSave = () => {
    setSaveStatus('saving');
    itemService.updateSettings(settings);
    refreshSettings();
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1000);
  };

  const showPreview = async (type: 'INV' | 'SO' | 'PO' | 'ST' | 'CN') => {
    const dummyCust = { 
      id: 'DUMMY', 
      name: 'Acme International UAE', 
      companyName: 'Acme General Trading LLC', 
      billingAddress: 'Business Bay, Dubai, UAE', 
      shippingAddress: 'Business Bay, Dubai, UAE', 
      email: 'accounts@acme.ae', 
      phone: '+971 4 555 1234', 
      currency: 'AED', 
      status: 'Active' as const, 
      createdAt: new Date().toISOString() 
    };
    const dummyVendor = { id: 'VND', name: 'Global Logistics', companyName: 'Global Logistics & Supply', email: 'shipments@global.com', phone: '+971 4 222 3333', currency: 'AED', address: 'DIP 2, Dubai, UAE', status: 'Active' as const, createdAt: new Date().toISOString() };
    
    let url: any = '';
    if (type === 'INV') {
      url = await pdfService.generateInvoice({ id: '1', invoiceNumber: 'INV-SAMPLE-001', customerId: 'DUMMY', date: new Date().toISOString(), dueDate: new Date().toISOString(), total: 1050, balanceDue: 1050, status: 'Sent', lines: [{ id: '1', itemId: '1', itemName: 'Premium Industrial Solution', quantity: 1, rate: 1000, taxAmount: 50, total: 1050 }] }, dummyCust, null, true);
    } else if (type === 'SO') {
      url = await pdfService.generateSalesOrder({ id: '1', orderNumber: 'SO-SAMPLE-001', customerId: 'DUMMY', date: new Date().toISOString(), status: 'Confirmed', subTotal: 1000, taxTotal: 50, total: 1050, lines: [{ id: '1', itemId: '1', itemName: 'Batch Stock Item X-01', quantity: 1, rate: 1000, taxAmount: 50, total: 1050 }] }, dummyCust, null, true);
    } else if (type === 'PO') {
      url = await pdfService.generatePurchaseOrder({ id: '1', poNumber: 'PO-SAMPLE-001', vendorId: 'VND', date: new Date().toISOString(), status: 'Issued', total: 5000, lines: [{ id: '1', itemId: '1', itemName: 'Bulk Warehouse Order', quantity: 50, rate: 100, total: 5000 }] }, dummyVendor, null, true);
    } else if (type === 'ST') {
      url = await pdfService.generateStatement(dummyCust, null, true);
    } else if (type === 'CN') {
      url = await pdfService.generateCreditNote({ id: '1', creditNoteNumber: 'CN-SAMPLE-001', customerId: 'DUMMY', date: new Date().toISOString(), amount: 200, status: 'Open', reason: 'Customer Credit' }, dummyCust, null, true);
    }
    setPreviewUrl(url ? url.toString() : null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Control Center</h1>
          <p className="text-slate-500 text-sm">Professional organization data and brand assets.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saveStatus !== 'idle'}
          className={`flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-sm shadow-xl transition-all active:scale-95 ${
            saveStatus === 'saved' ? 'bg-emerald-50 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          {saveStatus === 'saving' ? 'Syncing...' : saveStatus === 'saved' ? 'Success!' : <><Save size={18} /> Commit Configuration</>}
        </button>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 mb-6 overflow-x-auto">
        {[
          { id: 'profile', label: 'Identity Profile', icon: <Building2 size={16} /> },
          { id: 'templates', label: 'PDF Templates', icon: <FileText size={16} /> },
          { id: 'system', label: 'Data Management', icon: <Database size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab.id ? 'border-[#fbaf0f] text-[#fbaf0f]' : 'border-transparent text-slate-400 hover:text-slate-600'
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
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Display Name</label>
                  <input value={settings.companyName} onChange={e => setSettings({...settings, companyName: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-amber-50 text-sm font-bold" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Brand Logo (Cloudinary URL)</label>
                  <div className="flex gap-4 items-center">
                    <div className="flex-1 relative">
                       <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                       <input value={settings.logoUrl || ''} onChange={e => setSettings({...settings, logoUrl: e.target.value})} className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-amber-50 text-sm font-mono" placeholder="https://res.cloudinary.com/..." />
                    </div>
                    {settings.logoUrl && (
                      <div className="group relative">
                        <img src={settings.logoUrl} alt="Logo Preview" className="h-12 w-auto bg-slate-50 rounded-lg p-1 border shadow-inner" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
                      </div>
                    )}
                  </div>
                  <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-tight">System supports direct Cloudinary & ImgBB links. For PDF clarity, use transparent PNGs.</p>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Registered Office</label>
                  <textarea value={settings.companyAddress} onChange={e => setSettings({...settings, companyAddress: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-amber-50 text-sm h-24" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-10">
               <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-amber-50 text-[#fbaf0f] rounded-2xl flex items-center justify-center border border-amber-100">
                      <FileText size={28} />
                    </div>
                    <div>
                      <h3 className="text-base font-black uppercase tracking-widest text-slate-900">Document Branding Engine</h3>
                      <p className="text-xs text-slate-500 font-medium">Render live previews with your Cloudinary logo and brand color (#fbaf0f).</p>
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                    { id: 'INV', label: 'Tax Invoice', icon: <Receipt size={22} />, color: 'bg-[#fbaf0f] text-slate-900' },
                    { id: 'SO', label: 'Sales Order', icon: <ShoppingCart size={22} />, color: 'bg-indigo-600 text-white' },
                    { id: 'PO', label: 'Purchase Order', icon: <Truck size={22} />, color: 'bg-rose-600 text-white' },
                    { id: 'ST', label: 'Monthly Statement', icon: <Users size={22} />, color: 'bg-emerald-600 text-white' },
                  ].map(tpl => (
                    <div key={tpl.id} className="p-8 border border-slate-200 rounded-[28px] hover:border-amber-400 hover:shadow-2xl transition-all group bg-slate-50/20">
                       <div className="flex items-center justify-between mb-6">
                          <div className={`p-4 rounded-2xl ${tpl.color} shadow-lg`}>{tpl.icon}</div>
                       </div>
                       <h4 className="text-sm font-black text-slate-900 mb-8">{tpl.label}</h4>
                       <button 
                         onClick={() => showPreview(tpl.id as any)}
                         className="w-full flex items-center justify-center gap-3 py-3.5 bg-white text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest border-2 border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm"
                       >
                         <Eye size={16} /> Open Preview
                       </button>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}
      </div>

      {previewUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-sm">
          <div className="bg-white w-full max-w-5xl h-[92vh] rounded-[48px] shadow-2xl overflow-hidden flex flex-col border border-white/10">
             <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-amber-50 text-[#fbaf0f] rounded-2xl"><Eye size={24}/></div>
                   <div>
                      <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">System Template Render</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Powered by KlenCare PDF Engine</p>
                   </div>
                </div>
                <button onClick={() => setPreviewUrl(null)} className="p-3 text-slate-400 hover:text-red-500 transition-colors bg-slate-50 rounded-2xl"><X size={24} /></button>
             </div>
             <div className="flex-1 bg-slate-100 p-8 overflow-hidden">
                <iframe src={previewUrl} className="w-full h-full rounded-[24px] shadow-2xl bg-white border border-slate-300" title="PDF Preview" />
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
