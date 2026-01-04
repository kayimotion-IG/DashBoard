
import React, { useState, useEffect } from 'react';
import { 
  MailCheck, Search, Filter, Mail, Clock, 
  User as UserIcon, Calendar, ArrowRight, 
  ExternalLink, Loader2, RefreshCw, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../services/api';

export default function CommunicationsLog() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('GET', '/api/communications');
      setLogs(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.recipient.toLowerCase().includes(search.toLowerCase()) ||
    log.subject.toLowerCase().includes(search.toLowerCase()) ||
    log.entityId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Communication Dispatch Center</h1>
          <p className="text-slate-500 text-sm">Verify system-wide email delivery and outgoing communications.</p>
        </div>
        <button 
          onClick={fetchLogs}
          disabled={loading}
          className="p-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-all"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-lg group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search by recipient, subject, or ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 pr-10 py-3.5 border border-slate-200 rounded-[20px] w-full outline-none text-sm bg-white !text-slate-900 focus:ring-4 focus:ring-blue-50 transition-all font-medium"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 text-slate-400">
              <Loader2 className="animate-spin mb-4" size={40} />
              <p className="font-bold uppercase text-[10px] tracking-widest">Querying Dispatch Records...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-slate-300 italic">
              <MailCheck size={64} className="opacity-10 mb-4" />
              <p>No dispatch logs found.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-white text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                <tr>
                  <th className="px-8 py-5">Recipient & ID</th>
                  <th className="px-6 py-5">Subject Header</th>
                  <th className="px-6 py-5">Sent Timestamp</th>
                  <th className="px-6 py-5">Dispatch By</th>
                  <th className="px-8 py-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-[18px] flex items-center justify-center shadow-sm">
                           <Mail size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{log.recipient}</p>
                          <p className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase mt-0.5">{log.entityType}: {log.entityId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <p className="text-xs font-bold text-slate-700 truncate max-w-[200px]">{log.subject}</p>
                    </td>
                    <td className="px-6 py-6">
                       <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Calendar size={14} className="text-slate-300"/>
                          {new Date(log.timestamp).toLocaleDateString()}
                          <Clock size={14} className="text-slate-300 ml-1"/>
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </div>
                    </td>
                    <td className="px-6 py-6">
                       <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase">
                          <UserIcon size={14} className="text-slate-400"/>
                          {log.sentBy}
                       </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-widest">
                          {log.status}
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
