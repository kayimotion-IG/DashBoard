
import React, { useState, useEffect } from 'react';
import { 
  Truck, Search, Filter, Plus, Mail, Phone, 
  ChevronRight, Wallet, MapPin, FileUp, Edit2, Trash2, RefreshCw
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { purchaseService } from '../../services/purchase.service';
import { useAuth } from '../../App';
import { Vendor } from '../../types';

export default function Vendors() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, can } = useAuth();
  
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [search, setSearch] = useState('');
  
  const fetchVendors = () => {
    const queryParams = new URLSearchParams(location.search);
    const shouldReset = queryParams.get('reset') === '1';
    
    const activeFilters = shouldReset ? { reset: '1' } : { search };
    const res = purchaseService.getVendors(activeFilters);
    
    setVendors(res);

    if (shouldReset) {
      setSearch('');
      window.history.replaceState({}, '', location.pathname);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [search, location.search]);

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete vendor "${name}"?`)) return;
    purchaseService.deleteVendor(id, user!);
    fetchVendors();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vendors</h1>
          <p className="text-slate-500 text-sm">Manage suppliers and track outgoing liabilities.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/purchases/vendors?reset=1')}
            className="p-2 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-blue-600 transition-all shadow-sm"
            title="Force Reset Filters"
          >
            <RefreshCw size={18} />
          </button>
          {can('purchases.create') && (
            <>
              <button 
                onClick={() => navigate('/purchases/vendors/import')}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-bold text-sm transition-all"
              >
                <FileUp size={18} />
                Import
              </button>
              <button 
                onClick={() => navigate('/purchases/vendors/new')}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-sm shadow-xl active:scale-95 transition-all"
              >
                <Plus size={18} />
                New Vendor
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by vendor name or company..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl w-full outline-none focus:ring-2 focus:ring-blue-100 text-sm !bg-white !text-slate-900"
            />
          </div>
          <button className="p-2 text-slate-500 hover:bg-white rounded-lg border border-slate-200 transition-all"><Filter size={18} /></button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Vendor Details</th>
                <th className="px-6 py-4">Contact & Location</th>
                <th className="px-6 py-4 text-right">Payables (AP)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vendors.length > 0 ? vendors.map(vendor => {
                const balance = purchaseService.getVendorBalance(vendor.id);
                return (
                  <tr key={vendor.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{vendor.name}</p>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{vendor.companyName}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Mail size={12} className="text-slate-400" />
                          {vendor.email || 'No email'}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <MapPin size={12} className="text-slate-400" />
                          {vendor.address || 'No address'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Wallet size={14} className={balance > 0 ? 'text-red-500' : 'text-slate-400'} />
                        <span className={`text-sm font-black ${balance > 0 ? 'text-red-600' : 'text-slate-600'}`}>
                          AED {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${vendor.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {vendor.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => navigate(`/purchases/vendors/edit/${vendor.id}`)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(vendor.id, vendor.name)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-slate-900 transition-all">
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">
                    No vendors found. Try resetting filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
