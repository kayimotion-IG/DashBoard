
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Trash2, Save, ShoppingCart, 
  Package, Truck, ClipboardList
} from 'lucide-react';
import { useAuth } from '../../App';
import { purchaseService } from '../../services/purchase.service';
import { itemService } from '../../services/item.service';

export default function PurchaseOrderForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const vendors = purchaseService.getVendors();
  const availableItems = itemService.getItems({}, 1, 999).data;

  const [formData, setFormData] = useState({
    vendorId: '',
    date: new Date().toISOString().split('T')[0],
    expectedDate: '',
    notes: ''
  });

  const [lines, setLines] = useState<any[]>([
    { id: '1', itemId: '', itemName: '', quantity: 1, rate: 0, total: 0 }
  ]);

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
          newLine.rate = Number(item?.purchasePrice) || 0;
        }
        newLine.total = Number(newLine.quantity) * Number(newLine.rate);
        return newLine;
      }
      return l;
    }));
  };

  const total = lines.reduce((sum, l) => sum + l.total, 0);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.vendorId || lines.some(l => !l.itemId)) {
      alert('Please select a vendor and at least one item.');
      return;
    }

    purchaseService.createPO({
      ...formData,
      lines,
      total
    }, user);
    
    navigate('/purchases/orders');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/purchases/orders')} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-500">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">New Purchase Order</h1>
            <p className="text-sm text-slate-500">Initiate procurement with your preferred suppliers.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/purchases/orders')} className="px-6 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold text-sm bg-white !text-slate-900">Cancel</button>
          <button 
            type="submit"
            form="po-form"
            className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-sm shadow-xl active:scale-95 transition-all"
          >
            <Save size={18} />
            Save Purchase Order
          </button>
        </div>
      </div>

      <form id="po-form" onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vendor *</label>
            <select 
              required
              value={formData.vendorId}
              onChange={e => setFormData({...formData, vendorId: e.target.value})}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none bg-white text-sm !bg-white !text-slate-900"
            >
              <option value="">Select a vendor...</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name} ({v.companyName})</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Order Date</label>
            <input 
              type="date"
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none text-sm bg-white !bg-white !text-slate-900"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Expected Delivery</label>
            <input 
              type="date"
              value={formData.expectedDate}
              onChange={e => setFormData({...formData, expectedDate: e.target.value})}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none text-sm bg-white !bg-white !text-slate-900"
            />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Package size={16} className="text-rose-600" />
              Required Items
            </h3>
            <button 
              type="button" 
              onClick={handleAddItem}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-black uppercase hover:bg-blue-100 transition-all"
            >
              <Plus size={14} /> Add Line
            </button>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b">
              <tr>
                <th className="px-6 py-4">Item Details</th>
                <th className="px-6 py-4 w-32">Qty</th>
                <th className="px-6 py-4 w-40">Cost Rate</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lines.map((line) => (
                <tr key={line.id}>
                  <td className="px-6 py-4">
                    <select 
                      value={line.itemId}
                      onChange={e => updateLine(line.id, 'itemId', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white !bg-white !text-slate-900"
                    >
                      <option value="">Choose item...</option>
                      {availableItems.filter(i => i.itemType !== 'Service').map(i => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <input 
                      type="number"
                      value={line.quantity}
                      onChange={e => updateLine(line.id, 'quantity', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white !bg-white !text-slate-900"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input 
                      type="number"
                      value={line.rate}
                      onChange={e => updateLine(line.id, 'rate', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white !bg-white !text-slate-900"
                    />
                  </td>
                  <td className="px-6 py-4 text-right font-black text-slate-900">
                    AED {line.total.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <button type="button" onClick={() => handleRemoveItem(line.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-8 bg-slate-50 flex justify-end">
             <div className="w-64 space-y-2">
                <div className="flex justify-between text-lg font-black text-rose-600 border-t pt-2">
                   <span>Order Total</span>
                   <span>AED {total.toLocaleString()}</span>
                </div>
             </div>
          </div>
        </div>
      </form>
    </div>
  );
}
