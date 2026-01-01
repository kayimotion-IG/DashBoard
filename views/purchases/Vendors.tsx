
import React, { useState, useMemo } from 'react';
import { 
  Truck, Search, Filter, Plus, Mail, Phone, 
  ChevronRight, Wallet, MapPin, FileUp, Edit2, Trash2, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { purchaseService } from '../../services/purchase.service';
import { useAuth } from '../../App';
import { Vendor } from '../../types';

export default function Vendors() {
  const navigate = useNavigate();
  const { user, can } = useAuth();
  const [search, setSearch] = useState('');
  
  const vendors = purchaseService.getVendors();

  // REAL-TIME SEARCH: High Fidelity Memoized Filter
  const filteredVendors = useMemo(() => {
    if (!search) return vendors;
    const s = search.toLowerCase();
    return vendors.filter(v => 
      v.name.toLowerCase().includes(s) || 
      v.companyName.toLowerCase().includes(s) || 
      (v.trn && v.trn.includes(s)) ||
      (v.email && v.email.toLowerCase().includes(s))
    );
  }, [search, vendors]);

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete vendor "${name}"?`)) return;
    purchaseService.deleteVendor(id, user!);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vendors</h1>
          <p className="text-slate-500 text-sm">Manage suppliers and track outgoing liabilities.</p>
        </div>
        <div className="flex items-center gap-3">
          {can('purchases.create') && (
            <>
              <button 
                onClick={() => navigate('/purchases/vendors/import')}
                className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-bold text-sm shadow-sm transition-all"
              >
                <FileUp size={18} />
                Bulk Import
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

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center gap-4">
          <div className="relative flex-1 max-w-lg group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Live search by vendor name, company, or TRN..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 pr-10 py-3.5 border border-slate-200 rounded-[20px] w-full outline-none text-sm bg-white !text-slate-900 focus:ring-4 focus:ring-blue-50 transition-all font-medium shadow-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                <X size={16} />
              </button>
            )}
          </div>
          <button className="p-3 text-slate-500 hover:bg-white rounded-2xl border border-slate-200 shadow-sm transition-all"><Filter size={20} /></button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-50">
              <tr>
                <th className="px-8 py-5">Vendor Details</th>
                <th className="px-6 py-5">Contact & Location</th>
                <th className="px-6 py-5 text-right">Payables (AP)</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVendors.length > 0 ? filteredVendors.map(vendor => {
                const balance = purchaseService.getVendorBalance(vendor.id);
                return (
                  <tr key={vendor.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-[18px] flex items-center justify-center font-black text-xs shadow-sm">VND</div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{vendor.name}</p>
                          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">{vendor.companyName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                          <Mail size={12} className="text-slate-400" />
                          {vendor.email || 'No email registered'}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                          <MapPin size={12} className="text-slate-400" />
                          <span className="truncate max-w-[200px]">{vendor.address || 'No address specified'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Wallet size={16} className={balance > 0 ? 'text-red-500' : 'text-slate-300'} />
                        <span className={`text-base font-black ${balance > 0 ? 'text-red-600' : 'text-slate-600'}`}>
                          AED {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border ${vendor.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {vendor.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => navigate(`/purchases/vendors/edit/${vendor.id}`)}
                          className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl shadow-none hover:shadow-md border border-transparent hover:border-slate-100 transition-all"
                          title="Edit Profile"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(vendor.id, vendor.name)}
                          className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl shadow-none hover:shadow-md border border-transparent hover:border-slate-100 transition-all"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl shadow-none hover:shadow-md border border-transparent hover:border-slate-100 transition-all">
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-300">
                      <Truck size={64} className="opacity-10" />
                      <p className="text-sm font-medium italic">No vendors match "{search}"</p>
                    </div>
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
