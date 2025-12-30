
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { salesService } from '../../services/sales.service';
import { itemService } from '../../services/item.service';
import { useAuth } from '../../App';

export default function DeliveryChallanForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const customers = salesService.getCustomers();
  const items = itemService.getItems({}, 1, 999).data;

  const [formData, setFormData] = useState({
    dcNumber: '',
    customerId: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [lines, setLines] = useState<any[]>([{ id: '1', itemId: '', quantity: 1 }]);

  const addLine = () => setLines([...lines, { id: Math.random().toString(), itemId: '', quantity: 1 }]);
  const removeLine = (id: string) => setLines(lines.filter(l => l.id !== id));
  const updateLine = (id: string, field: string, val: any) => setLines(lines.map(l => l.id === id ? { ...l, [field]: val } : l));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || lines.some(l => !l.itemId)) return;

    // STOCK CHECK
    if (!itemService.getSettings().allowNegativeStock) {
      for (const line of lines) {
         const current = itemService.calculateStock(line.itemId);
         if (current < line.quantity) {
           alert(`Insufficient stock for item. Only ${current} available.`);
           return;
         }
      }
    }

    salesService.createDelivery({ ...formData, lines }, user);
    navigate('/sales/delivery-challans');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/sales/delivery-challans')} className="p-2 bg-white border rounded-full"><ArrowLeft size={20}/></button>
        <h1 className="text-2xl font-bold text-slate-900">New Delivery Challan</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase">DC Number</label>
            <input required value={formData.dcNumber} onChange={e => setFormData({...formData, dcNumber: e.target.value})} placeholder="DC-001" className="w-full px-4 py-2 border rounded-xl" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase">Customer</label>
            <select required value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value})} className="w-full px-4 py-2 border rounded-xl">
              <option value="">Select Customer</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="col-span-2 space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase">Date</label>
            <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-2 border rounded-xl" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b flex justify-between">
             <h3 className="text-xs font-black text-slate-900 uppercase">Fulfillment Lines</h3>
             <button type="button" onClick={addLine} className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-1"><Plus size={14}/> Add Item</button>
          </div>
          <table className="w-full text-left">
            <thead className="bg-white text-[10px] font-black text-slate-500 uppercase border-b">
              <tr>
                <th className="px-6 py-4">Item</th>
                <th className="px-6 py-4 w-32">Qty to Ship</th>
                <th className="px-6 py-4 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {lines.map(l => (
                <tr key={l.id}>
                  <td className="px-6 py-4">
                    <select required value={l.itemId} onChange={e => updateLine(l.id, 'itemId', e.target.value)} className="w-full p-2 border rounded-lg">
                      <option value="">Choose Product</option>
                      {items.map(i => <option key={i.id} value={i.id}>{i.name} (Stock: {itemService.calculateStock(i.id)})</option>)}
                    </select>
                  </td>
                  <td className="px-6 py-4"><input type="number" value={l.quantity} onChange={e => updateLine(l.id, 'quantity', Number(e.target.value))} className="w-full p-2 border rounded-lg" /></td>
                  <td className="px-6 py-4"><button type="button" onClick={() => removeLine(l.id)} className="text-red-400"><Trash2 size={16}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-2xl active:scale-95 transition-all">Finalize & Deduct Stock</button>
      </form>
    </div>
  );
}
