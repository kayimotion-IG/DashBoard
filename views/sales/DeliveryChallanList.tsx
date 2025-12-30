
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Plus } from 'lucide-react';
import { salesService } from '../../services/sales.service';

export default function DeliveryChallanList() {
  const navigate = useNavigate();
  const deliveries = salesService.getDeliveries().reverse();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Delivery Challans</h1>
          <p className="text-slate-500 text-sm">Fulfillment record log showing stock departures.</p>
        </div>
        <button onClick={() => navigate('/sales/delivery-challans/new')} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg">
          <Plus size={18}/> New DC
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b">
            <tr>
              <th className="px-6 py-4">DC Number</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Lines</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {deliveries.map(d => (
              <tr key={d.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-bold text-slate-900">{d.dcNumber}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{salesService.getCustomerById(d.customerId)?.name}</td>
                <td className="px-6 py-4 text-xs text-slate-400">{new Date(d.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-xs text-slate-500">{d.lines.length} SKUs</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
