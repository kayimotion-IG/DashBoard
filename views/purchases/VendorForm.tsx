
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, X, ArrowLeft, Building2, MapPin } from 'lucide-react';
import { useAuth } from '../../App';
import { purchaseService } from '../../services/purchase.service';

export default function VendorForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = !!id;

  const [formData, setFormData] = useState<any>({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    currency: 'USD',
    address: '',
    status: 'Active'
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      const vendor = purchaseService.getVendorById(id);
      if (vendor) setFormData({ ...vendor });
    }
  }, [id, isEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setError('Vendor Name is mandatory.');
      return;
    }
    try {
      if (isEdit) purchaseService.updateVendor(id!, formData, user);
      else purchaseService.createVendor(formData, user);
      navigate('/purchases/vendors');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4 mb-6">
        <button type="button" onClick={() => navigate('/purchases/vendors')} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-500 bg-white border">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-black text-slate-900">{isEdit ? 'Edit Vendor' : 'Add New Vendor'}</h1>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl font-bold flex items-center gap-3"><X size={16}/> {error}</div>}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vendor Display Name *</label>
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 border rounded-xl" placeholder="e.g. Acme Supplies" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Name</label>
              <input value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full px-4 py-3 border rounded-xl" placeholder="Full legal name" />
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Physical Address</label>
            <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-3 border rounded-xl h-24" placeholder="Street, City, Country" />
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <button type="button" onClick={() => navigate('/purchases/vendors')} className="px-6 py-2.5 font-bold text-slate-400">Cancel</button>
            <button type="submit" className="flex items-center gap-2 px-10 py-2.5 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all">
              <Save size={18} />
              Save Vendor
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
