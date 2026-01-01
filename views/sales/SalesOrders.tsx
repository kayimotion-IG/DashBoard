
import React, { useState, useMemo } from 'react';
import { 
  ShoppingCart, Search, Filter, Plus, 
  Calendar, ArrowRight, CheckCircle2, Package, Truck, Receipt, Check,
  Link as LinkIcon, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { salesService } from '../../services/sales.service';
import { useAuth } from '../../App';

const StatusBadge = ({ status }: { status: string }) => {
  const styles: any = {
    Draft: 'bg-slate-100 text-slate-600 border-slate-200',
    Confirmed: 'bg-blue-50 text-blue-700 border-blue-100',
    Packed: 'bg-amber-50 text-amber-700 border-amber-100',
    Shipped: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    Invoiced: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    Closed: 'bg-slate-900 text-white border-slate-900',
  };
  
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${styles[status]}`}>
      {status}
    </span>
  );
};

export default function SalesOrders() {
  const navigate = useNavigate();
  const { user, can } = useAuth();
  const [search, setSearch] = useState('');
  
  const orders = salesService.getSalesOrders();
  const allInvoices = salesService.getInvoices();

  const handleQuickConfirm = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Authorize and Confirm this Sales Order?')) {
      salesService.updateSOStatus(id, 'Confirmed', user);
    }
  };

  // REAL-TIME SEARCH: Optimized via useMemo
  const filteredOrders = useMemo(() => {
    const sorted = [...orders].reverse();
    if (!search) return sorted;
    
    const s = search.toLowerCase();
    return sorted.filter(so => {
      const customer = salesService.getCustomerById(so.customerId);
      return so.orderNumber.toLowerCase().includes(s) || 
             customer?.name.toLowerCase().includes(s) ||
             customer?.companyName?.toLowerCase().includes(s);
    });
  }, [search, orders]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales Orders</h1>
          <p className="text-slate-500 text-sm">Convert quotes to orders and manage fulfillment.</p>
        </div>
        <button 
          onClick={() => navigate('/sales/orders/new')}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-sm shadow-xl active:scale-95 transition-all"
        >
          <Plus size={18} />
          New Sales Order
        </button>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-lg group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search by SO #, client, or company..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 pr-10 py-3.5 border border-slate-200 rounded-[20px] w-full outline-none text-sm bg-white !text-slate-900 focus:ring-4 focus:ring-blue-50 transition-all font-medium shadow-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                <X size={16} />
              </button>
            )}
          </div>
          <button className="flex items-center gap-2 px-6 py-3 text-slate-600 border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest bg-white hover:bg-slate-50 shadow-sm transition-all">
            <Filter size={16} /> Filter Status
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-50">
              <tr>
                <th className="px-8 py-5">Order Details</th>
                <th className="px-6 py-5">Customer</th>
                <th className="px-6 py-5 text-center">Invoice Ref</th>
                <th className="px-6 py-5 text-right">Total Amount</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-8 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length > 0 ? filteredOrders.map(so => {
                const customer = salesService.getCustomerById(so.customerId);
                const linkedInvoice = allInvoices.find(inv => inv.soId === so.id);
                
                return (
                  <tr 
                    key={so.id} 
                    onClick={() => navigate(`/sales/orders/${so.id}`)}
                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-[18px] flex items-center justify-center font-black text-xs shadow-sm group-hover:scale-105 transition-transform">
                          SO
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{so.orderNumber}</p>
                          <p className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase mt-0.5">{new Date(so.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <p className="text-xs font-bold text-slate-700">{customer?.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{customer?.companyName}</p>
                    </td>
                    <td className="px-6 py-6 text-center">
                      {linkedInvoice ? (
                        <span className="text-[10px] font-black text-emerald-600 uppercase flex items-center justify-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                          <Receipt size={12} /> {linkedInvoice.invoiceNumber}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-300 font-bold uppercase italic">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-6 text-right">
                      <p className="text-sm font-black text-slate-900">AED {so.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </td>
                    <td className="px-6 py-6">
                      <StatusBadge status={so.status} />
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {so.status === 'Draft' && can('sales.approve') && (
                          <button 
                            onClick={(e) => handleQuickConfirm(e, so.id)}
                            className="p-3 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                            title="Quick Confirm"
                          >
                            <Check size={20} />
                          </button>
                        )}
                        <button 
                          className="p-3 text-slate-400 group-hover:text-blue-600 group-hover:bg-white rounded-xl shadow-none group-hover:shadow-md transition-all"
                        >
                          <ArrowRight size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-300">
                      <ShoppingCart size={64} className="opacity-10" />
                      <p className="text-sm font-medium italic">No sales orders found for "{search}"</p>
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
