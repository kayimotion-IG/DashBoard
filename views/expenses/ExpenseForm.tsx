
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Save, Landmark, Trash2, 
  Calendar, FileText, Wallet, Loader2,
  Tag, Info, Building2, ShieldCheck, DollarSign
} from 'lucide-react';
import { useAuth } from '../../App';
import { expenseService } from '../../services/expense.service';
import { purchaseService } from '../../services/purchase.service';

export default function ExpenseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = !!id;

  const vendors = purchaseService.getVendors();
  const categories = expenseService.getCategories();

  const [formData, setFormData] = useState<any>({
    date: new Date().toISOString().split('T')[0],
    category: categories[0],
    amount: 0,
    vendorId: '',
    reference: '',
    description: '',
    status: 'Paid',
    taxAmount: 0
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      const exp = expenseService.getExpenseById(id);
      if (exp) setFormData({ ...exp });
      else navigate('/expenses');
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0 || !formData.description) {
      setError('Description and positive amount are required.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      if (isEdit) {
        await expenseService.updateExpense(id!, formData);
      } else {
        await expenseService.createExpense(formData, user);
      }
      navigate('/expenses');
    } catch (err: any) {
      setError(err.message || 'Failed to save expense.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/expenses')} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{isEdit ? 'Modify Expense Record' : 'Record Operating Expense'}</h1>
            <p className="text-sm text-slate-500">Document operational overheads for accurate P&L tracking.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/expenses')} className="px-6 py-2.5 font-bold text-slate-400 bg-white border border-slate-200 rounded-xl">Cancel</button>
          <button 
            onClick={handleSubmit} 
            disabled={isSaving}
            className="flex items-center gap-2 px-10 py-2.5 bg-rose-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all hover:bg-rose-700 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {isSaving ? 'Synchronizing...' : 'Commit Expense'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-8">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-6 mb-2">
                 <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><DollarSign size={24}/></div>
                 <h3 className="font-black text-slate-900 uppercase tracking-widest">Transaction Specification</h3>
              </div>

              <div className="space-y-6">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Brief Description</label>
                    <input 
                      required 
                      value={formData.description} 
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      placeholder="e.g. Monthly Internet Bill - RAK Tower Office"
                      className="w-full px-5 py-4 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-rose-50 transition-all font-bold !bg-white"
                    />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Total Amount (AED)</label>
                       <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">AED</span>
                          <input 
                            type="number" 
                            step="0.01" 
                            required 
                            value={formData.amount} 
                            onChange={e => setFormData({...formData, amount: Number(e.target.value)})}
                            className="w-full pl-16 pr-5 py-4 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-rose-50 transition-all text-xl font-black text-rose-600 !bg-white"
                          />
                       </div>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Expense Category</label>
                       <select 
                        value={formData.category} 
                        onChange={e => setFormData({...formData, category: e.target.value})}
                        className="w-full px-5 py-4 border border-slate-200 rounded-2xl outline-none !bg-white font-bold"
                       >
                         {categories.map(c => <option key={c} value={c}>{c}</option>)}
                       </select>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-[#020c1b] p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-blue-600 rounded-full blur-[80px] opacity-10"></div>
              <div className="relative z-10 space-y-8">
                 <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                    <div className="p-3 bg-white/10 rounded-2xl text-brand"><Landmark size={24}/></div>
                    <h3 className="font-black uppercase tracking-widest">Metadata & Audit</h3>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-blue-200/30 uppercase tracking-widest ml-1">Payment Status</label>
                       <select 
                        value={formData.status} 
                        onChange={e => setFormData({...formData, status: e.target.value})}
                        className="w-full px-5 py-3.5 bg-blue-950 border border-white/5 rounded-2xl outline-none font-bold text-white focus:border-brand transition-all"
                       >
                         <option value="Paid">Fully Paid</option>
                         <option value="Pending">Pending Payment</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-blue-200/30 uppercase tracking-widest ml-1">Posting Date</label>
                       <input 
                        type="date" 
                        value={formData.date} 
                        onChange={e => setFormData({...formData, date: e.target.value})}
                        className="w-full px-5 py-3.5 bg-blue-950 border border-white/5 rounded-2xl outline-none font-bold text-white focus:border-brand transition-all"
                       />
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <div className="space-y-6">
           <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-slate-50 text-slate-400 rounded-xl"><Building2 size={18}/></div>
                 <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Vendor Link</h4>
              </div>
              <p className="text-[10px] text-slate-400 font-bold leading-relaxed uppercase">Associate this expense with a registered supplier for complete vendor audit trails.</p>
              
              <select 
                value={formData.vendorId} 
                onChange={e => setFormData({...formData, vendorId: e.target.value})}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none bg-white text-sm font-medium"
              >
                <option value="">(Individual Expense)</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>

              <div className="space-y-2 pt-4">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reference / Invoice #</label>
                 <input 
                   value={formData.reference} 
                   onChange={e => setFormData({...formData, reference: e.target.value})}
                   placeholder="e.g. REC-5589"
                   className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none text-sm font-mono !bg-white" 
                 />
              </div>
           </div>

           <div className="bg-amber-50 border border-amber-100 p-8 rounded-[40px] space-y-4">
              <div className="flex items-center gap-3">
                 <ShieldCheck size={20} className="text-amber-600"/>
                 <h4 className="text-[10px] font-black text-amber-900 uppercase tracking-widest">Financial Integrity</h4>
              </div>
              <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
                 Recording operating expenses is vital for calculating your <b>Net Profit</b>. 
                 Gross profit only accounts for sales vs cost of goods. Expenses subtract your workspace, salaries, and marketing from the final bottom line.
              </p>
           </div>
        </div>
      </form>
    </div>
  );
}
