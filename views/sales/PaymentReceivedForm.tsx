
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Receipt } from 'lucide-react';
import { salesService } from '../../services/sales.service';
import { useAuth } from '../../App';
import { Invoice } from '../../types';

export default function PaymentReceivedForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const customers = salesService.getCustomers();

  const [formData, setFormData] = useState({
    paymentNumber: `PAY-${Date.now().toString().slice(-5)}`,
    customerId: '',
    invoiceId: '',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    paymentMode: 'Bank Transfer',
    reference: ''
  });

  const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    if (formData.customerId) {
      const invs = salesService.getInvoices().filter(i => i.customerId === formData.customerId && i.balanceDue > 0);
      setPendingInvoices(invs);
    } else {
      setPendingInvoices([]);
    }
  }, [formData.customerId]);

  const handleInvoiceSelect = (invId: string) => {
    const inv = pendingInvoices.find(i => i.id === invId);
    setFormData({ ...formData, invoiceId: invId, amount: inv ? inv.balanceDue : 0 });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || formData.amount <= 0) {
      alert('Missing customer or valid amount.');
      return;
    }
    salesService.recordPayment(formData, user);
    navigate('/sales/payments');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/sales/payments')} className="p-2 bg-white border rounded-full text-slate-500 hover:bg-slate-50"><ArrowLeft size={20}/></button>
        <h1 className="text-2xl font-bold text-slate-900">Record Receipt</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Customer</label>
            <select required value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value, invoiceId: ''})} className="w-full px-4 py-3 border rounded-xl !bg-white !text-slate-900">
              <option value="">Select Customer</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} (Outstanding: AED {salesService.getCustomerBalance(c.id).toLocaleString()})</option>)}
            </select>
          </div>

          {formData.customerId && pendingInvoices.length > 0 && (
            <div className="space-y-1 animate-in slide-in-from-top-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Allocate to Invoice</label>
              <select value={formData.invoiceId} onChange={e => handleInvoiceSelect(e.target.value)} className="w-full px-4 py-3 border rounded-xl !bg-white !text-slate-900">
                <option value="">Full Account Payment (Unallocated)</option>
                {pendingInvoices.map(i => <option key={i.id} value={i.id}>{i.invoiceNumber} - Due: AED {i.balanceDue.toLocaleString()}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Date</label>
              <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-3 border rounded-xl !bg-white !text-slate-900" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Mode</label>
              <select value={formData.paymentMode} onChange={e => setFormData({...formData, paymentMode: e.target.value})} className="w-full px-4 py-3 border rounded-xl !bg-white !text-slate-900">
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Credit Card">Credit Card</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount Received (AED)</label>
            <input type="number" required value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="w-full px-4 py-4 border rounded-xl text-xl font-black text-emerald-600 !bg-white !text-emerald-600" />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reference / Note</label>
            <input value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})} placeholder="e.g. Bank Ref # or Cheque #" className="w-full px-4 py-3 border rounded-xl !bg-white !text-slate-900" />
          </div>
        </div>

        <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-emerald-700 active:scale-95 transition-all">Confirm & Post Receipt</button>
      </form>
    </div>
  );
}
