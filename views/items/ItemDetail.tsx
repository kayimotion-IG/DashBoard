
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit2, History, Package, BarChart2, 
  Database, Info, Calendar, FileText, User as UserIcon
} from 'lucide-react';
import { itemService } from '../../services/item.service';
import { auditService } from '../../services/audit.service';
import { Item, StockMove } from '../../types';

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<Item | null>(null);
  const [stockInfo, setStockInfo] = useState<{moves: StockMove[], balance: any}>({moves: [], balance: {}});
  const [activeTab, setActiveTab] = useState<'overview' | 'stock' | 'ledger' | 'audit'>('overview');

  useEffect(() => {
    if (id) {
      const i = itemService.getItemById(id);
      if (i) {
        setItem(i);
        setStockInfo(itemService.getStockByItem(id));
      }
    }
  }, [id]);

  if (!item) return <div className="p-20 text-center font-bold text-slate-400">Loading item data...</div>;

  const totalStock = Object.values(stockInfo.balance).reduce((a: any, b: any) => a + b, 0) as number;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/items')} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-500">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900">{item.name}</h1>
              <span className="text-xs font-black px-2 py-0.5 border border-slate-200 text-slate-400 rounded-md font-mono">{item.sku}</span>
            </div>
            <p className="text-sm text-slate-500 font-medium">Created on {new Date(item.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <button 
          onClick={() => navigate(`/items/edit/${item.id}`)}
          className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-bold text-sm shadow-xl active:scale-95 transition-all"
        >
          <Edit2 size={18} />
          Edit Product
        </button>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 pb-px">
        {[
          { id: 'overview', label: 'Overview', icon: <Info size={16} /> },
          { id: 'stock', label: 'Warehouse Stock', icon: <Database size={16} /> },
          { id: 'ledger', label: 'Transaction Ledger', icon: <BarChart2 size={16} /> },
          { id: 'audit', label: 'Audit Log', icon: <History size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2
              ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'}
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'overview' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pricing Details (AED)</label>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between border-b border-slate-50 py-1">
                      <span className="text-sm text-slate-500">Selling Price</span>
                      <span className="text-sm font-black text-slate-900">AED {(Number(item.sellingPrice) || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 py-1">
                      <span className="text-sm text-slate-500">Cost Price</span>
                      <span className="text-sm font-black text-slate-900">AED {(Number(item.purchasePrice) || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 py-1">
                      <span className="text-sm text-slate-500">Gross Margin</span>
                      <span className="text-sm font-black text-emerald-600">
                        {Number(item.sellingPrice) > 0 ? (((Number(item.sellingPrice) - Number(item.purchasePrice)) / Number(item.sellingPrice)) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status & Tax</label>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between border-b border-slate-50 py-1">
                      <span className="text-sm text-slate-500">Status</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${item.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>{item.status}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 py-1">
                      <span className="text-sm text-slate-500">Tax Code</span>
                      <span className="text-sm font-bold text-slate-700">{item.taxCode}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descriptions</label>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase">Sales Description</p>
                    <p className="text-sm text-slate-600 italic">{item.salesDescription || 'No description provided'}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase">Purchase Description</p>
                    <p className="text-sm text-slate-600 italic">{item.purchaseDescription || 'No description provided'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stock' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4 border-b border-slate-100">Warehouse Name</th>
                    <th className="px-6 py-4 border-b border-slate-100">Location</th>
                    <th className="px-6 py-4 border-b border-slate-100 text-right">Stock On Hand</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {itemService.getWarehouses().map(wh => (
                    <tr key={wh.id}>
                      <td className="px-6 py-4 text-sm font-bold text-slate-800">{wh.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{wh.location}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-sm font-black ${ (stockInfo.balance[wh.id] || 0) <= (Number(item.reorderLevel) || 0) ? 'text-red-500' : 'text-slate-900' }`}>
                          {stockInfo.balance[wh.id] || 0} {item.unit}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'ledger' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4 border-b">Date</th>
                    <th className="px-6 py-4 border-b">Ref</th>
                    <th className="px-6 py-4 border-b">In</th>
                    <th className="px-6 py-4 border-b">Out</th>
                    <th className="px-6 py-4 border-b">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockInfo.moves.map(m => (
                    <tr key={m.id} className="text-sm">
                      <td className="px-6 py-4 text-slate-500">{new Date(m.timestamp).toLocaleDateString()}</td>
                      <td className="px-6 py-4"><span className="font-bold text-slate-700">{m.refType}</span><br/><small className="text-slate-400">{m.refNo}</small></td>
                      <td className="px-6 py-4 font-black text-emerald-600">+{m.inQty}</td>
                      <td className="px-6 py-4 font-black text-red-600">-{m.outQty}</td>
                      <td className="px-6 py-4 text-slate-500">{m.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-4">
              {auditService.getLogs().filter(l => l.entityId === item.id).map(log => (
                <div key={log.id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-start gap-4 shadow-sm">
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><UserIcon size={18} /></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900">{log.userName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-black uppercase tracking-tighter">{log.action}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{log.details}</p>
                    <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1 font-mono uppercase tracking-widest"><Calendar size={10} /> {new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Stock Summary</h4>
            <div className="text-center py-6 border-b border-slate-50">
              <p className="text-5xl font-black text-slate-900">{totalStock}</p>
              <p className="text-xs font-bold text-slate-500 uppercase mt-2">Available {item.unit}</p>
            </div>
            <div className="pt-4 grid grid-cols-2 gap-4">
              <div className="text-center border-r border-slate-50">
                <p className="text-sm font-black text-amber-600">{Number(item.reorderLevel) || 0}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Reorder Pt</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-black text-blue-600">{Number(item.reorderQty) || 0}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Batch Qty</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl shadow-xl">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Tracking Code</h4>
            <div className="bg-white p-4 rounded-xl flex items-center justify-center border-2 border-slate-800">
              <div className="w-full h-12 bg-slate-100 flex items-center justify-center font-mono font-bold text-slate-400 text-sm tracking-[0.5em]">
                || ||| | || | |||
              </div>
            </div>
            <p className="text-center text-white font-mono text-xs mt-3 tracking-widest">{item.barcode || item.sku}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
