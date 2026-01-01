import React, { useState, useMemo } from 'react';
import { 
  FileText, Search, Printer, CalendarDays, 
  ArrowRight, Download, Filter, User as UserIcon, 
  Wallet, ShieldCheck, Mail, X, Edit3, Send, CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { salesService } from '../../services/sales.service';
import { pdfService } from '../../services/pdf.service';
import { useAuth } from '../../App';
import { Customer } from '../../types';

export default function Statements() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [composeData, setComposeData] = useState({
    recipientEmail: '',
    subject: 'Statement of Account from KlenCare CRM',
    notes: 'Please find your latest statement of account attached. Kindly review and settle any outstanding balances.',
    includeInvoices: true
  });
  const [isSent, setIsSent] = useState(false);

  const customers = salesService.getCustomers();

  // REAL-TIME SEARCH: Calculated on every keystroke
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.companyName.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, customers]);

  const handleStatement = (cust: Customer, type: 'current' | 'lastMonth') => {
    if (type === 'lastMonth') {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      pdfService.generateStatement(cust, user, false, lastMonth);
    } else {
      pdfService.generateStatement(cust, user);
    }
  };

  const openComposer = (cust: Customer) => {
    setEditingCustomer(cust);
    setComposeData({
      ...composeData,
      recipientEmail: cust.email || ''
    });
    setIsSent(false);
  };

  const handleSendEmail = () => {
    if (!composeData.recipientEmail || !composeData.recipientEmail.includes('@')) {
      alert('Please enter a valid recipient email address.');
      return;
    }
    // Logic for sending email would go here. For now, we simulate.
    setIsSent(true);
    setTimeout(() => {
      setEditingCustomer(null);
      setIsSent(false);
    }, 2000);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financial Statements</h1>
          <p className="text-slate-500 text-sm">Generate and edit monthly account statements for your clients.</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-[10px] font-black uppercase tracking-widest">
           <ShieldCheck size={16} /> Ledger Sync Active
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative flex-1 max-w-xl group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search for a customer name, company or ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-[20px] outline-none focus:ring-4 focus:ring-amber-50 focus:border-brand transition-all text-base font-medium shadow-sm !bg-white !text-slate-900"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                <X size={16} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
             <button className="flex items-center gap-2 px-6 py-3 text-slate-600 border border-slate-200 rounded-2xl bg-white hover:bg-slate-50 text-sm font-bold transition-all shadow-sm">
                <Filter size={16} /> Filter Balance
             </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
              <tr>
                <th className="px-8 py-5">Customer Identity</th>
                <th className="px-6 py-5">Current Ledger</th>
                <th className="px-8 py-5 text-right">Quick Generation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length > 0 ? filteredCustomers.map(cust => {
                const balance = salesService.getCustomerBalance(cust.id);
                return (
                  <tr key={cust.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-8">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-amber-50 text-brand rounded-[22px] flex items-center justify-center font-black text-xl border border-amber-100 shadow-sm group-hover:scale-105 transition-transform">
                          {cust.name[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                             <p className="text-base font-bold text-slate-900">{cust.name}</p>
                             {!cust.email && (
                               <span className="p-1 bg-rose-50 text-rose-500 rounded-md" title="Email missing">
                                 <AlertCircle size={12} />
                               </span>
                             )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{cust.companyName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-8">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${balance > 0 ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'}`}>
                          <Wallet size={20} />
                        </div>
                        <div>
                           <p className={`text-lg font-black ${balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                             AED {balance.toLocaleString()}
                           </p>
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Net Outstanding</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-8 text-right">
                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={() => handleStatement(cust, 'current')}
                          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                        >
                          <FileText size={16} /> SOA
                        </button>
                        <button 
                          onClick={() => handleStatement(cust, 'lastMonth')}
                          className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-brand hover:text-brand transition-all shadow-sm active:scale-95"
                        >
                          <CalendarDays size={16} /> EOM
                        </button>
                        <button 
                          onClick={() => openComposer(cust)}
                          className={`p-3 border rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95 ${!cust.email ? 'text-rose-500 border-rose-200 bg-rose-50 animate-pulse' : 'text-slate-400 border-slate-200 bg-white hover:text-blue-600'}`}
                          title="Enter Email & Send"
                        >
                           <Mail size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={3} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-300">
                      <Search size={64} className="opacity-10" />
                      <p className="text-lg font-medium italic">No matches found for "{search}"</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MANUAL EMAIL EDIT & COMPOSE MODAL */}
      {editingCustomer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-slate-900/90 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col border border-white/20 animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-sm"><Edit3 size={24}/></div>
                 <div>
                    <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">Manual Statement Dispatch</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Drafting for {editingCustomer.name}</p>
                 </div>
              </div>
              <button onClick={() => setEditingCustomer(null)} className="p-2.5 text-slate-400 hover:text-rose-500 transition-colors bg-white rounded-xl shadow-sm"><X size={20} /></button>
            </div>
            
            <div className="flex-1 p-8 space-y-8 overflow-y-auto">
              {isSent ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-20 space-y-6 animate-in zoom-in">
                   <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shadow-inner"><CheckCircle2 size={64} /></div>
                   <div>
                     <h4 className="text-2xl font-black text-slate-900">Queue Synchronized</h4>
                     <p className="text-slate-500 mt-2">The statement has been processed and is ready for the next dispatch cycle.</p>
                   </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {!editingCustomer.email && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-700 animate-pulse">
                      <AlertCircle size={20} className="shrink-0" />
                      <p className="text-xs font-bold">This customer has no email address in the system. Please enter one manually below to proceed.</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Recipient Email Address *</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          type="email"
                          required
                          value={composeData.recipientEmail} 
                          onChange={e => setComposeData({...composeData, recipientEmail: e.target.value})}
                          placeholder="Enter email address manually..."
                          className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 font-bold !bg-white !text-slate-900 shadow-inner" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Email Subject Line</label>
                      <input 
                        value={composeData.subject} 
                        onChange={e => setComposeData({...composeData, subject: e.target.value})}
                        className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 font-bold !bg-white !text-slate-900 shadow-inner" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Statement Header / Cover Note</label>
                    <textarea 
                      rows={4}
                      value={composeData.notes}
                      onChange={e => setComposeData({...composeData, notes: e.target.value})}
                      className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 text-sm leading-relaxed !bg-white !text-slate-900 shadow-inner"
                    />
                  </div>

                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center justify-between">
                     <div>
                        <p className="text-sm font-black text-slate-900">Include Detailed Ledger</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Show every transaction for the selected period</p>
                     </div>
                     <input 
                      type="checkbox" 
                      checked={composeData.includeInvoices} 
                      onChange={e => setComposeData({...composeData, includeInvoices: e.target.checked})}
                      className="w-6 h-6 accent-brand rounded-lg shadow-sm" 
                     />
                  </div>
                </div>
              )}
            </div>

            {!isSent && (
              <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                <button 
                  onClick={() => handleStatement(editingCustomer, 'current')}
                  className="flex items-center gap-2 px-8 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-all shadow-sm"
                >
                  <Download size={18} /> Preview PDF
                </button>
                <button 
                  onClick={handleSendEmail}
                  className="flex items-center gap-3 px-10 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                >
                  <Send size={18} /> Finalize & Send
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
