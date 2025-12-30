
import React, { useState } from 'react';
import { 
  Boxes, Hammer, ArrowLeft, Plus, ChevronRight, 
  Trash2, Package, CheckCircle2, AlertTriangle, Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import { itemService } from '../../services/item.service';

export default function Assemblies() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'build'>('list');
  const [selectedAssyId, setSelectedAssyId] = useState<string | null>(null);
  const [buildQty, setBuildQty] = useState(1);
  const [warehouseId, setWarehouseId] = useState('WH01');
  
  const assemblies = itemService.getAssemblies();
  const items = itemService.getItems({ status: 'Active' }, 1, 999).data;
  const warehouses = itemService.getWarehouses();

  const handleBuild = () => {
    if (!selectedAssyId) return;
    try {
      itemService.buildAssembly(selectedAssyId, warehouseId, buildQty, user);
      alert('Build successful! Ledger entries created.');
      setActiveTab('list');
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/inventory/dashboard')} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-500">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Product Assemblies</h1>
            <p className="text-slate-500 text-sm">Define Bill of Materials (BOM) and build finished goods.</p>
          </div>
        </div>
        <div className="flex gap-2">
          {activeTab === 'list' && (
            <button 
              onClick={() => setActiveTab('create')}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-sm shadow-xl active:scale-95 transition-all"
            >
              <Plus size={18} />
              Define New Assembly
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 pb-px mb-6">
        <button onClick={() => setActiveTab('list')} className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'list' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Assembly Catalog</button>
        <button onClick={() => setActiveTab('build')} className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'build' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Production Build</button>
      </div>

      {activeTab === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assemblies.length > 0 ? assemblies.map(assy => {
            const finished = itemService.getItemById(assy.finishedItemId);
            return (
              <div key={assy.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black text-xs">BOM</div>
                    <div>
                      <p className="text-sm font-black text-slate-900">{finished?.name}</p>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{finished?.sku}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setSelectedAssyId(assy.id); setActiveTab('build'); }}
                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                  >
                    <Hammer size={18} />
                  </button>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Ingredients / Components</p>
                  {assy.components.map(comp => {
                    const cItem = itemService.getItemById(comp.itemId);
                    return (
                      <div key={comp.itemId} className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-medium">{cItem?.name}</span>
                        <span className="font-black text-slate-900">{comp.quantity} {cItem?.unit}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }) : (
            <div className="col-span-2 py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
              <Boxes size={48} className="text-slate-200 mb-4" />
              <h3 className="text-lg font-bold text-slate-400">No Assemblies Defined</h3>
              <p className="text-sm text-slate-300 max-w-xs mt-2">Start by mapping components to finished products for automated production tracking.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'build' && (
        <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="bg-slate-900 p-8 text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg"><Hammer size={24} /></div>
              <div>
                <h3 className="text-xl font-black tracking-tight">Production Build Order</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Assembly Production Unit</p>
              </div>
            </div>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Assembly BOM</label>
              <select 
                value={selectedAssyId || ''}
                onChange={e => setSelectedAssyId(e.target.value)}
                className="w-full px-4 py-4 border border-slate-200 rounded-2xl outline-none bg-slate-50 font-bold text-slate-800 text-lg"
              >
                <option value="">Select a recipe...</option>
                {assemblies.map(a => <option key={a.id} value={a.id}>{itemService.getItemById(a.finishedItemId)?.name}</option>)}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Warehouse</label>
                <select 
                  value={warehouseId}
                  onChange={e => setWarehouseId(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none bg-white text-sm"
                >
                  {warehouses.map(wh => <option key={wh.id} value={wh.id}>{wh.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Build Quantity</label>
                <input 
                  type="number"
                  value={buildQty}
                  onChange={e => setBuildQty(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none bg-white text-sm font-black"
                />
              </div>
            </div>

            {selectedAssyId && (
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">Component Requirements</h4>
                {assemblies.find(a => a.id === selectedAssyId)?.components.map(comp => {
                  const cItem = itemService.getItemById(comp.itemId);
                  const currentStock = itemService.calculateStock(comp.itemId, warehouseId);
                  const needed = comp.quantity * buildQty;
                  const isEnough = currentStock >= needed || itemService.getSettings().allowNegativeStock;
                  
                  return (
                    <div key={comp.itemId} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {isEnough ? <CheckCircle2 size={14} className="text-emerald-500" /> : <AlertTriangle size={14} className="text-red-500" />}
                        <span className="font-bold text-slate-700">{cItem?.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-900">{needed} {cItem?.unit} needed</p>
                        <p className="text-[10px] text-slate-400">Avail: {currentStock}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button 
              onClick={handleBuild}
              disabled={!selectedAssyId || buildQty <= 0}
              className="w-full flex items-center justify-center gap-3 py-4 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-2xl hover:bg-slate-800 disabled:opacity-30 transition-all active:scale-95"
            >
              <Hammer size={24} />
              Execute Build
            </button>
          </div>
        </div>
      )}

      {activeTab === 'create' && (
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
           <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-900">Define Assembly BOM</h3>
              <button onClick={() => setActiveTab('list')} className="text-slate-400 hover:text-slate-600"><Plus className="rotate-45" /></button>
           </div>
           <p className="p-4 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl flex items-center gap-2">
             <Settings size={16} /> Note: An assembly links multiple "Ingredient" items to one "Finished Good" item.
           </p>
           <div className="space-y-4">
             <p className="text-center text-slate-400 italic text-sm py-10">BOM creation interface is simplified for this version. Select an existing item to define it as a finished assembly.</p>
             <div className="grid grid-cols-2 gap-4">
               {items.slice(0, 4).map(i => (
                 <button 
                   key={i.id}
                   onClick={() => {
                      itemService.createAssembly({
                        finishedItemId: i.id,
                        components: [{ itemId: 'ITM-001', quantity: 1 }, { itemId: 'ITM-002', quantity: 2 }]
                      }, user);
                      setActiveTab('list');
                   }}
                   className="p-4 border border-slate-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50/30 transition-all text-left group"
                 >
                   <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600">{i.name}</p>
                   <p className="text-[10px] text-slate-400 font-black uppercase">SKU: {i.sku}</p>
                 </button>
               ))}
             </div>
           </div>
        </div>
      )}
    </div>
  );
}
