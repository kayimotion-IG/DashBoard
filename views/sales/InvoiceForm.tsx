
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { salesService } from '../../services/sales.service';
import { useAuth } from '../../App';

export default function InvoiceForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const customers = salesService.getCustomers();

  const [formData, setFormData] = useState({
    invoiceNumber: '',
    customerId: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    total: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || formData.total <= 0) return;
    salesService.createInvoice(formData, user);
    navigate('/sales/invoices');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/sales/invoices')} className="p-2 bg-white border rounded-full"><ArrowLeft size={20}/></button>
        <h1 className="text-2xl font-bold text-slate-900">Generate Manual Invoice</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase">Invoice Number</label>
            <input required value={formData.invoiceNumber} onChange={e => setFormData({...formData, invoiceNumber: e.target.value})} placeholder="INV-001" className="w-full px-4 py-3 border rounded-xl" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase">Customer</label>
            <select required value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value})} className="w-full px-4 py-3 border rounded-xl">
              <option value="">Choose Customer</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase">Date</label>
            <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-3 border rounded-xl" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase">Due Date</label>
            <input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full px-4 py-3 border rounded-xl" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase">Total Invoice Value</label>
          <input type="number" required value={formData.total} onChange={e => setFormData({...formData, total: Number(e.target.value)})} className="w-full px-4 py-4 border rounded-xl text-xl font-black text-blue-600" />
        </div>
        <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-2xl active:scale-95 transition-all">Post Invoice & Update AR</button>
      </form>
    </div>
  );
}
