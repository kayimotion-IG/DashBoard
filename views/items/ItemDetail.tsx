
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit2, History, Package, BarChart2, 
  Database, Info, Calendar, FileText, User as UserIcon,
  Maximize2, Image as ImageIcon, Clock
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
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/items')} className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm rounded-xl transition-all text-slate-500">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{item.name}</h1>
              <span className="text-xs font-black px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-400 rounded-md font-mono">{item.sku}</span>
            </div>
            <p className="text-sm text-slate-500 font-medium">System Entry Date: {new Date(item.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <button 
          onClick={() => navigate(`/items/edit/${item.id}`)}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-sm shadow-xl active:scale-95 transition-all shadow-blue-600/20"
        >
          <Edit2 size={18} />
          Modify Record
        </button>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 pb-px">
        {[
          { id: 'overview', label: 'Identity Overview', icon: <Info size={16} /> },
          { id: 'stock', label: 'Warehouse Stock', icon: <Database size={16} /> },
          { id: 'ledger', label: 'Transaction Ledger', icon: <BarChart2 size={16} /> },
          { id: 'audit', label: 'Audit Log', icon: <History size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2
              ${activeTab === tab.id ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'}
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
               {/* Gallery Hero Section */}
               <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm flex flex-col md:flex-row">
                  <div className="w-full md:w-1/2 aspect-square md:aspect-auto bg-slate-50 border-r border-slate-100 relative group">
                     {item.imageUrl ? (
                        <img src={item.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={item.name} />
                     ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-3">
                           <ImageIcon size={64} />
                           <span className="text-[10px] font-black uppercase tracking-widest">No Media Provided</span>
                        </div>
                     )}
                     <div className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur rounded-lg text-slate-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <Maximize2 size={18}/>
                     </div>
                  </div>
                  <div className="w-full md:w-1/2 p-10 flex flex-col justify-center space-y-8">
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Item Classification</p>
                        <div className="flex flex-wrap gap-2">
                           <span className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-[10px] font-black uppercase tracking-widest">{item.category}</span>
                           <span className="px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest">{item.itemType}</span>
                           <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[10px] font-black uppercase tracking-widest">{item.status}</span>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <div className="flex items-baseline justify-between border-b border-slate-50 pb-2">
                           <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Market Price</span>
                           <span className="text-xl font-black text-slate-900">AED {item.sellingPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex items-baseline justify-between border-b border-slate-50 pb-2">
                           <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Inventory Basis</span>
                           <span className="text-sm font-black text-slate-700">AED {item.purchasePrice.toLocaleString()}</span>
                        </div>
                        <div className="flex items-baseline justify-between">
                           <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Profit Contribution</span>
                           <span className="text-sm font-black text-emerald-600">+AED {(item.sellingPrice - item.purchasePrice).toLocaleString()}</span>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Sales Description</p>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium italic">"{item.salesDescription || 'Default commercial description not set for this entity.'}"</p>
                    </div>
                    <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Manufacturer Specifications</p>
                      <div className="space-y-3">
                         <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Brand</span>
                            <span className="font-bold text-slate-900">{item.brand || '-'}</span>
                         </div>
                         <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Barcode / UPC</span>
                            <span className="font-mono text-slate-900">{item.barcode || 'UNREGISTERED'}</span>
                         </div>
                      </div>
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
                    <tr key={wh.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 text-sm font-bold text-slate-800">{wh.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{wh.location}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`px-3 py-1 rounded-lg text-xs font-black ${ (stockInfo.balance[wh.id] || 0) <= (Number(item.reorderLevel) || 0) ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600' }`}>
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
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4 border-b">Movement Date</th>
                    <th className="px-6 py-4 border-b">Reference</th>
                    <th className="px-6 py-4 border-b">Inbound</th>
                    <th className="px-6 py-4 border-b">Outbound</th>
                    <th className="px-6 py-4 border-b">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockInfo.moves.map(m => (
                    <tr key={m.id} className="text-sm">
                      <td className="px-6 py-4 text-slate-500">{new Date(m.timestamp).toLocaleDateString()}</td>
                      <td className="px-6 py-4"><span className="font-bold text-slate-700 uppercase tracking-tighter text-xs">{m.refType}</span><br/><small className="text-[10px] text-slate-400 font-mono">{m.refNo}</small></td>
                      <td className="px-6 py-4 font-black text-emerald-600">+{m.inQty}</td>
                      <td className="px-6 py-4 font-black text-red-600">-{m.outQty}</td>
                      <td className="px-6 py-4 text-xs text-slate-400 italic truncate max-w-[150px]">{m.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-4">
              {auditService.getLogs().filter(l => l.entityId === item.id).map(log => (
                <div key={log.id} className="bg-white p-5 rounded-3xl border border-slate-200 flex items-start gap-5 shadow-sm transition-all hover:shadow-md">
                  <div className="p-2.5 bg-slate-50 rounded-2xl text-slate-400"><UserIcon size={20} /></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                         <span className="text-sm font-black text-slate-900">{log.userName}</span>
                         <span className="text-[9px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-black uppercase tracking-widest">{log.action}</span>
                      </div>
                      {/* Fixed Error in file views/items/ItemDetail.tsx on line 214: Added missing Clock import */}
                      <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest flex items-center gap-1"><Clock size={10} /> {new Date(log.timestamp).toLocaleString()}</p>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">{log.details}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl text-white relative overflow-hidden">
            <div className="absolute bottom-0 right-0 -mb-10 -mr-10 w-40 h-40 bg-blue-600 rounded-full blur-[80px] opacity-20"></div>
            <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-6">Stock Health Matrix</h4>
            <div className="text-center py-6 border-b border-white/5">
              <p className="text-6xl font-black">{totalStock}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3">Available {item.unit}</p>
            </div>
            <div className="pt-6 grid grid-cols-2 gap-4">
              <div className="text-center border-r border-white/5">
                <p className="text-sm font-black text-amber-500">{Number(item.reorderLevel) || 0}</p>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Threshold</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-black text-blue-400">{Number(item.reorderQty) || 0}</p>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Batch Qty</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><BarChart2 size={14} className="text-blue-500"/> Physical Metrics</h4>
            <div className="space-y-5">
               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Weight</span>
                  <span className="text-sm font-black text-slate-900">{item.weight} {item.weightUnit}</span>
               </div>
               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dimensions</span>
                  <span className="text-xs font-black text-slate-900">{item.length}x{item.width}x{item.height} {item.dimensionUnit}</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
