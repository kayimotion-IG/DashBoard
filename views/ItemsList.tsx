
import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Plus, Edit2, Trash2, Eye, FileUp, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { itemService } from '../services/item.service';
import { Item } from '../types';

const ItemsList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, can } = useAuth();
  
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', category: '', status: '', type: '' });

  const fetchItems = () => {
    const queryParams = new URLSearchParams(location.search);
    const shouldReset = queryParams.get('reset') === '1';
    
    const activeFilters = shouldReset ? { reset: '1' } : filters;
    const res = itemService.getItems(activeFilters, page, 10);
    
    setItems(res.data);
    setTotal(res.total);

    if (shouldReset) {
      setFilters({ search: '', category: '', status: '', type: '' });
      window.history.replaceState({}, '', location.pathname);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [page, filters, location.search]);

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    itemService.deleteItem(id, user);
    fetchItems();
  };

  const handleExport = () => {
    const allData = itemService.getItems(filters, 1, 99999).data;
    const headers = ['ID', 'Name', 'SKU', 'Category', 'Price', 'Status'].join(',');
    const rows = allData.map(i => `${i.id},"${i.name}",${i.sku},${i.category},${i.sellingPrice},${i.status}`).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `klencare_items_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Items</h1>
          <p className="text-slate-500 text-sm">Central product catalog with multi-warehouse stock levels.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/items?reset=1')}
            className="p-2 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-blue-600 transition-all shadow-sm"
            title="Force Reset Filters"
          >
            <RefreshCw size={18} />
          </button>
          {can('items.import') && (
            <button 
              onClick={() => navigate('/items/import')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-bold text-sm transition-all"
            >
              <FileUp size={18} />
              Import
            </button>
          )}
          {can('items.export') && (
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-bold text-sm transition-all"
            >
              <Download size={18} />
              Export
            </button>
          )}
          {can('items.create') && (
            <button 
              onClick={() => navigate('/items/new')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 font-bold text-sm transition-all active:scale-95"
            >
              <Plus size={18} />
              New Product
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative col-span-1 md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="SKU or Name..." 
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl w-full outline-none focus:ring-2 focus:ring-blue-100 text-sm !bg-white !text-slate-900"
            />
          </div>
          <select 
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="px-3 py-2 border border-slate-200 rounded-xl outline-none text-sm bg-white !bg-white !text-slate-900"
          >
            <option value="">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Furniture">Furniture</option>
            <option value="Accessories">Accessories</option>
          </select>
          <select 
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="px-3 py-2 border border-slate-200 rounded-xl outline-none text-sm bg-white !bg-white !text-slate-900"
          >
            <option value="">All Types</option>
            <option value="Inventory">Inventory</option>
            <option value="Service">Service</option>
          </select>
          <select 
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-slate-200 rounded-xl outline-none text-sm bg-white !bg-white !text-slate-900"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Item Details</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4 text-right">Price (AED)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length > 0 ? items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 font-bold text-[10px] border border-slate-200">IMG</div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{item.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase">{item.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-600">{item.category}</td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-600">{item.itemType}</td>
                  <td className="px-6 py-4 text-sm font-black text-slate-900">AED {(Number(item.sellingPrice) || 0).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                      item.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => navigate(`/items/${item.id}`)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="View Detail">
                        <Eye size={18} />
                      </button>
                      {can('items.edit') && (
                        <button onClick={() => navigate(`/items/edit/${item.id}`)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" title="Edit">
                          <Edit2 size={18} />
                        </button>
                      )}
                      {can('items.delete') && (
                        <button onClick={() => handleDelete(item.id, item.name)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm italic">No items found matching your filters. Click the refresh button to clear filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-400">Total Items: {total}</p>
          <div className="flex items-center gap-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="p-2 border border-slate-200 bg-white rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-slate-600">Page {page} of {Math.ceil(total / 10) || 1}</span>
            <button 
              disabled={page >= Math.ceil(total / 10)}
              onClick={() => setPage(page + 1)}
              className="p-2 border border-slate-200 bg-white rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemsList;
