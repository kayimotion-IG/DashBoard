import React, { useState } from 'react';
import { Activity, ShieldCheck, Database, RefreshCw, CheckCircle2, XCircle, Server, Wifi } from 'lucide-react';
import { apiRequest } from '../services/api';

export default function Health() {
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<any>(null);

  const runTest = async () => {
    setRunning(true);
    try {
      const data = await apiRequest('POST', '/admin/system-test/run');
      setReport(data.report);
    } catch (err) {
      alert('System Check Failed: ' + err.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-200">
          <Activity size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Health & Logic</h1>
          <p className="text-slate-500 font-medium">Verifying SQLite Single Source of Truth connectivity.</p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-2xl overflow-hidden p-8">
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-2">
             <Server size={18} className="text-slate-400" />
             <span className="text-xs font-black uppercase tracking-widest text-slate-900">Diagnostic Engine</span>
           </div>
           <button 
             onClick={runTest}
             disabled={running}
             className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center gap-2"
           >
             {running ? <RefreshCw size={16} className="animate-spin" /> : 'Run Smoke Test'}
           </button>
        </div>

        {report ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Database Status</p>
              <div className="flex items-center gap-2 text-emerald-600 font-bold">
                <Wifi size={16} /> {report.database}
              </div>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Write Integrity</p>
              <div className={`font-bold ${report.write_test === 'PASS' ? 'text-emerald-600' : 'text-red-600'}`}>
                {report.write_test}
              </div>
            </div>
            <div className="p-6 bg-slate-900 rounded-2xl text-white col-span-2">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Storage Path Proof</p>
              <code className="text-xs break-all">{report.persistence_path}</code>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-slate-400 italic">
            Awaiting logic validation...
          </div>
        )}
      </div>
    </div>
  );
}
