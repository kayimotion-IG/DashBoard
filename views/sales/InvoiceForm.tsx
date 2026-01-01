
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Receipt, Package, Calendar, User, Info, FileText } from 'lucide-react';
import { salesService } from '../../services/sales.service';
import { useAuth } from '../../App';

export default function InvoiceForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const customers = salesService.getCustomers();
  
  const queryParams = new URLSearchParams(location.search);
  const sourceSOId = queryParams.get('soId');

  const [formData, setFormData] = useState({
    invoiceNumber: `INV-${Date.now().toString().slice(-5)}`,
    customerId: '',
    soId: sourceSOId || '',
    lpoNumber: '',
    reference: '', 
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    total: 0,
    subTotal: 0,
    taxTotal: 0,
    notes: ''
  });

  const [lines, setLines] = useState<any[]>([]);

  useEffect(() => {
    if (sourceSOId) {
      const so = salesService.getSOById(sourceSOId);
      if (so) {
        setFormData(prev => ({
          ...prev,
          customerId: so.customerId,
          lpoNumber: so.lpoNumber || '',
          reference: so.orderNumber,
          total: so.total,
          subTotal: so.subTotal,
          taxTotal: so.taxTotal,
          notes: `Generated from Sales Order ${so.orderNumber}. ${so.notes || ''}`
        }));
        setLines(so.lines);
      }
    }
  }, [sourceSOId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || formData.total <= 0) {
      alert('Please select a customer and ensure total is greater than zero.');
      return;
    }
    
    // Create the invoice
    salesService.createInvoice({
      ...formData,
      lines 
    }, user);

    // Ensure bi-directional status update
    if (sourceSOId) {
      salesService.updateSOStatus(sourceSOId, 'Invoiced', user);
    }

    navigate('/sales/invoices');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/sales/invoices')} className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-all text-slate-500">
            <ArrowLeft size={20}/>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {sourceSOId ? `Invoice for ${salesService.getSOById(sourceSOId)?.orderNumber}` : 'New Manual Invoice'}
            </h1>
            <p className="text-sm text-slate-500">Finalize financial billing and tax records.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/sales/invoices')} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm">Cancel</button>
          <button 
            onClick={handleSubmit}
            className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-xl shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all"
          >
            <Save size={18} />
            Post Invoice
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Invoice Number</label>
            <input 
              required 
              value={formData.invoiceNumber} 
              onChange={e => setFormData({...formData, invoiceNumber: e.target.value})} 
              className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 font-bold" 
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">LPO # (Customer PO)</label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input 
                value={formData.lpoNumber} 
                onChange={e => setFormData({...formData, lpoNumber: e.target.value})} 
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 font-medium" 
                placeholder="e.g. 136825"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Customer</label>
            <select 
              disabled={!!sourceSOId}
              required 
              value={formData.customerId} 
              onChange={e => setFormData({...formData, customerId: e.target.value})} 
              className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none bg-white text-sm disabled:bg-slate-50 disabled:text-slate-500"
            >
              <option value="">Choose Customer...</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Due Date</label>
            <input 
              type="date" 
              value={formData.dueDate} 
              onChange={e => setFormData({...formData, dueDate: e.target.value})} 
              className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none text-sm" 
            />
          </div>
        </div>

        {sourceSOId && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <Package size={18} className="text-blue-600" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Billed Items (Imported from Sale)</h3>
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b">
                <tr>
                  <th className="px-8 py-4">Item Details</th>
                  <th className="px-6 py-4 text-center">Qty</th>
                  <th className="px-6 py-4 text-right">Rate</th>
                  <th className="px-8 py-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lines.map(line => (
                  <tr key={line.id} className="text-sm">
                    <td className="px-8 py-4 font-bold text-slate-700">{line.itemName}</td>
                    <td className="px-6 py-4 text-center">{line.quantity}</td>
                    <td className="px-6 py-4 text-right text-slate-500">AED {line.rate.toFixed(2)}</td>
                    <td className="px-8 py-4 text-right font-black text-slate-900">AED {line.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-8 bg-slate-50 flex justify-end">
              <div className="w-72 space-y-3">
                 <div className="flex justify-between text-sm text-slate-500 font-medium">
                    <span>Sub Total</span>
                    <span>AED {formData.subTotal.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between text-sm text-slate-500 font-medium">
                    <span>Tax (VAT 5%)</span>
                    <span>AED {formData.taxTotal.toLocaleString()}</span>
                 </div>
                 <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Total Bill</span>
                    <span className="text-2xl font-black text-blue-600">AED {formData.total.toLocaleString()}</span>
                 </div>
              </div>
            </div>
          </div>
        )}

        {!sourceSOId && (
          <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-start gap-4">
             <Info size={24} className="text-blue-600 shrink-0 mt-1" />
             <div>
                <p className="text-sm font-bold text-blue-900">Manual Entry Mode</p>
                <p className="text-xs text-blue-700 leading-relaxed mt-1">
                  You are creating an invoice without a Sales Order. For production environments, we recommend creating a Sales Order first to maintain item stock tracking and fulfillment history.
                </p>
                <div className="mt-4">
                  <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Invoice Total Amount (AED)</label>
                  <input 
                    type="number" 
                    value={formData.total} 
                    onChange={e => setFormData({...formData, total: Number(e.target.value)})} 
                    className="block w-64 mt-1 px-4 py-3 border border-blue-200 rounded-xl text-xl font-black text-blue-600 outline-none focus:ring-4 focus:ring-blue-200" 
                  />
                </div>
             </div>
          </div>
        )}

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Terms & Notes</label>
           <textarea 
             value={formData.notes}
             onChange={e => setFormData({...formData, notes: e.target.value})}
             placeholder="Payment instructions, bank details, etc."
             className="w-full mt-2 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 text-sm h-32"
           />
        </div>
      </form>
    </div>
  );
}
