
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Receipt } from 'lucide-react';
import { purchaseService } from '../../services/purchase.service';
import { useAuth } from '../../App';

export default function BillForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const vendors = purchaseService.getVendors();

  const [formData, setFormData] = useState({
    billNumber: '',
    vendorId: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    total: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendorId || formData.total <= 0) return;
    purchaseService.createBill(formData, user);
    navigate('/purchases/bills');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/purchases/bills')} className="p-2 bg-white border rounded-full"><ArrowLeft size={20}/></button>
        <h1 className="text-2xl font-bold text-slate-900">Record Vendor Bill</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase">Bill Number</label>
            <input required value={formData.billNumber} onChange={e => setFormData({...formData, billNumber: e.target.value})} className="w-full px-4 py-3 border rounded-xl" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase">Vendor</label>
            <select required value={formData.vendorId} onChange={e => setFormData({...formData, vendorId: e.target.value})} className="w-full px-4 py-3 border rounded-xl">
              <option value="">Choose Supplier</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase">Bill Date</label>
            <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-3 border rounded-xl" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase">Due Date</label>
            <input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full px-4 py-3 border rounded-xl" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase">Total Amount Payable</label>
          <input type="number" required value={formData.total} onChange={e => setFormData({...formData, total: Number(e.target.value)})} className="w-full px-4 py-4 border rounded-xl text-xl font-black text-rose-600" />
        </div>
        <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-2xl active:scale-95 transition-all">Save Bill & Update AP Balance</button>
      </form>
    </div>
  );
}
