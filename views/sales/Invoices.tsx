
import React, { useState } from 'react';
import { 
  Receipt, Search, Filter, Plus, 
  ArrowRight, FileDown, Link as LinkIcon
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
  const invoices = salesService.getInvoices().reverse();

  const handleDownload = (e: React.MouseEvent, inv: Invoice) => {
    e.stopPropagation();
    const customer = salesService.getCustomerById(inv.customerId);
    if (customer) {
      pdfService.generateInvoice(inv, customer, user);
    } else {
      alert('Customer record not found for this invoice.');
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const customer = salesService.getCustomerById(inv.customerId);
    const so = inv.soId ? salesService.getSOById(inv.soId) : null;
    return inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) || 
           customer?.name.toLowerCase().includes(search.toLowerCase()) ||
           so?.orderNumber.toLowerCase().includes(search.toLowerCase());
  });

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

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by INV #, Customer, or SO #..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl w-full outline-none text-sm bg-white !text-slate-900 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 text-slate-600 border border-slate-200 rounded-lg text-xs font-bold bg-white hover:bg-slate-50">
            <Filter size={14} /> Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Invoice Details</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Source Order</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4 text-right">Balance Due</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length > 0 ? filteredInvoices.map(inv => {
                const customer = salesService.getCustomerById(inv.customerId);
                const so = inv.soId ? salesService.getSOById(inv.soId) : null;
                
                return (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm">INV</div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{inv.invoiceNumber}</p>
                          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{new Date(inv.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-700">{customer?.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      {so ? (
                        <button 
                          onClick={(e) => { e.stopPropagation(); navigate(`/sales/orders/${so.id}`); }}
                          className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-black uppercase hover:bg-blue-50 hover:text-blue-600 transition-all border border-slate-200"
                        >
                          <LinkIcon size={10} /> {so.orderNumber}
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-300 font-bold uppercase">Direct</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-700">AED {inv.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-right">
                      <p className={`text-sm font-black ${inv.balanceDue > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        AED {inv.balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => handleDownload(e, inv)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Generate Tax Invoice PDF"
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
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Receipt size={40} className="opacity-20" />
                      <p className="text-sm italic">No invoices found.</p>
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
