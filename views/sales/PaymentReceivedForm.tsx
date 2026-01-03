
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Receipt, Wallet, Info } from 'lucide-react';
import { salesService } from '../../services/sales.service';
import { useAuth } from '../../App';
import { Invoice } from '../../types';

export default function PaymentReceivedForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const customers = salesService.getCustomers();

  const [formData, setFormData] = useState({
    paymentNumber: `PAY-${Date.now().toString().slice(-4)}`,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || formData.amount <= 0) return alert('Invalid entry.');
    await salesService.recordPayment(formData, user);
    navigate('/');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-white border rounded-full"><ArrowLeft size={20}/></button>
        <h1 className="text-2xl font-bold text-slate-900">Record Customer Receipt</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[32px] border border-slate-200 shadow-2xl space-y-8">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Customer</label>
            <select required value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value, invoiceId: ''})} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-amber-50">
              <option value="">Choose Client...</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} (Bal: {salesService.getCustomerBalance(c.id)})</option>)}
            </select>
          </div>

          {pendingInvoices.length > 0 && (
            <div className="space-y-1 animate-in slide-in-from-top-2">
              <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1 flex items-center gap-1"> <Info size={12}/> Select Pending Invoice</label>
              <select value={formData.invoiceId} onChange={e => {
                const inv = pendingInvoices.find(i => i.id === e.target.value);
                setFormData({...formData, invoiceId: e.target.value, amount: inv ? inv.balanceDue : 0});
              }} className="w-full px-4 py-3 border border-blue-200 bg-blue-50/30 rounded-xl outline-none focus:ring-4 focus:ring-blue-100">
                <option value="">On Account (Unallocated)</option>
                {pendingInvoices.map(i => <option key={i.id} value={i.id}>{i.invoiceNumber} - Due: AED {i.balanceDue.toLocaleString()}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Receipt Date</label>
               <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-3 border rounded-xl" />
            </div>
            <div className="space-y-1">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mode</label>
               <select value={formData.paymentMode} onChange={e => setFormData({...formData, paymentMode: e.target.value})} className="w-full px-4 py-3 border rounded-xl bg-white">
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
               </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">Amount Received (AED)</label>
            <input type="number" step="0.01" required value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="w-full px-4 py-4 border border-emerald-200 rounded-2xl text-2xl font-black text-emerald-600 focus:ring-4 focus:ring-emerald-50" />
          </div>
        </div>

        <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-2xl active:scale-95 transition-all">Confirm & Update Ledger</button>
      </form>
    </div>
  );
}
