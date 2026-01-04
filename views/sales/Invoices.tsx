
import React, { useState, useMemo } from 'react';
import { 
  Receipt, Search, Filter, Plus, 
  ArrowRight, FileDown, Link as LinkIcon, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { salesService } from '../../services/sales.service';
import { pdfService } from '../../services/pdf.service';
import { useAuth } from '../../App';
import { Invoice } from '../../types';

const StatusBadge = ({ status }: { status: string }) => {
  const styles: any = {
    Draft: 'bg-slate-100 text-slate-600 border-slate-200',
    Sent: 'bg-blue-50 text-blue-700 border-blue-100',
    'Partially Paid': 'bg-amber-50 text-amber-700 border-amber-100',
    Paid: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    Voided: 'bg-red-50 text-red-700 border-red-100',
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${styles[status] || styles.Draft}`}>
      {status}
    </span>
  );
};

export default function Invoices() {
  const navigate = useNavigate();
  const { user, can } = useAuth();
  const [search, setSearch] = useState('');
  
  const invoices = salesService.getInvoices();

  const filteredInvoices = useMemo(() => {
    const sorted = [...invoices].reverse();
    if (!search) return sorted;
    
    const s = search.toLowerCase();
    return sorted.filter(inv => {
      const customer = salesService.getCustomerById(inv.customerId);
      const so = inv.soId ? salesService.getSOById(inv.soId) : null;
      return inv.invoiceNumber.toLowerCase().includes(s) || 
             customer?.name.toLowerCase().includes(s) ||
             customer?.companyName?.toLowerCase().includes(s) ||
             so?.orderNumber.toLowerCase().includes(s);
    });
  }, [search, invoices]);

  const handleDownload = (e: React.MouseEvent, inv: Invoice) => {
    e.stopPropagation();
    const customer = salesService.getCustomerById(inv.customerId);
    if (customer) {
      pdfService.generateInvoice(inv, customer, user);
    } else {
      alert('Customer record not found for this invoice.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tax Invoices</h1>
          <p className="text-slate-500 text-sm">Official financial billing records with VAT compliance.</p>
        </div>
        {can('sales.create') && (
          <button 
            onClick={() => navigate('/sales/invoices/new')}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-sm shadow-xl active:scale-95 transition-all"
          >
            <Plus size={18} />
            New Invoice
          </button>
        )}
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-lg group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Live search by INV #, Customer, or SO #..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 pr-10 py-3.5 border border-slate-200 rounded-[20px] w-full outline-none text-sm bg-white !text-slate-900 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all font-medium"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button className="flex items-center gap-2 px-6 py-3 text-slate-600 border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest bg-white hover:bg-slate-50 transition-all shadow-sm">
            <Filter size={16} /> Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
              <tr>
                <th className="px-8 py-5">Invoice Details</th>
                <th className="px-6 py-5">Customer</th>
                <th className="px-6 py-5">Source Order</th>
                <th className="px-6 py-5 text-right">Total</th>
                <th className="px-6 py-5 text-right">Balance Due</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-8 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length > 0 ? filteredInvoices.map(inv => {
                const customer = salesService.getCustomerById(inv.customerId);
                const so = inv.soId ? salesService.getSOById(inv.soId) : null;
                
                return (
                  <tr 
                    key={inv.id} 
                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/sales/invoices/view/${inv.id}`)}
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-[18px] flex items-center justify-center font-black text-xs shadow-sm group-hover:scale-105 transition-transform">INV</div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{inv.invoiceNumber}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-0.5">{new Date(inv.date).toLocaleDateString('en-GB')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <p className="text-xs font-bold text-slate-700">{customer?.name}</p>
                    </td>
                    <td className="px-6 py-6">
                      {so ? (
                        <button 
                          onClick={(e) => { e.stopPropagation(); navigate(`/sales/orders/${so.id}`); }}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase hover:bg-blue-50 hover:text-blue-600 transition-all border border-slate-200"
                        >
                          <LinkIcon size={10} /> {so.orderNumber}
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest italic">Direct</span>
                      )}
                    </td>
                    <td className="px-6 py-6 text-right font-black text-slate-900">AED {inv.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-6 text-right">
                      <p className={`text-sm font-black ${inv.balanceDue > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        AED {inv.balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </td>
                    <td className="px-6 py-6">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={(e) => handleDownload(e, inv)}
                          className="p-3 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-md border border-transparent hover:border-slate-100 rounded-xl transition-all"
                          title="Download Tax Invoice"
                        >
                          <FileDown size={18} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); navigate(`/sales/invoices/view/${inv.id}`); }}
                          className="p-3 text-slate-400 hover:text-slate-900 hover:bg-white hover:shadow-md border border-transparent hover:border-slate-100 rounded-xl transition-all"
                        >
                          <ArrowRight size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-300">
                      <Receipt size={64} className="opacity-10" />
                      <p className="text-sm font-medium italic">No results found for "{search}"</p>
                    </div>
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
