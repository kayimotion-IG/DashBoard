
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { salesService } from '../../services/sales.service';

export default function PaymentReceivedList() {
  const navigate = useNavigate();
  const payments = salesService.getPaymentsReceived().reverse();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payments Received</h1>
          <p className="text-slate-500 text-sm">Receipt history from customers.</p>
        </div>
        <button onClick={() => navigate('/sales/payments/new')} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg">
          <Plus size={18}/> Record Receipt
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b">
            <tr>
              <th className="px-6 py-4">Ref #</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Mode</th>
              <th className="px-6 py-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payments.map(p => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-mono text-xs">{p.paymentNumber}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{salesService.getCustomerById(p.customerId)?.name}</td>
                <td className="px-6 py-4 text-xs text-slate-400">{new Date(p.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-xs font-bold uppercase">{p.paymentMode}</td>
                <td className="px-6 py-4 text-right font-black text-emerald-600">+AED {p.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
