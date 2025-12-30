
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Plus, Package } from 'lucide-react';
import { purchaseService } from '../../services/purchase.service';

export default function GoodsReceiveList() {
  const navigate = useNavigate();
  const receives = purchaseService.getReceives().reverse();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Goods Receive (GRN)</h1>
          <p className="text-slate-500 text-sm">Historical log of manual stock receipts from vendors.</p>
        </div>
        <button onClick={() => navigate('/purchases/receives/new')} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg">
          <Plus size={18}/> New GRN
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b">
            <tr>
              <th className="px-6 py-4">Receive No</th>
              <th className="px-6 py-4">Vendor</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-right">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {receives.map(r => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-bold text-slate-900">{r.receiveNo}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{purchaseService.getVendorById(r.vendorId)?.name}</td>
                <td className="px-6 py-4 text-xs text-slate-400">{new Date(r.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right font-black text-slate-900">AED {r.total.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
