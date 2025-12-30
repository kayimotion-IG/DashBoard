
import React, { useState } from 'react';
import { 
  Plus, History, Search, ArrowLeft, Save, 
  Trash2, Filter, AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import { itemService } from '../../services/item.service';

export default function Adjustments() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    itemId: '',
    warehouseId: 'WH01',
    qty: 0,
    type: 'IN' as 'IN' | 'OUT',
    reason: 'Correction',
    note: ''
  });

  const adjustments = itemService.getAdjustments().reverse();
  const warehouses = itemService.getWarehouses();
  const items = itemService.getItems({ status: 'Active' }, 1, 999).data;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemId || formData.qty <= 0) return;

    itemService.addStockMove({
      itemId: formData.itemId,
      warehouseId: formData.warehouseId,
      refType: 'ADJUSTMENT',
      refNo: `ADJ-${Date.now().toString().slice(-6)}`,
      inQty: formData.type === 'IN' ? Number(formData.qty) : 0,
      outQty: formData.type === 'OUT' ? Number(formData.qty) : 0,
      note: `Reason: ${formData.reason}. ${formData.note}`
    });

    setShowForm(false);
    setFormData({ itemId: '', warehouseId: 'WH01', qty: 0, type: 'IN', reason: 'Correction', note: '' });
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/inventory/dashboard')} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-500">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Stock Adjustments</h1>
            <p className="text-slate-500 text-sm">Correct inventory discrepancies and log damaged goods.</p>
          </div>
        </div>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-sm shadow-xl active:scale-95 transition-all"
          >
            <Plus size={18} />
            New Adjustment
          </button>
        )}
      </div>

      {showForm ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Adjustment Details</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Item</label>
              <select 
                value={formData.itemId}
                onChange={e => setFormData({...formData, itemId: e.target.value})}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none bg-white text-sm"
              >
                <option value="">Choose item...</option>
                {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Warehouse</label>
              <select 
                value={formData.warehouseId}
                onChange={e => setFormData({...formData, warehouseId: e.target.value})}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none bg-white text-sm"
              >
                {warehouses.map(wh => <option key={wh.id} value={wh.id}>{wh.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Correction Type</label>
              <div className="flex p-1 bg-slate-100 rounded-xl">
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, type: 'IN'})}
                  className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${formData.type === 'IN' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
                >
                  ADD STOCK
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, type: 'OUT'})}
                  className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${formData.type === 'OUT' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400'}`}
                >
                  REMOVE STOCK
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity</label>
              <input 
                type="number"
                value={formData.qty}
                onChange={e => setFormData({...formData, qty: Number(e.target.value)})}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reason</label>
              <select 
                value={formData.reason}
                onChange={e => setFormData({...formData, reason: e.target.value})}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none bg-white text-sm"
              >
                <option value="Correction">Data Correction</option>
                <option value="Damage">Damage</option>
                <option value="Shrinkage">Shrinkage / Theft</option>
                <option value="Found">Found during audit</option>
              </select>
            </div>
            <div className="space-y-1 md:col-span-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notes</label>
              <textarea 
                value={formData.note}
                onChange={e => setFormData({...formData, note: e.target.value})}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 text-sm h-20"
                placeholder="Brief explanation for this adjustment..."
              />
            </div>
            <div className="md:col-span-3 flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 text-sm font-bold text-slate-500">Cancel</button>
              <button type="submit" className="flex items-center gap-2 px-8 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-xl active:scale-95 transition-all">
                <Save size={18} />
                Save Adjustment
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="Search Adjustments..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl w-full outline-none text-xs" />
            </div>
            <button className="flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:bg-white rounded-lg border border-slate-200 text-xs font-bold transition-all">
              <Filter size={14} />
              Filter Reasons
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Ref #</th>
                  <th className="px-6 py-4">Item</th>
                  <th className="px-6 py-4">Warehouse</th>
                  <th className="px-6 py-4">Quantity</th>
                  <th className="px-6 py-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adjustments.length > 0 ? adjustments.map(adj => {
                  const item = itemService.getItemById(adj.itemId);
                  return (
                    <tr key={adj.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 text-xs text-slate-500">{new Date(adj.timestamp).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-mono text-[10px] font-bold text-blue-600">{adj.refNo}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-900">{item?.name}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-black">{item?.sku}</p>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 font-medium">{adj.warehouseId}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border ${
                          adj.inQty > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
                        }`}>
                          {adj.inQty > 0 ? `+ ${adj.inQty}` : `- ${adj.outQty}`}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 italic max-w-xs truncate">{adj.note}</td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm italic">No adjustments found in the ledger.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
