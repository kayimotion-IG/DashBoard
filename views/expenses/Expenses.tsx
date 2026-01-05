
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Landmark, Search, Filter, Plus, 
  ChevronRight, Trash2, Edit2, Wallet, 
  Calendar, FileText, Loader2, RefreshCw, X,
  ArrowRight, DollarSign, PieChart, TrendingDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { expenseService } from '../../services/expense.service';
import { purchaseService } from '../../services/purchase.service';
import { useAuth } from '../../App';

export default function Expenses() {
  const navigate = useNavigate();
  const { user, can } = useAuth();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState(expenseService.getExpenses());

  const fetchData = async () => {
    setLoading(true);
    await expenseService.refresh();
    setExpenses(expenseService.getExpenses());
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const sub = expenseService.onChange(() => setExpenses(expenseService.getExpenses()));
    return () => sub();
  }, []);

  const filteredExpenses = useMemo(() => {
    if (!search) return expenses;
    const s = search.toLowerCase();
    return expenses.filter(e => 
      e.category.toLowerCase().includes(s) || 
      e.description.toLowerCase().includes(s) ||
      e.reference.toLowerCase().includes(s)
    );
  }, [search, expenses]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Permanently delete this expense record?')) {
      await expenseService.deleteExpense(id);
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Operating Expenses</h1>
          <p className="text-slate-500 text-sm">Managing non-COGS overheads and administrative costs.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchData} className="p-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-all">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => navigate('/expenses/new')}
            className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-bold text-sm shadow-xl shadow-rose-600/20 active:scale-95 transition-all"
          >
            <Plus size={18} />
            Record Expense
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 text-rose-50 opacity-10 group-hover:opacity-20 transition-opacity"><TrendingDown size={80}/></div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Monthly Burn</p>
           <h3 className="text-3xl font-black text-rose-600">AED {expenseService.getTotalExpenses().toLocaleString()}</h3>
           <p className="text-[9px] text-slate-400 font-bold uppercase mt-2">Aggregated Overheads</p>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Categories</p>
           <h3 className="text-3xl font-black text-slate-900">{expenseService.getCategories().length}</h3>
           <p className="text-[9px] text-slate-400 font-bold uppercase mt-2">Operational Classification</p>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm bg-slate-900 text-white border-none">
           <p className="text-[10px] font-black text-brand uppercase tracking-widest mb-1">Fiscal Impact</p>
           <h3 className="text-3xl font-black">Linked</h3>
           <p className="text-[9px] text-slate-500 font-bold uppercase mt-2">Automated Ledger Posting</p>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-lg group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search expenses by category or desc..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 pr-10 py-3.5 border border-slate-200 rounded-[20px] w-full outline-none text-sm bg-white !text-slate-900 focus:ring-4 focus:ring-rose-50 transition-all font-medium"
            />
          </div>
          <button className="flex items-center gap-2 px-6 py-3 text-slate-600 border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest bg-white hover:bg-slate-50 transition-all shadow-sm">
            <Filter size={16} /> Filter List
          </button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-24 text-slate-400">
               <Loader2 className="animate-spin mb-4" size={40} />
               <p className="font-bold uppercase tracking-widest text-[10px]">Accessing Vault Records...</p>
             </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-slate-300">
              <Landmark size={64} className="opacity-10 mb-4" />
              <p className="italic">No expense records found.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-white text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-50">
                <tr>
                  <th className="px-8 py-5">Expense Identity</th>
                  <th className="px-6 py-5">Category</th>
                  <th className="px-6 py-5">Reference</th>
                  <th className="px-6 py-5 text-right">Amount (AED)</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map(exp => (
                  <tr 
                    key={exp.id} 
                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/expenses/edit/${exp.id}`)}
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-[18px] flex items-center justify-center font-black text-xs">EXP</div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{exp.description}</p>
                          <p className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase mt-0.5">{new Date(exp.date).toLocaleDateString('en-GB')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest">{exp.category}</span>
                    </td>
                    <td className="px-6 py-6">
                      <p className="text-xs font-mono text-slate-500">{exp.reference || '-'}</p>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <p className="text-base font-black text-rose-600">AED {exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </td>
                    <td className="px-6 py-6">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${exp.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                        {exp.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); navigate(`/expenses/edit/${exp.id}`); }} className="p-3 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all"><Edit2 size={18} /></button>
                          <button onClick={(e) => handleDelete(e, exp.id)} className="p-3 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl transition-all"><Trash2 size={18} /></button>
                          <ArrowRight size={18} className="text-slate-200 ml-2" />
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
