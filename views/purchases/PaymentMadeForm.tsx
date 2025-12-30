
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, CreditCard } from 'lucide-react';
import { purchaseService } from '../../services/purchase.service';
import { useAuth } from '../../App';
import { Bill } from '../../types';

export default function PaymentMadeForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const vendors = purchaseService.getVendors();

  const [formData, setFormData] = useState({
    paymentNumber: `V-PAY-${Date.now().toString().slice(-5)}`,
    vendorId: '',
    billId: '',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    paymentMode: 'Bank Transfer',
    reference: ''
  });

  const [pendingBills, setPendingBills] = useState<Bill[]>([]);

  useEffect(() => {
    if (formData.vendorId) {
      const bills = purchaseService.getBills().filter(b => b.vendorId === formData.vendorId && b.balanceDue > 0);
      setPendingBills(bills);
    } else {
      setPendingBills([]);
    }
  }, [formData.vendorId]);

  const handleBillSelect = (billId: string) => {
    const bill = pendingBills.find(b => b.id === billId);
    setFormData({ ...formData, billId, amount: bill ? bill.balanceDue : 0 });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendorId || formData.amount <= 0) {
      alert('Please select vendor and valid amount.');
      return;
    }
    purchaseService.recordPayment(formData, user);
    navigate('/purchases/payments');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/purchases/payments')} className="p-2 bg-white border rounded-full text-slate-500 hover:bg-slate-50 transition-all"><ArrowLeft size={20}/></button>
        <h1 className="text-2xl font-bold text-slate-900">Record Payment</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vendor</label>
            <select required value={formData.vendorId} onChange={e => setFormData({...formData, vendorId: e.target.value, billId: ''})} className="w-full px-4 py-3 border rounded-xl !bg-white !text-slate-900">
              <option value="">Select Vendor</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name} (Payables: AED {purchaseService.getVendorBalance(v.id).toLocaleString()})</option>)}
            </select>
          </div>

          {formData.vendorId && pendingBills.length > 0 && (
            <div className="space-y-1 animate-in slide-in-from-top-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pay Specific Bill</label>
              <select value={formData.billId} onChange={e => handleBillSelect(e.target.value)} className="w-full px-4 py-3 border rounded-xl !bg-white !text-slate-900">
                <option value="">Account Credit (Unallocated)</option>
                {pendingBills.map(b => <option key={b.id} value={b.id}>{b.billNumber} - Due: AED {b.balanceDue.toLocaleString()}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Date</label>
              <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-3 border rounded-xl !bg-white !text-slate-900" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mode</label>
              <select value={formData.paymentMode} onChange={e => setFormData({...formData, paymentMode: e.target.value})} className="w-full px-4 py-3 border rounded-xl !bg-white !text-slate-900">
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount Paid (AED)</label>
            <input type="number" required value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="w-full px-4 py-4 border rounded-xl text-xl font-black text-rose-600 !bg-white !text-rose-600" />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reference</label>
            <input value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})} placeholder="Ref # / Internal Note" className="w-full px-4 py-3 border rounded-xl !bg-white !text-slate-900" />
          </div>
        </div>

        <button type="submit" className="w-full py-4 bg-rose-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-rose-700 active:scale-95 transition-all">Record Disbursement</button>
      </form>
    </div>
  );
}
