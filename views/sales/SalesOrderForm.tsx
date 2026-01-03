
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Trash2, Save, ShoppingCart, 
  Package, CheckCircle2, FileText, Loader2, X
} from 'lucide-react';
import { useAuth } from '../../App';
import { salesService } from '../../services/sales.service';
import { itemService } from '../../services/item.service';

export default function SalesOrderForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const customers = salesService.getCustomers();
  const availableItems = itemService.getItems({}, 1, 999).data;

  const [formData, setFormData] = useState({
    customerId: '',
    lpoNumber: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [lines, setLines] = useState<any[]>([
    { id: '1', itemId: '', itemName: '', quantity: 1, rate: 0, total: 0 }
  ]);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleAddItem = () => {
    setLines([...lines, { id: Math.random().toString(), itemId: '', itemName: '', quantity: 1, rate: 0, total: 0 }]);
  };

  const handleRemoveItem = (id: string) => {
    if (lines.length === 1) return;
    setLines(lines.filter(l => l.id !== id));
  };

  const updateLine = (id: string, field: string, value: any) => {
    setLines(lines.map(l => {
      if (l.id === id) {
        const newLine = { ...l, [field]: value };
        if (field === 'itemId') {
          const item = availableItems.find(i => i.id === value);
          newLine.itemName = item?.name || '';
          newLine.rate = Number(item?.sellingPrice) || 0;
        }
        newLine.total = Number(newLine.quantity) * Number(newLine.rate);
        return newLine;
      }
      return l;
    }));
  };

  const subTotal = lines.reduce((sum, l) => sum + l.total, 0);
  const taxTotal = subTotal * 0.05;
  const total = subTotal + taxTotal;

  const handleSubmit = async (e?: React.FormEvent, shouldConfirm: boolean = false) => {
    if (e) e.preventDefault();
    if (!formData.customerId || lines.some(l => !l.itemId)) {
      setError('Please select a customer and at least one item.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const newSO = await salesService.createSO({
        ...formData,
        lines,
        subTotal,
        taxTotal,
        total
      }, user);
      
      if (shouldConfirm && newSO) {
        await salesService.updateSOStatus(newSO.id, 'Confirmed', user);
      }
      
      navigate('/sales/orders');
    } catch (err: any) {
      console.error("[SO Save Error]", err);
      setError(err.message || 'Failed to save the Sales Order. Please check connectivity.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/sales/orders')} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-500 bg-white border">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">New Sales Order</h1>
            <p className="text-sm text-slate-500">Generate a new sales order with automated inventory tracking.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button disabled={isSaving} onClick={() => navigate('/sales/orders')} className="px-6 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-bold text-sm bg-white hover:bg-slate-50">Cancel</button>
          
          <button 
            type="button"
            disabled={isSaving}
            onClick={(e) => handleSubmit(undefined, false)}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-bold text-sm shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Draft
          </button>

          <button 
            type="button"
            disabled={isSaving}
            onClick={(e) => handleSubmit(undefined, true)}
            className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-sm shadow-xl shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
            {isSaving ? 'Processing...' : 'Confirm Order'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm font-bold flex items-center gap-3">
           {/* Fixed: Added missing X icon to imports */}
           <X className="bg-red-200 rounded-full p-0.5" size={16} />
           {error}
        </div>
      )}

      <form id="so-form" onSubmit={(e) => handleSubmit(e, false)} className="space-y-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Customer *</label>
            <select 
              required
              disabled={isSaving}
              value={formData.customerId}
              onChange={e => setFormData({...formData, customerId: e.target.value})}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none bg-white text-sm"
            >
              <option value="">Select a customer...</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.companyName})</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">LPO # (Customer PO)</label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input 
                disabled={isSaving}
                value={formData.lpoNumber}
                onChange={e => setFormData({...formData, lpoNumber: e.target.value})}
                placeholder="e.g. 136825"
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl outline-none text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Order Date</label>
            <input 
              disabled={isSaving}
              type="date"
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none text-sm"
            />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Package size={16} className="text-blue-600" />
              Line Items
            </h3>
            <button 
              type="button" 
              disabled={isSaving}
              onClick={handleAddItem}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-black uppercase hover:bg-blue-100 transition-all"
            >
              <Plus size={14} /> Add Item
            </button>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b">
              <tr>
                <th className="px-6 py-4">Item Details</th>
                <th className="px-6 py-4 w-32">Qty</th>
                <th className="px-6 py-4 w-40">Rate</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lines.map((line) => (
                <tr key={line.id}>
                  <td className="px-6 py-4">
                    <select 
                      disabled={isSaving}
                      value={line.itemId}
                      onChange={e => updateLine(line.id, 'itemId', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                    >
                      <option value="">Choose item...</option>
                      {availableItems.map(i => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <input 
                      disabled={isSaving}
                      type="number"
                      value={line.quantity}
                      onChange={e => updateLine(line.id, 'quantity', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input 
                      disabled={isSaving}
                      type="number"
                      value={line.rate}
                      onChange={e => updateLine(line.id, 'rate', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </td>
                  <td className="px-6 py-4 text-right font-black text-slate-900">
                    AED {line.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4">
                    <button type="button" disabled={isSaving} onClick={() => handleRemoveItem(line.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-8 bg-slate-50 flex justify-end">
             <div className="w-64 space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                   <span>Sub Total</span>
                   <span>AED {subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                   <span>VAT (5%)</span>
                   <span>AED {taxTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-lg font-black text-blue-600 border-t pt-2 mt-2">
                   <span>Total</span>
                   <span>AED {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
             </div>
          </div>
        </div>
      </form>
    </div>
  );
}
