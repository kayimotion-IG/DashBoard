
import React, { useState } from 'react';
import { Database, Download, Server, ArrowLeft, Activity, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../services/api';

export default function Backup() {
  const navigate = useNavigate();
  const [migrating, setMigrating] = useState(false);

  const migrateLegacyData = async () => {
    setMigrating(true);
    const legacyItems = JSON.parse(localStorage.getItem('klencare_items') || '[]');
    const legacyCustomers = JSON.parse(localStorage.getItem('klencare_customers') || '[]');
    
    try {
      await apiRequest('POST', '/api/migrate', { items: legacyItems, customers: legacyCustomers });
      alert('Legacy browser data successfully migrated to SQLite Database.');
    } catch (err) {
      alert('Migration failed: ' + err.message);
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-slate-900">Database & Migration</h1>
        <button onClick={() => navigate('/settings')} className="p-2 border rounded-xl"><ArrowLeft/></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 p-8 rounded-[32px] text-white">
          <Database size={32} className="text-blue-400 mb-4" />
          <h3 className="text-xl font-bold mb-2">Download Master DB</h3>
          <p className="text-sm text-slate-400 mb-6">Downloads the actual "dev.db" file from the server.</p>
          <a href="/admin/backup/db" className="block text-center py-3 bg-blue-600 rounded-xl font-bold">Download SQLite File</a>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-200">
          <Zap size={32} className="text-amber-500 mb-4" />
          <h3 className="text-xl font-bold mb-2">Sync Browser Data</h3>
          <p className="text-sm text-slate-500 mb-6">One-time tool to move data from your browser cache into the permanent SQLite database.</p>
          <button 
            onClick={migrateLegacyData}
            disabled={migrating}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold disabled:opacity-50"
          >
            {migrating ? 'Syncing...' : 'Migrate Browser -> DB'}
          </button>
        </div>
      </div>
    </div>
  );
}
