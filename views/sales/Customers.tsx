
import React, { useState } from 'react';
import { 
  Users, Search, Filter, Plus, Mail, Phone, 
  Edit2, Trash2, Wallet, History, FileText,
  ChevronRight, FileSpreadsheet
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { salesService } from '../../services/sales.service';
import { pdfService } from '../../services/pdf.service';
import { useAuth } from '../../App';

export default function Customers() {
  const navigate = useNavigate();
  const { user, can } = useAuth();
  const [search, setSearch] = useState('');
  
  const [customers, setCustomers] = useState(salesService.getCustomers());

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.companyName.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      salesService.deleteCustomer(id, user!);
      setCustomers(salesService.getCustomers());
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDownloadStatement = (e: React.MouseEvent, cust: any) => {
    e.stopPropagation();
    pdfService.generateStatement(cust, user);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="text-slate-500 text-sm">Manage client profiles and track account balances.</p>
        </div>
        {can('sales.create') && (
          <button 
            onClick={() => navigate('/sales/customers/new')}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-sm shadow-xl active:scale-95 transition-all"
          >
            <Plus size={18} />
            New Customer
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by name, company or email..." 
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
                <th className="px-6 py-4">Customer Details</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4 text-right">Outstanding Balance</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length > 0 ? filteredCustomers.map(cust => {
                const balance = salesService.getCustomerBalance(cust.id);
                return (
                  <tr key={cust.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{cust.name}</p>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{cust.companyName || 'Individual'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {cust.email && (
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Mail size={12} className="text-slate-400" />
                            {cust.email}
                          </div>
                        )}
                        {cust.phone && (
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Phone size={12} className="text-slate-400" />
                            {cust.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Wallet size={14} className={balance > 0 ? 'text-amber-500' : 'text-emerald-500'} />
                        <span className={`text-sm font-black ${balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          AED {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${cust.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {cust.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => handleDownloadStatement(e, cust)}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          title="Download Statement"
                        >
                          <FileText size={16} />
                        </button>
                        <button 
                          onClick={() => navigate(`/sales/customers/edit/${cust.id}`)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(cust.id, cust.name)}
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
                    No customers found matching your criteria.
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
