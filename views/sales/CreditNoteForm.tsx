
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, FileMinus, User, Info } from 'lucide-react';
import { salesService } from '../../services/sales.service';
import { useAuth } from '../../App';

export default function CreditNoteForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const customers = salesService.getCustomers();

  const [formData, setFormData] = useState({
    creditNoteNumber: `CN-${Date.now().toString().slice(-5)}`,
    customerId: '',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    reason: 'Damaged Goods'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || formData.amount <= 0) {
      alert('Please provide customer and valid credit amount.');
      return;
    }
    salesService.createCreditNote(formData, user);
    navigate('/sales/credit-notes');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/sales/credit-notes')} className="p-2 bg-white border border-slate-200 rounded-full text-slate-500 hover:bg-slate-50 transition-all">
          <ArrowLeft size={20}/>
        </button>
        <h1 className="text-2xl font-bold text-slate-900">New Credit Note</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CN Number</label>
            <input required value={formData.creditNoteNumber} onChange={e => setFormData({...formData, creditNoteNumber: e.target.value})} className="w-full px-4 py-3 border rounded-xl font-bold text-slate-900" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CN Date</label>
            <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-3 border rounded-xl" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Customer</label>
          <select required value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value})} className="w-full px-4 py-3 border rounded-xl bg-white">
            <option value="">Choose Customer...</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Return Reason</label>
          <select value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} className="w-full px-4 py-3 border rounded-xl bg-white">
            <option value="Damaged Goods">Damaged Goods</option>
            <option value="Customer Return">Customer Return</option>
            <option value="Billing Correction">Billing Correction</option>
            <option value="Goodwill Credit">Goodwill Credit</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Credit Amount (AED)</label>
          <input 
            type="number" 
            required 
            value={formData.amount} 
            onChange={e => setFormData({...formData, amount: Number(e.target.value)})} 
            className="w-full px-4 py-4 border rounded-xl text-xl font-black text-rose-600 focus:ring-4 focus:ring-rose-50 outline-none transition-all" 
          />
        </div>

        <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-start gap-3">
          <Info size={18} className="text-orange-600 shrink-0 mt-0.5" />
          <p className="text-[10px] text-orange-700 leading-relaxed font-bold uppercase">
            Credit notes decrease the customer's total outstanding balance. This will be reflected in statements immediately.
          </p>
        </div>

        <button type="submit" className="w-full py-4 bg-[#f97316] text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-orange-700 transition-all active:scale-95">
          Finalize Credit Issue
        </button>
      </form>
    </div>
  );
}
