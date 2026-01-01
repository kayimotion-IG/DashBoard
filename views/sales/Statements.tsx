
import React, { useState } from 'react';
import { 
  FileText, Search, Printer, CalendarDays, 
  ArrowRight, Download, Filter, User as UserIcon, 
  Wallet, ShieldCheck, Mail
} from 'lucide-react';
import { salesService } from '../../services/sales.service';
import { pdfService } from '../../services/pdf.service';
import { useAuth } from '../../App';
import { Customer } from '../../types';

export default function Statements() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const customers = salesService.getCustomers();

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.companyName.toLowerCase().includes(search.toLowerCase())
  );

  const handleStatement = (cust: Customer, type: 'current' | 'lastMonth') => {
    if (type === 'lastMonth') {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      pdfService.generateStatement(cust, user, false, lastMonth);
    } else {
      pdfService.generateStatement(cust, user);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financial Statements</h1>
          <p className="text-slate-500 text-sm">Generate monthly account statements for printing or email.</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-[10px] font-black uppercase tracking-widest">
           <ShieldCheck size={16} /> Ledger Sync Active
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search for a customer..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-amber-50 focus:border-[#fbaf0f] transition-all text-sm font-medium"
            />
          </div>
          <div className="flex items-center gap-3">
             <button className="flex items-center gap-2 px-4 py-2 text-slate-600 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-xs font-bold transition-all">
                <Filter size={14} /> Filter Balance
             </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white text-[10px] font-black text-slate-500 uppercase tracking-widest border-b">
              <tr>
                <th className="px-8 py-4">Customer Identity</th>
                <th className="px-6 py-4">Financial Status</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length > 0 ? filteredCustomers.map(cust => {
                const balance = salesService.getCustomerBalance(cust.id);
                return (
                  <tr key={cust.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-50 text-[#fbaf0f] rounded-2xl flex items-center justify-center font-black text-lg border border-amber-100">
                          {cust.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{cust.name}</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">{cust.companyName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2">
                        <Wallet size={16} className={balance > 0 ? 'text-amber-500' : 'text-emerald-500'} />
                        <div>
                           <p className={`text-sm font-black ${balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                             AED {balance.toLocaleString()}
                           </p>
                           <p className="text-[10px] text-slate-400 font-bold uppercase">Outstanding Ledger</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={() => handleStatement(cust, 'current')}
                          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                        >
                          <FileText size={14} /> Current
                        </button>
                        <button 
                          onClick={() => handleStatement(cust, 'lastMonth')}
                          className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-amber-400 hover:text-amber-600 transition-all shadow-sm active:scale-95"
                        >
                          <CalendarDays size={14} /> Last Month
                        </button>
                        <button className="p-2.5 text-slate-400 hover:text-blue-600 bg-slate-50 rounded-xl transition-all">
                           <Mail size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={3} className="px-8 py-20 text-center text-slate-400 italic font-medium">
                    No customers found. Try searching for a different name.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
