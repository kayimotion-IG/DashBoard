
import React, { useState } from 'react';
import { 
  FileMinus, Search, Filter, Plus, 
  ArrowRight, FileDown, User as UserIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { salesService } from '../../services/sales.service';
import { pdfService } from '../../services/pdf.service';
import { useAuth } from '../../App';
import { CreditNote } from '../../types';

export default function CreditNotes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const creditNotes = salesService.getCreditNotes().reverse();

  const handleDownload = (e: React.MouseEvent, cn: CreditNote) => {
    e.stopPropagation();
    const customer = salesService.getCustomerById(cn.customerId);
    if (customer) {
      pdfService.generateCreditNote(cn, customer, user);
    }
  };

  const filteredCNs = creditNotes.filter(cn => {
    const customer = salesService.getCustomerById(cn.customerId);
    return cn.creditNoteNumber.toLowerCase().includes(search.toLowerCase()) || 
           customer?.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Credit Notes</h1>
          <p className="text-slate-500 text-sm">Issue returns and credit adjustments to customers.</p>
        </div>
        <button 
          onClick={() => navigate('/sales/credit-notes/new')}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#f97316] text-white rounded-xl hover:bg-orange-700 font-bold text-sm shadow-xl transition-all"
        >
          <Plus size={18} />
          New Credit Note
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by CN # or Customer..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl w-full outline-none text-sm bg-white"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 text-slate-600 border border-slate-200 rounded-lg text-xs font-bold bg-white">
            <Filter size={14} /> Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white text-[10px] font-black text-slate-500 uppercase tracking-widest border-b">
              <tr>
                <th className="px-6 py-4">CN Details</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCNs.length > 0 ? filteredCNs.map(cn => {
                const customer = salesService.getCustomerById(cn.customerId);
                return (
                  <tr key={cn.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center font-bold text-xs">CN</div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{cn.creditNoteNumber}</p>
                          <p className="text-[10px] text-slate-500 uppercase font-black">{new Date(cn.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-700">{customer?.name}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 italic">{cn.reason}</td>
                    <td className="px-6 py-4 text-right font-black text-rose-600">AED {cn.amount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-[10px] font-black uppercase">Open</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => handleDownload(e, cn)}
                          className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                        >
                          <FileDown size={18} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-slate-900 transition-all"><ArrowRight size={18} /></button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic">No credit notes issued.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
