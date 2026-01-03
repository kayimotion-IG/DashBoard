
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Save, X, ArrowLeft, Building2, 
  Globe, Mail, Phone, MapPin, CheckCircle2,
  Copy, Loader2
} from 'lucide-react';
import { useAuth } from '../../App';
import { salesService } from '../../services/sales.service';

export default function CustomerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = !!id;

  const [formData, setFormData] = useState<any>({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    currency: 'AED',
    billingAddress: '',
    shippingAddress: '',
    status: 'Active',
    notes: ''
  });

  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      const customer = salesService.getCustomerById(id);
      if (customer) {
        setFormData({ ...customer });
      } else {
        navigate('/sales/customers');
      }
    }
  }, [id, isEdit, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    if (!formData.name?.trim()) {
      setError('Display Name is mandatory.');
      setIsSaving(false);
      return;
    }

    try {
      if (isEdit) {
        await salesService.updateCustomer(id!, formData, user);
      } else {
        await salesService.createCustomer(formData, user);
      }
      navigate('/sales/customers');
    } catch (err: any) {
      console.error("[Customer Form Error]", err);
      setError(err.message || 'An error occurred while saving the customer profile.');
    } finally {
      // CRITICAL: Stop spinning regardless of outcome
      setIsSaving(false);
    }
  };

  const copyBillingToShipping = () => {
    setFormData({ ...formData, shippingAddress: formData.billingAddress });
  };

  const SectionTitle = ({ icon, title }: any) => (
    <div className="flex items-center gap-2 mb-6 pb-2 border-b border-slate-100">
      <div className="text-blue-600">{icon}</div>
      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{title}</h3>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/sales/customers')} 
            className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{isEdit ? 'Edit Customer Profile' : 'New Customer Profile'}</h1>
            <p className="text-sm text-slate-500">Define contact information, addresses, and commercial terms.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            type="button"
            disabled={isSaving}
            onClick={() => navigate('/sales/customers')} 
            className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-bold text-sm transition-all"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="customer-form"
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-500/20 font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {isSaving ? 'Processing...' : (isEdit ? 'Update Customer' : 'Save Customer')}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-red-700 text-sm font-bold flex items-center gap-3 animate-in shake">
          <X className="bg-red-200 rounded-full p-0.5" size={16} />
          {error}
        </div>
      )}

      <form id="customer-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <SectionTitle icon={<Building2 size={18} />} title="Primary Information" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Display Name *</label>
              <input 
                required
                disabled={isSaving}
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Acme Corp / John Doe"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm !bg-white !text-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Name</label>
              <input 
                disabled={isSaving}
                value={formData.companyName}
                onChange={e => setFormData({...formData, companyName: e.target.value})}
                placeholder="Official registered name"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm !bg-white !text-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  disabled={isSaving}
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  placeholder="billing@company.com"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 text-sm !bg-white !text-slate-900"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  disabled={isSaving}
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  placeholder="+971 50 000 0000"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 text-sm !bg-white !text-slate-900"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <SectionTitle icon={<MapPin size={18} />} title="Address & Location" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Billing Address</label>
                <button 
                  type="button" 
                  disabled={isSaving}
                  onClick={copyBillingToShipping}
                  className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase flex items-center gap-1 transition-colors"
                >
                  <Copy size={12} /> Copy to Shipping
                </button>
              </div>
              <textarea 
                disabled={isSaving}
                value={formData.billingAddress}
                onChange={e => setFormData({...formData, billingAddress: e.target.value})}
                placeholder="Street, City, Zip, Country"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 text-sm h-32 !bg-white !text-slate-900"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shipping Address</label>
              <textarea 
                disabled={isSaving}
                value={formData.shippingAddress}
                onChange={e => setFormData({...formData, shippingAddress: e.target.value})}
                placeholder="Street, City, Zip, Country"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 text-sm h-32 !bg-white !text-slate-900"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <SectionTitle icon={<Globe size={18} />} title="Commercial Terms" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Currency</label>
              <select 
                disabled={isSaving}
                value={formData.currency}
                onChange={e => setFormData({...formData, currency: e.target.value})}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none bg-white text-sm !bg-white !text-slate-900"
              >
                <option value="AED">AED - UAE Dirham</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="INR">INR - Indian Rupee</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
              <select 
                disabled={isSaving}
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value})}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none bg-white text-sm !bg-white !text-slate-900"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="mt-6 space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Internal Notes</label>
            <textarea 
              disabled={isSaving}
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              placeholder="Internal remarks for the team..."
              className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 text-sm h-24 !bg-white !text-slate-900"
            />
          </div>
        </div>
      </form>
    </div>
  );
}
