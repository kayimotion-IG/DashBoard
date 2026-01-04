import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Plus, Edit2, Trash2, Eye, FileUp, ChevronLeft, ChevronRight, RefreshCw, Loader2, FileDown } from 'lucide-react';
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
    // Fix: Ensure the effect destructor returns void, as unsubscribe() returns a boolean from Set.delete
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Items Catalog</h1>
          <p className="text-slate-500 text-sm">Persistent Vault Active.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExport}
            disabled={exporting}
            className="p-2 bg-white border rounded-xl flex items-center gap-2 px-4 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
          >
            {exporting ? <Loader2 size={18} className="animate-spin"/> : <FileDown size={18}/>}
            {exporting ? 'Generating...' : 'Download CSV'}
          </button>
          <button onClick={() => navigate('/items/import')} className="p-2 bg-white border rounded-xl flex items-center gap-2 px-4 text-sm font-bold text-slate-600"> <FileUp size={18}/> Bulk Import </button>
          <button onClick={() => navigate('/items/new')} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2">
            <Plus size={18}/> New Item
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b flex items-center gap-4 bg-slate-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search SKU or Name..." 
              className="w-full max-w-md pl-10 pr-4 py-2 border rounded-xl outline-none focus:ring-4 focus:ring-blue-50 transition-all !bg-white" 
              value={filters.search}
              onChange={e => setFilters({...filters, search: e.target.value})}
            />
          </div>
          {loading && <Loader2 className="animate-spin text-blue-600" size={20} />}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 tracking-widest border-b">
              <tr>
                <th className="px-6 py-4">Item Details</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Price</th>
                <th className="px-6 py-4 text-right">Stock</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.length === 0 && !loading ? (
                <tr><td colSpan={5} className="py-20 text-center text-slate-300 italic">No items found. Try a different search or create one.</td></tr>
              ) : items.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 group cursor-pointer" onClick={() => navigate(`/items/${item.id}`)}>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{item.sku}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.category}</td>
                  <td className="px-6 py-4 text-right font-black text-slate-900">AED {item.sellingPrice.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-bold text-blue-600">
                    {itemService.calculateStock(item.id)} {item.unit}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                       <button onClick={(e) => { e.stopPropagation(); navigate(`/items/edit/${item.id}`); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-100 shadow-none hover:shadow-sm"><Edit2 size={16}/></button>
                       <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id, item.name); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-100 shadow-none hover:shadow-sm"><Trash2 size={16}/></button>
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