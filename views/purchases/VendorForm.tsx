
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Save, X, ArrowLeft, Building2, MapPin, 
  Globe, Mail, Phone, ShieldCheck, User as UserIcon,
  Smartphone, Copy, FileText, Wallet, Loader2
} from 'lucide-react';
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
    mobile: '',
    website: '',
    currency: 'AED',
    trn: '',
    address: '',
    billingAddress: '',
    shippingAddress: '',
    status: 'Active',
    notes: ''
  });

  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      const vendor = purchaseService.getVendorById(id);
      if (vendor) setFormData({ ...vendor });
      else navigate('/purchases/vendors');
    }
  }, [id, isEdit, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name?.trim()) {
      setError('Vendor Display Name is mandatory.');
      return;
    }

    setIsSaving(true);
    try {
      // For legacy support, we update 'address' with billingAddress
      const finalData = { 
        ...formData, 
        address: formData.billingAddress || formData.address || 'No Address Provided' 
      };
      
      if (isEdit) {
        await purchaseService.updateVendor(id!, finalData, user);
      } else {
        await purchaseService.createVendor(finalData, user);
      }
      
      navigate('/purchases/vendors');
    } catch (err: any) {
      console.error("[Vendor Save Failure]", err);
      setError(err.message || 'An error occurred while saving the supplier profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const copyBillingToShipping = () => {
    setFormData({ ...formData, shippingAddress: formData.billingAddress });
  };

  const InputLabel = ({ label, required }: { label: string, required?: boolean }) => (
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
  );

  const SectionHeader = ({ icon, title }: any) => (
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
            type="button" 
            disabled={isSaving}
            onClick={() => navigate('/purchases/vendors')} 
            className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-500 bg-white border border-slate-200 shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900">{isEdit ? 'Edit Vendor Profile' : 'New Vendor Profile'}</h1>
            <p className="text-sm text-slate-500">Configure procurement terms and supplier identity.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            type="button" 
            disabled={isSaving}
            onClick={() => navigate('/purchases/vendors')} 
            className="px-6 py-2.5 font-bold text-slate-400 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="vendor-form"
            disabled={isSaving}
            className="flex items-center gap-2 px-10 py-2.5 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {isSaving ? 'Processing...' : (isEdit ? 'Update Profile' : 'Save Vendor')}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl font-bold flex items-center gap-3 animate-in shake">
          <X className="bg-red-200 rounded-full p-0.5" size={16}/> {error}
        </div>
      )}

      <form id="vendor-form" onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
          <SectionHeader icon={<Building2 size={18} />} title="Primary Information" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1">
              <InputLabel label="Vendor Display Name" required />
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input 
                  required 
                  disabled={isSaving}
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 transition-all outline-none !bg-white !text-slate-900" 
                  placeholder="e.g. Elite Supplies LLC" 
                />
              </div>
            </div>
            <div className="space-y-1">
              <InputLabel label="Official Company Name" />
              <input 
                disabled={isSaving}
                value={formData.companyName} 
                onChange={e => setFormData({...formData, companyName: e.target.value})} 
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 transition-all outline-none !bg-white !text-slate-900" 
                placeholder="Full legal entity name" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
            <div className="space-y-1">
              <InputLabel label="Tax Registration # (TRN)" />
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input 
                  disabled={isSaving}
                  value={formData.trn} 
                  onChange={e => setFormData({...formData, trn: e.target.value})} 
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 transition-all outline-none font-mono !bg-white !text-slate-900" 
                  placeholder="e.g. 100234567800003" 
                />
              </div>
            </div>
            <div className="space-y-1">
              <InputLabel label="Currency" />
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <select 
                  disabled={isSaving}
                  value={formData.currency} 
                  onChange={e => setFormData({...formData, currency: e.target.value})} 
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 transition-all outline-none bg-white !bg-white !text-slate-900"
                >
                  <option value="AED">AED - UAE Dirham</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="SAR">SAR - Saudi Riyal</option>
                  <option value="INR">INR - Indian Rupee</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <InputLabel label="Status" />
              <select 
                disabled={isSaving}
                value={formData.status} 
                onChange={e => setFormData({...formData, status: e.target.value})} 
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 transition-all outline-none bg-white !bg-white !text-slate-900"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
          <SectionHeader icon={<Phone size={18} />} title="Contact Details" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-1 lg:col-span-2">
              <InputLabel label="Vendor Email" />
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input 
                  disabled={isSaving}
                  type="email"
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 transition-all outline-none !bg-white !text-slate-900" 
                  placeholder="orders@vendor.com" 
                />
              </div>
            </div>
            <div className="space-y-1">
              <InputLabel label="Work Phone" />
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input 
                  disabled={isSaving}
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 transition-all outline-none !bg-white !text-slate-900" 
                  placeholder="+971 4 000 0000" 
                />
              </div>
            </div>
            <div className="space-y-1">
              <InputLabel label="Mobile Number" />
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input 
                  disabled={isSaving}
                  value={formData.mobile} 
                  onChange={e => setFormData({...formData, mobile: e.target.value})} 
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 transition-all outline-none !bg-white !text-slate-900" 
                  placeholder="+971 50 000 0000" 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
          <SectionHeader icon={<MapPin size={18} />} title="Address & Location" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <InputLabel label="Billing Address" />
                <button 
                  type="button" 
                  disabled={isSaving}
                  onClick={copyBillingToShipping}
                  className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase flex items-center gap-1 transition-colors px-2 py-1 bg-blue-50 rounded-lg"
                >
                  <Copy size={12} /> Copy to Shipping
                </button>
              </div>
              <textarea 
                disabled={isSaving}
                value={formData.billingAddress} 
                onChange={e => setFormData({...formData, billingAddress: e.target.value})} 
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 transition-all outline-none h-32 text-sm leading-relaxed !bg-white !text-slate-900" 
                placeholder="Flat / Office No, Building Name, Street Name, City, State, ZIP, Country" 
              />
            </div>
            <div className="space-y-3">
              <InputLabel label="Shipping Address" />
              <textarea 
                disabled={isSaving}
                value={formData.shippingAddress} 
                onChange={e => setFormData({...formData, shippingAddress: e.target.value})} 
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 transition-all outline-none h-32 text-sm leading-relaxed !bg-white !text-slate-900" 
                placeholder="Standard delivery destination for this vendor" 
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
