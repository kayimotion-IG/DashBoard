
import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Plus, Edit2, Trash2, Eye, FileUp, ChevronLeft, ChevronRight, RefreshCw, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { itemService } from '../services/item.service';
import { Item } from '../types';

const ItemsList = () => {
  const navigate = useNavigate();
  const { user, can } = useAuth();
  
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', category: '', status: '', type: '' });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await itemService.getItems(filters, page, 10);
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
  }, [page, filters]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    // Fixed: Signature of deleteItem now correctly handles the optional user argument
    await itemService.deleteItem(id, user);
    fetchItems();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Items Catalog</h1>
          <p className="text-slate-500 text-sm">Persistent SQLite Storage active.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchItems} className="p-2 bg-white border rounded-xl"><RefreshCw size={18} className={loading ? 'animate-spin' : ''}/></button>
          <button onClick={() => navigate('/items/new')} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2">
            <Plus size={18}/> New Item
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <input 
            type="text" 
            placeholder="Search SKU or Name..." 
            className="w-full max-w-md px-4 py-2 border rounded-xl !bg-white !text-slate-900" 
            value={filters.search}
            onChange={e => setFilters({...filters, search: e.target.value})}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 tracking-widest">
              <tr>
                <th className="px-6 py-4">Item Details</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Price</th>
                <th className="px-6 py-4 text-right">Stock</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600"/></td></tr>
              ) : items.map(item => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{item.sku}</p>
                  </td>
                  <td className="px-6 py-4 text-sm">{item.category}</td>
                  <td className="px-6 py-4 text-right font-black">AED {item.sellingPrice}</td>
                  {/* Fixed: Pass item.id string instead of the full item object */}
                  <td className="px-6 py-4 text-right font-bold text-blue-600">{itemService.calculateStock(item.id)}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete(item.id, item.name)} className="text-red-400 p-2"><Trash2 size={16}/></button>
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
