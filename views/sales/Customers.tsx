
import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Plus, Mail, Phone, 
  Edit2, Trash2, Wallet, FileText,
  ChevronRight, CalendarDays, Printer, RefreshCw, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { salesService } from '../../services/sales.service';
import { pdfService } from '../../services/pdf.service';
import { useAuth } from '../../App';

export default function Customers() {
  const navigate = useNavigate();
  const { user, can } = useAuth();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState(salesService.getCustomers());

  const fetchData = async () => {
    setLoading(true);
    await salesService.refresh();
    setCustomers(salesService.getCustomers());
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.companyName.toLowerCase().includes(search.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    setLoading(true);
    await salesService.deleteCustomer(id, user!);
    await fetchData();
  };

  const handleDownloadStatement = (cust: any, monthly = false) => {
    if (monthly) {
      const today = new Date();
      pdfService.generateStatement(cust, user, false, today);
    } else {
      pdfService.generateStatement(cust, user);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customer Directory</h1>
          <p className="text-slate-500 text-sm">Managing ledger-linked accounts for official billing.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchData}
            className="p-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-all"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          {can('sales.create') && (
            <button 
              onClick={() => navigate('/sales/customers/new')}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#fbaf0f] text-slate-900 rounded-xl hover:bg-[#e59b00] font-bold text-sm shadow-xl active:scale-95 transition-all"
            >
              <Plus size={18} />
              Add New Customer
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by name, company or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl w-full outline-none focus:ring-2 focus:ring-amber-100 text-sm !bg-white !text-slate-900"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading && customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
               <Loader2 className="animate-spin mb-4" size={40} />
               <p className="font-bold">Synchronizing with Database...</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-white text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Customer Identity</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4 text-right">Outstanding (AED)</th>
                  <th className="px-6 py-4">Quick Statements</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-24 text-center text-slate-300 italic">
                       No customers found. Click "Add New Customer" to begin.
                    </td>
                  </tr>
                )}
                {filteredCustomers.map(cust => {
                  const balance = salesService.getCustomerBalance(cust.id);
                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{cust.name}</p>
                          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{cust.companyName || 'Private Account'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {cust.email && <div className="flex items-center gap-2 text-xs text-slate-600"><Mail size={12} className="text-slate-400" />{cust.email}</div>}
                          {cust.phone && <div className="flex items-center gap-2 text-xs text-slate-600"><Phone size={12} className="text-slate-400" />{cust.phone}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Wallet size={14} className={balance > 0 ? 'text-amber-500' : 'text-emerald-500'} />
                          <span className={`text-sm font-black ${balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleDownloadStatement(cust, true)} className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-[10px] font-black uppercase hover:bg-amber-100 transition-all">EOM</button>
                          <button onClick={() => handleDownloadStatement(cust, false)} className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-[10px] font-black uppercase hover:bg-blue-100 transition-all">SOA</button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => navigate(`/sales/customers/edit/${cust.id}`)} className="p-2 text-slate-400 hover:text-brand hover:bg-amber-50 rounded-lg transition-all"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(cust.id, cust.name)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
