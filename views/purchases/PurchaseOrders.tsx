
import React, { useState } from 'react';
import { 
  ClipboardList, Search, Filter, Plus, 
  Calendar, ArrowRight, Truck, Receipt, Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { purchaseService } from '../../services/purchase.service';
import { useAuth } from '../../App';

const POStatusBadge = ({ status }: { status: string }) => {
  const styles: any = {
    Draft: 'bg-slate-100 text-slate-600 border-slate-200',
    Issued: 'bg-blue-50 text-blue-700 border-blue-100',
    Received: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    Billed: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    Cancelled: 'bg-red-50 text-red-700 border-red-100',
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${styles[status] || styles.Draft}`}>
      {status}
    </span>
  );
};

export default function PurchaseOrders() {
  const navigate = useNavigate();
  const { user, can } = useAuth();
  const [search, setSearch] = useState('');
  const [refresh, setRefresh] = useState(0);
  
  const pos = purchaseService.getPurchaseOrders().reverse();

  const handleQuickIssue = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Authorize and Issue this Purchase Order?')) {
      purchaseService.updatePOStatus(id, 'Issued', user);
      setRefresh(prev => prev + 1);
    }
  };

  const filteredPos = pos.filter(po => {
    const vendor = purchaseService.getVendorById(po.vendorId);
    return po.poNumber.toLowerCase().includes(search.toLowerCase()) || 
           vendor?.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Purchase Orders</h1>
          <p className="text-slate-500 text-sm">Create and track procurement cycles with vendors.</p>
        </div>
        <button 
          onClick={() => navigate('/purchases/orders/new')}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-sm shadow-xl active:scale-95 transition-all"
        >
          <Plus size={18} />
          New Purchase Order
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by PO number or vendor..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl w-full outline-none text-sm !bg-white !text-slate-900 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 text-slate-600 border border-slate-200 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 transition-all">
            <Filter size={14} /> Filter Status
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">PO Details</th>
                <th className="px-6 py-4">Vendor</th>
                <th className="px-6 py-4 text-center">Order Date</th>
                <th className="px-6 py-4 text-right">Total Cost</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPos.length > 0 ? filteredPos.map(po => {
                const vendor = purchaseService.getVendorById(po.vendorId);
                return (
                  <tr 
                    key={po.id} 
                    onClick={() => navigate(`/purchases/orders/${po.id}`)}
                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center font-black text-xs group-hover:bg-rose-100 transition-colors">PO</div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{po.poNumber}</p>
                          <p className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase">ID: {po.id.slice(-6)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-700">{vendor?.name}</p>
                    </td>
                    <td className="px-6 py-4 text-center text-xs text-slate-500">
                      {new Date(po.date).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-black text-slate-900">AED {po.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </td>
                    <td className="px-6 py-4">
                      <POStatusBadge status={po.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {po.status === 'Draft' && can('purchases.approve') && (
                          <button 
                            onClick={(e) => handleQuickIssue(e, po.id)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            title="Quick Issue"
                          >
                            <Check size={18} />
                          </button>
                        )}
                        <button className="p-2 text-slate-400 group-hover:text-blue-600 transition-all">
                          <ArrowRight size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-300">
                      <ClipboardList size={48} className="opacity-20" />
                      <p className="text-sm italic">No purchase orders found.</p>
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
