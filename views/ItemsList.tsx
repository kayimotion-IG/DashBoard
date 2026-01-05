
import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Plus, Edit2, Trash2, Eye, FileUp, ChevronLeft, ChevronRight, RefreshCw, Loader2, FileDown, Package } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { itemService } from '../services/item.service';
import { backupService } from '../services/backup.service';
import { Item } from '../types';

const ItemsList = () => {
  const navigate = useNavigate();
  const { user, can } = useAuth();
  
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', category: '', status: '', type: '' });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await itemService.getItems(filters, page, 50);
      setItems(res.data);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    const unsubscribe = itemService.onChange(() => {
      fetchItems();
    });
    return () => {
      unsubscribe();
    };
  }, [page, filters]);

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      backupService.exportItems();
      setExporting(false);
    }, 800);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    await itemService.deleteItem(id, user);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Items Catalog</h1>
          <p className="text-slate-500 text-sm font-medium">Persistent Vault Active.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExport}
            disabled={exporting}
            className="p-2 bg-white border border-slate-200 rounded-xl flex items-center gap-2 px-4 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm"
          >
            {exporting ? <Loader2 size={18} className="animate-spin"/> : <FileDown size={18}/>}
            {exporting ? 'Generating...' : 'Download CSV'}
          </button>
          <button onClick={() => navigate('/items/import')} className="p-2 bg-white border border-slate-200 rounded-xl flex items-center gap-2 px-4 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition-all"> <FileUp size={18}/> Bulk Import </button>
          <button onClick={() => navigate('/items/new')} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-xl shadow-blue-600/20 active:scale-95 transition-all">
            <Plus size={18}/> New Item
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search SKU or Name..." 
              className="w-full max-w-md pl-12 pr-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 transition-all !bg-white font-medium text-sm shadow-sm" 
              value={filters.search}
              onChange={e => setFilters({...filters, search: e.target.value})}
            />
          </div>
          {loading && <Loader2 className="animate-spin text-blue-600" size={20} />}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-50">
              <tr>
                <th className="px-8 py-5">Item Details</th>
                <th className="px-6 py-5">Category</th>
                <th className="px-6 py-5 text-right">Price</th>
                <th className="px-6 py-5 text-right">Stock</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.length === 0 && !loading ? (
                <tr><td colSpan={5} className="py-24 text-center text-slate-300 italic font-medium">No items found. Try a different search or create one.</td></tr>
              ) : items.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 group cursor-pointer" onClick={() => navigate(`/items/${item.id}`)}>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                          {item.imageUrl ? (
                             <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name} />
                          ) : (
                             <Package size={18} className="text-slate-400" />
                          )}
                       </div>
                       <div>
                         <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-sm">{item.name}</p>
                         <p className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase">{item.sku}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">{item.category}</td>
                  <td className="px-6 py-5 text-right font-black text-slate-900">AED {item.sellingPrice.toLocaleString()}</td>
                  <td className="px-6 py-5 text-right font-bold">
                    <span className={`px-3 py-1 rounded-lg text-xs ${itemService.calculateStock(item.id) <= (item.reorderLevel || 0) ? 'bg-rose-50 text-rose-600' : 'text-blue-600 bg-blue-50'}`}>
                      {itemService.calculateStock(item.id)} {item.unit}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={(e) => { e.stopPropagation(); navigate(`/items/edit/${item.id}`); }} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all shadow-none hover:shadow-md border border-transparent hover:border-slate-100"><Edit2 size={18}/></button>
                       <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id, item.name); }} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-xl transition-all shadow-none hover:shadow-md border border-transparent hover:border-slate-100"><Trash2 size={18}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ItemsList;
