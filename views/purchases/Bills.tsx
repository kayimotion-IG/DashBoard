import React, { useState } from 'react';
import { 
  FileText, Search, Filter, Plus,
  Calendar, ArrowRight, Clock, Truck, Wallet, FileDown, HandCoins
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { purchaseService } from '../../services/purchase.service';
import { useAuth } from '../../App';

const BillStatusBadge = ({ status }: { status: string }) => {
  const styles: any = {
    Draft: 'bg-slate-100 text-slate-600 border-slate-200',
    Open: 'bg-blue-50 text-blue-700 border-blue-100',
    'Partially Paid': 'bg-amber-50 text-amber-700 border-amber-100',
    Paid: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    Void: 'bg-red-50 text-red-700 border-red-100',
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${styles[status] || styles.Draft}`}>
      {status}
    </span>
  );
};

export default function Bills() {
  const navigate = useNavigate();
  const { can } = useAuth();
  const [search, setSearch] = useState('');
  const bills = purchaseService.getBills().reverse();

  const filteredBills = bills.filter(bill => {
    const vendor = purchaseService.getVendorById(bill.vendorId);
    return bill.billNumber.toLowerCase().includes(search.toLowerCase()) || 
           vendor?.name.toLowerCase().includes(search.toLowerCase());
  });

  const handlePayBill = (e: React.MouseEvent, billId: string, vendorId: string) => {
    e.stopPropagation();
    navigate(`/purchases/payments/new?billId=${billId}&vendorId=${vendorId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vendor Bills</h1>
          <p className="text-slate-500 text-sm">Manage payables and track vendor invoicing.</p>
        </div>
        {can('purchases.create') && (
          <button 
            onClick={() => navigate('/purchases/bills/new')}
            className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-bold text-sm shadow-xl shadow-rose-500/20 active:scale-95 transition-all"
          >
            <Plus size={18} />
            Record New Bill
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by bill number or vendor..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl w-full outline-none text-sm bg-white !text-slate-900 focus:ring-2 focus:ring-blue-100"
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
                <th className="px-6 py-4">Bill Details</th>
                <th className="px-6 py-4">Vendor</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4 text-right">Balance Due</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBills.length > 0 ? filteredBills.map(bill => {
                const vendor = purchaseService.getVendorById(bill.vendorId);
                const isOverdue = new Date(bill.dueDate) < new Date() && bill.balanceDue > 0;
                return (
                  <tr key={bill.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center font-bold text-xs">BIL</div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{bill.billNumber}</p>
                          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{new Date(bill.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-700">{vendor?.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-2 text-xs ${isOverdue ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
                        {isOverdue ? <Clock size={14} /> : <Calendar size={14} />}
                        {new Date(bill.dueDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-700">AED {bill.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-right">
                      <p className={`text-sm font-black ${bill.balanceDue > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        AED {bill.balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <BillStatusBadge status={bill.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {bill.balanceDue > 0 && (
                          <button 
                            onClick={(e) => handlePayBill(e, bill.id, bill.vendorId)}
                            className="p-2 text-[#fbaf0f] hover:bg-[#fbaf0f]/10 rounded-xl transition-all"
                            title="Pay this bill"
                          >
                            <HandCoins size={18} />
                          </button>
                        )}
                        <button className="p-2 text-slate-400 hover:text-slate-900 transition-all"><ArrowRight size={18} /></button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-300 max-w-sm mx-auto">
                      <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center border border-slate-100 shadow-inner">
                        <FileText size={40} className="opacity-20" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">No vendor bills recorded</p>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          Vendor bills track your accounts payable. You can record a bill manually or convert a received Purchase Order into a bill.
                        </p>
                      </div>
                      {can('purchases.create') && (
                        <button 
                          onClick={() => navigate('/purchases/bills/new')}
                          className="mt-2 px-6 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                        >
                          Record First Bill
                        </button>
                      )}
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
