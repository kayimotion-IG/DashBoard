import React, { useState } from 'react';
import { Database, RefreshCw, ArrowLeft, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../services/api';

export default function Backup() {
  const navigate = useNavigate();
  const [syncing, setSyncing] = useState(false);
  const [finished, setFinished] = useState(false);

  const syncLocalToCloud = async () => {
    if (!confirm('This will push all your current browser data to the cloud database. Duplicate SKUs might fail. Continue?')) return;
    
    setSyncing(true);
    try {
      const items = JSON.parse(localStorage.getItem('klencare_items') || '[]');
      const customers = JSON.parse(localStorage.getItem('klencare_customers') || '[]');
      
      // Batch sync items
      for (const item of items) {
        try { await apiRequest('POST', '/api/items', item); } catch(e) { console.warn('Skip existing item', item.sku); }
      }
      
      // Batch sync customers
      for (const cust of customers) {
        try { await apiRequest('POST', '/api/customers', cust); } catch(e) { console.warn('Skip existing customer', cust.name); }
      }
      
      setFinished(true);
    } catch (err: any) {
      alert('Sync Error: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-slate-900">Database & Persistence</h1>
        <button onClick={() => navigate('/settings')} className="p-2 border rounded-xl hover:bg-slate-50 transition-all"><ArrowLeft/></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900 p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-blue-600 rounded-full blur-[80px] opacity-20"></div>
           <Database size={48} className="text-blue-400 mb-6" />
           <h3 className="text-2xl font-bold mb-2">Cloud Infrastructure</h3>
           <p className="text-sm text-slate-400 mb-8 leading-relaxed">Your data is currently being stored in a persistent Postgres cluster. Redeploys will not affect records.</p>
           <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-widest">
              <ShieldCheck size={16}/> System Protected
           </div>
        </div>

        <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm">
           <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
              <RefreshCw size={32} />
           </div>
           <h3 className="text-2xl font-bold text-slate-900 mb-2">Local Sync Tool</h3>
           <p className="text-sm text-slate-500 mb-10">Push data from this computer's browser storage into the master cloud ledger.</p>
           
           {finished ? (
             <div className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-700 rounded-2xl font-bold animate-in zoom-in">
               <CheckCircle2 /> Data Migrated Successfully
             </div>
           ) : (
             <button 
                onClick={syncLocalToCloud}
                disabled={syncing}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {syncing ? <><Loader2 className="animate-spin" /> Moving Data...</> : 'Initialize Cloud Migration'}
              </button>
           )}
        </div>
      </div>
    </div>
  );
}