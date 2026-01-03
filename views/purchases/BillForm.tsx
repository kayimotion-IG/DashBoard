
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Receipt, ClipboardList, Info, Truck, ChevronDown, Package } from 'lucide-react';
import { purchaseService } from '../../services/purchase.service';
import { useAuth } from '../../App';
import { PurchaseOrder } from '../../types';

export default function BillForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const vendors = purchaseService.getVendors();

  const [formData, setFormData] = useState({
    billNumber: `BIL-${Date.now().toString().slice(-4)}`,
    vendorId: '',
    poId: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    total: 0,
    notes: ''
  });

  const [lines, setLines] = useState<any[]>([]);

  // Connectivity: Filter POs for this vendor that aren't already billed
  const pendingPOs = useMemo(() => {
    if (!formData.vendorId) return [];
    return purchaseService.getPurchaseOrders().filter(po => 
      po.vendorId === formData.vendorId && po.status === 'Issued'
    );
  }, [formData.vendorId, purchaseService.getPurchaseOrders()]);

  const applyPOData = (poId: string) => {
    const po = pendingPOs.find(p => p.id === poId);
    if (po) {
      setFormData(prev => ({
        ...prev,
        poId: po.id,
        total: po.total,
        notes: `Converted from PO #${po.poNumber}`
      }));
      setLines(po.lines);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendorId || formData.total <= 0) {
      alert('Missing required fields.');
      return;
    }
    
    await purchaseService.createBill({
      ...formData,
      lines
    }, user);

    navigate('/purchases/bills');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/purchases/bills')} className="p-2 bg-white border rounded-full text-slate-500 hover:bg-slate-50"><ArrowLeft size={20}/></button>
        <h1 className="text-2xl font-bold text-slate-900">Record Vendor Bill</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-2xl space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Supplier / Vendor</label>
            <select 
              required 
              value={formData.vendorId} 
              onChange={e => {
                setFormData({...formData, vendorId: e.target.value, poId: ''});
                setLines([]);
              }} 
              className="w-full px-4 py-3 border border-slate-200 rounded-2xl outline-none bg-white font-bold text-sm"
            >
              <option value="">Select Vendor...</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-rose-600 uppercase tracking-widest ml-1 flex items-center gap-1">Link Pending Purchase Order</label>
            <select 
              disabled={!formData.vendorId || pendingPOs.length === 0}
              value={formData.poId}
              onChange={e => applyPOData(e.target.value)}
              className="w-full px-4 py-3 border border-rose-200 rounded-2xl outline-none bg-rose-50/50 text-sm font-bold text-rose-800 disabled:opacity-30"
            >
              <option value="">{pendingPOs.length > 0 ? '-- Choose PO to Convert --' : 'No Pending POs found'}</option>
              {pendingPOs.map(po => <option key={po.id} value={po.id}>{po.poNumber} (AED {po.total.toLocaleString()})</option>)}
            </select>
          </div>
        </div>

        {lines.length > 0 && (
          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 animate-in slide-in-from-top-2">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Package size={14}/> Imported Items</h4>
            <div className="space-y-2">
              {lines.map((l, i) => (
                <div key={i} className="flex justify-between text-sm font-bold text-slate-700 bg-white p-3 rounded-xl border">
                  <span>{l.itemName} (x{l.quantity})</span>
                  <span>AED {l.total.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6 pt-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bill Reference #</label>
            <input required value={formData.billNumber} onChange={e => setFormData({...formData, billNumber: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none font-bold" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Due Date</label>
            <input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none" />
          </div>
        </div>

        <div className="space-y-1 pt-4">
          <label className="text-[10px] font-black text-rose-600 uppercase tracking-widest ml-1">Total Payable Amount (AED)</label>
          <input 
            type="number" 
            required 
            value={formData.total} 
            onChange={e => setFormData({...formData, total: Number(e.target.value)})} 
            className="w-full px-4 py-4 border border-rose-200 rounded-[20px] text-3xl font-black text-rose-600 focus:ring-4 focus:ring-rose-50 outline-none" 
          />
        </div>

        <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black uppercase text-sm tracking-[0.2em] shadow-2xl active:scale-95 transition-all">Post Bill & Update Stock</button>
      </form>
    </div>
  );
}
