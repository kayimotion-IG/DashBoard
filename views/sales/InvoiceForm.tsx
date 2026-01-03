
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Receipt, Package, FileText, ShieldCheck, Info, Loader2, X } from 'lucide-react';
import { salesService } from '../../services/sales.service';
import { useAuth } from '../../App';
import { SalesOrder } from '../../types';

export default function InvoiceForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const customers = salesService.getCustomers();
  
  const queryParams = new URLSearchParams(location.search);
  const sourceSOId = queryParams.get('soId');
  const existingId = queryParams.get('id');

  const [formData, setFormData] = useState({
    invoiceNumber: `INV-${Date.now().toString().slice(-5)}`,
    customerId: '',
    soId: sourceSOId || '',
    lpoNumber: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    total: 0,
    subTotal: 0,
    taxTotal: 0,
    notes: '',
    includeStamp: true
  });

  const [lines, setLines] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const pendingOrders = useMemo(() => {
    if (!formData.customerId) return [];
    return salesService.getSalesOrders().filter(so => 
      so.customerId === formData.customerId && 
      (so.status === 'Confirmed' || so.status === 'Shipped')
    );
  }, [formData.customerId]);

  useEffect(() => {
    if (existingId) {
       const inv = salesService.getInvoices().find(i => i.id === existingId);
       if (inv) {
          setFormData({ ...formData, ...inv });
          setLines(inv.lines || []);
       }
    } else if (sourceSOId) {
      const so = salesService.getSOById(sourceSOId);
      if (so) applySOData(so);
    }
  }, [sourceSOId, existingId]);

  const applySOData = (so: SalesOrder) => {
    setFormData(prev => ({
      ...prev,
      customerId: so.customerId,
      soId: so.id,
      lpoNumber: so.lpoNumber || '',
      total: so.total,
      subTotal: so.subTotal,
      taxTotal: so.taxTotal,
      notes: `Ref: SO ${so.orderNumber}. ${so.notes || ''}`
    }));
    setLines(so.lines);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || formData.total <= 0) {
      setError('Please select a customer and ensure items are linked.');
      return;
    }
    
    setIsSaving(true);
    setError('');

    try {
      await salesService.createInvoice({ ...formData, lines }, user);
      navigate('/sales/invoices');
    } catch (err: any) {
      setError(err.message || 'Failed to post invoice.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/sales/invoices')} className="p-2 bg-white border rounded-full text-slate-500 hover:bg-slate-50"><ArrowLeft size={20}/></button>
          <div>
             <h1 className="text-2xl font-bold text-slate-900">{existingId ? 'View Invoice' : 'Generate Tax Invoice'}</h1>
             <p className="text-sm text-slate-500 font-medium">Create a legal billing document linked to the general ledger.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate(-1)} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm">Cancel</button>
          {!existingId && (
            <button 
              disabled={isSaving}
              onClick={handleSubmit} 
              className="flex items-center gap-2 px-10 py-2.5 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {isSaving ? 'Posting...' : 'Post Invoice'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm font-bold flex items-center gap-3">
           <X className="bg-red-200 rounded-full p-0.5" size={16} />
           {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Customer</label>
            <select 
              required 
              disabled={!!existingId}
              value={formData.customerId} 
              onChange={e => setFormData({...formData, customerId: e.target.value, soId: ''})} 
              className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none bg-white text-sm"
            >
              <option value="">Select Customer...</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1 flex items-center gap-1">Link Sales Order</label>
            <select 
              value={formData.soId}
              disabled={!formData.customerId || !!existingId}
              onChange={e => {
                const selected = pendingOrders.find(so => so.id === e.target.value);
                if (selected) applySOData(selected);
              }}
              className="w-full px-4 py-3 border border-blue-200 rounded-xl outline-none bg-blue-50/50 text-sm font-bold text-blue-800 disabled:opacity-50"
            >
              <option value="">(None - Manual Entry)</option>
              {pendingOrders.map(so => <option key={so.id} value={so.id}>{so.orderNumber} - AED {so.total.toLocaleString()}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Invoice #</label>
            <input required readOnly={!!existingId} value={formData.invoiceNumber} onChange={e => setFormData({...formData, invoiceNumber: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none font-bold" />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">LPO #</label>
            <input readOnly={!!existingId} value={formData.lpoNumber} onChange={e => setFormData({...formData, lpoNumber: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none" />
          </div>
        </div>

        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 bg-slate-50 border-b flex items-center justify-between">
             <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><Package size={16} className="text-blue-600" /> Billed Items</h3>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase border-b">
              <tr>
                <th className="px-8 py-4">Item & Description</th>
                <th className="px-6 py-4 text-center">Qty</th>
                <th className="px-6 py-4 text-right">Rate (AED)</th>
                <th className="px-8 py-4 text-right">Amount (AED)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lines.map((l, i) => (
                <tr key={i}>
                  <td className="px-8 py-5 text-sm font-bold text-slate-700">{l.itemName}</td>
                  <td className="px-6 py-5 text-center font-black text-slate-600">{l.quantity}</td>
                  <td className="px-6 py-5 text-right text-slate-500">{l.rate.toFixed(2)}</td>
                  <td className="px-8 py-5 text-right font-black text-slate-900">{l.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="p-10 bg-slate-50 border-t flex justify-end">
             <div className="w-72 space-y-3">
                <div className="flex justify-between text-sm">
                   <span className="text-slate-500 font-bold uppercase tracking-tighter text-xs">Sub Total</span>
                   <span className="font-bold">AED {formData.subTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                   <span className="text-slate-500 font-bold uppercase tracking-tighter text-xs">VAT (5%)</span>
                   <span className="font-bold">AED {formData.taxTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xl font-black text-blue-600 pt-3 border-t">
                   <span>TOTAL</span>
                   <span>AED {formData.total.toLocaleString()}</span>
                </div>
             </div>
          </div>
        </div>
      </form>
    </div>
  );
}
