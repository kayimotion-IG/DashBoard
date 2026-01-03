
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Package } from 'lucide-react';
import { purchaseService } from '../../services/purchase.service';
import { itemService } from '../../services/item.service';
import { useAuth } from '../../App';

export default function GoodsReceiveForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const vendors = purchaseService.getVendors();
  const items = itemService.getItems({}, 1, 999).data;

  const [formData, setFormData] = useState({
    receiveNo: '',
    vendorId: '',
    date: new Date().toISOString().split('T')[0],
    warehouseId: 'WH01'
  });

  const [lines, setLines] = useState<any[]>([{ id: '1', itemId: '', quantity: 1, unitCost: 0 }]);

  const addLine = () => setLines([...lines, { id: Math.random().toString(), itemId: '', quantity: 1, unitCost: 0 }]);
  const removeLine = (id: string) => setLines(lines.filter(l => l.id !== id));
  
  const updateLine = (id: string, field: string, val: any) => {
    setLines(lines.map(l => l.id === id ? { ...l, [field]: val } : l));
  };

  // Fixed: Made handleSubmit async to correctly await the createGRN call
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendorId || lines.some(l => !l.itemId)) return;
    
    await purchaseService.createGRN({
      ...formData,
      lines,
      total: lines.reduce((s, l) => s + (l.quantity * l.unitCost), 0)
    }, user);
    
    navigate('/purchases/receives');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/purchases/receives')} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-500 bg-white border border-slate-200"><ArrowLeft size={20}/></button>
          <h1 className="text-2xl font-bold text-slate-900">New Goods Receive (GRN)</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Receive No</label>
            <input required value={formData.receiveNo} onChange={e => setFormData({...formData, receiveNo: e.target.value})} placeholder="e.g. GRN-0001" className="w-full px-4 py-2 border rounded-xl" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor</label>
            <select required value={formData.vendorId} onChange={e => setFormData({...formData, vendorId: e.target.value})} className="w-full px-4 py-2 border rounded-xl">
              <option value="">Select Vendor</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Receive Date</label>
            <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-2 border rounded-xl" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b flex justify-between">
             <h3 className="text-xs font-black text-slate-900 uppercase">Items Received</h3>
             <button type="button" onClick={addLine} className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-1"><Plus size={14}/> Add Item</button>
          </div>
          <table className="w-full text-left">
            <thead className="bg-white text-[10px] font-black text-slate-500 uppercase border-b">
              <tr>
                <th className="px-6 py-4">Item</th>
                <th className="px-6 py-4 w-32">Qty</th>
                <th className="px-6 py-4 w-40">Unit Cost</th>
                <th className="px-6 py-4 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {lines.map(l => (
                <tr key={l.id}>
                  <td className="px-6 py-4">
                    <select required value={l.itemId} onChange={e => updateLine(l.id, 'itemId', e.target.value)} className="w-full p-2 border rounded-lg">
                      <option value="">Choose Product</option>
                      {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
                    </select>
                  </td>
                  <td className="px-6 py-4"><input type="number" value={l.quantity} onChange={e => updateLine(l.id, 'quantity', Number(e.target.value))} className="w-full p-2 border rounded-lg" /></td>
                  <td className="px-6 py-4"><input type="number" value={l.unitCost} onChange={e => updateLine(l.id, 'unitCost', Number(e.target.value))} className="w-full p-2 border rounded-lg" /></td>
                  <td className="px-6 py-4"><button type="button" onClick={() => removeLine(l.id)} className="text-red-400"><Trash2 size={16}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end p-6 border-t bg-slate-50 rounded-2xl">
          <button type="submit" className="flex items-center gap-2 px-10 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg active:scale-95 transition-all">
            <Save size={18}/> Post GRN & Update Stock
          </button>
        </div>
      </form>
    </div>
  );
}
