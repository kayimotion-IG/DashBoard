
import React, { useState } from 'react';
import { 
  ShoppingCart, Search, Filter, Plus, 
  Calendar, ArrowRight, CheckCircle2, Package, Truck, Receipt, Check,
  Link as LinkIcon
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
  const [refresh, setRefresh] = useState(0);
  
  const orders = salesService.getSalesOrders().reverse();
  const allInvoices = salesService.getInvoices();

  const handleQuickConfirm = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Authorize and Confirm this Sales Order?')) {
      salesService.updateSOStatus(id, 'Confirmed', user);
      setRefresh(prev => prev + 1);
    }
  };

  const filteredOrders = orders.filter(so => {
    const customer = salesService.getCustomerById(so.customerId);
    return so.orderNumber.toLowerCase().includes(search.toLowerCase()) || 
           customer?.name.toLowerCase().includes(search.toLowerCase());
  });

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

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by SO number or customer..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl w-full outline-none text-sm !bg-white !text-slate-900 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-3 py-1.5 text-slate-600 border border-slate-200 rounded-lg text-xs font-bold bg-white hover:bg-slate-50">
              <Filter size={14} /> Filter Status
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Order Details</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4 text-center">Invoice Ref</th>
                <th className="px-6 py-4 text-right">Total Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
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
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                          <ShoppingCart size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{so.orderNumber}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{new Date(so.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-700">{customer?.name}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {linkedInvoice ? (
                        <span className="text-[10px] font-black text-emerald-600 uppercase flex items-center justify-center gap-1">
                          <Receipt size={12} /> {linkedInvoice.invoiceNumber}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-300 font-bold uppercase italic">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-black text-slate-900">AED {so.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={so.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {so.status === 'Draft' && can('sales.approve') && (
                          <button 
                            onClick={(e) => handleQuickConfirm(e, so.id)}
                            className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                            title="Quick Confirm"
                          >
                            <Check size={18} />
                          </button>
                        )}
                        <button 
                          className="p-2 text-slate-400 hover:text-blue-600 transition-all"
                        >
                          <ArrowRight size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <ShoppingCart size={40} className="opacity-20" />
                      <p className="text-sm italic">No sales orders found.</p>
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
