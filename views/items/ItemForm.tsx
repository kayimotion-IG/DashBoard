
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Save, X, ArrowLeft, Package, DollarSign, 
  Ruler, Info, ShieldCheck, Tag, Warehouse, ShoppingCart
} from 'lucide-react';
import { useAuth } from '../../App';
import { itemService } from '../../services/item.service';

// --- STABLE HELPER COMPONENTS (Moved outside to fix typing focus bug) ---
const SectionHeader = ({ icon, title, desc }: any) => (
  <div className="mb-8">
    <div className="flex items-center gap-3 mb-1">
      <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">{icon}</div>
      <h3 className="text-lg font-black text-slate-900 tracking-tight">{title}</h3>
    </div>
    <p className="text-xs text-slate-500 font-medium ml-12">{desc}</p>
  </div>
);

const InputWrapper = ({ label, children, required }: any) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1 ml-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

export default function ItemForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = !!id;

  const [activeTab, setActiveTab] = useState<'basic' | 'sales' | 'purchase' | 'inventory'>('basic');
  const [formData, setFormData] = useState<any>({
    name: '', sku: '', itemType: 'Goods', unit: 'pcs', category: 'General', 
    sellingPrice: 0, purchasePrice: 0, trackInventory: true, openingStock: 0,
    status: 'Active'
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      const item = itemService.getItemById(id);
      if (item) setFormData({ ...item });
    }
  }, [id, isEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.sku?.trim()) {
      setError('Name and SKU are required.');
      return;
    }
    try {
      // Ensure purchasePrice is treated as a number
      const submissionData = {
        ...formData,
        purchasePrice: Number(formData.purchasePrice) || 0,
        sellingPrice: Number(formData.sellingPrice) || 0
      };

      if (isEdit) itemService.updateItem(id!, submissionData, user);
      else itemService.createItem(submissionData, user);
      navigate('/items');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/items')} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-500 bg-white border">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900">{isEdit ? 'Modify Item' : 'New Item Entry'}</h1>
            <p className="text-sm text-slate-500">Configure catalog properties and tracking rules.</p>
          </div>
        </div>
      </div>

      {error && <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 font-bold rounded-r-xl animate-in fade-in slide-in-from-top-2">{error}</div>}

      <div className="flex gap-8">
        <div className="w-60 shrink-0 space-y-1">
          {[
            { id: 'basic', label: 'Basic Info', icon: <Info size={16}/> },
            { id: 'sales', label: 'Sales Info', icon: <Tag size={16}/> },
            { id: 'purchase', label: 'Purchase Info', icon: <ShoppingCart size={16}/> },
            { id: 'inventory', label: 'Inventory', icon: <Warehouse size={16}/> }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-white hover:text-slate-900'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm p-10 min-h-[500px]">
          <form onSubmit={handleSubmit} id="item-form" className="space-y-10">
            {activeTab === 'basic' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <SectionHeader icon={<Package/>} title="Identity" desc="Primary catalog information." />
                <div className="grid grid-cols-2 gap-8">
                  <InputWrapper label="Item Name" required>
                    <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 border rounded-xl !bg-white !text-slate-900" />
                  </InputWrapper>
                  <InputWrapper label="SKU Code" required>
                    <input required value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="w-full px-4 py-3 border rounded-xl font-mono uppercase !bg-white !text-slate-900" />
                  </InputWrapper>
                  <InputWrapper label="Category">
                    <input value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3 border rounded-xl !bg-white !text-slate-900" />
                  </InputWrapper>
                  <InputWrapper label="Cost Price (Base)">
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input type="number" step="0.01" value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: e.target.value})} className="w-full pl-10 pr-4 py-3 border rounded-xl font-bold !bg-white !text-slate-900" />
                    </div>
                  </InputWrapper>
                </div>
              </div>
            )}

            {activeTab === 'sales' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <SectionHeader icon={<Tag/>} title="Pricing" desc="Sales configuration for customer billing." />
                <InputWrapper label="Selling Price" required>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="number" step="0.01" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: e.target.value})} className="w-full pl-10 pr-4 py-3 border rounded-xl font-bold !bg-white !text-slate-900" />
                  </div>
                </InputWrapper>
              </div>
            )}

            {activeTab === 'purchase' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <SectionHeader icon={<ShoppingCart/>} title="Purchase Information" desc="Configure buying rates and vendor associations." />
                <div className="grid grid-cols-2 gap-8">
                  <InputWrapper label="Cost Price / Purchase Rate" required>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        required
                        type="number" 
                        step="0.01" 
                        value={formData.purchasePrice} 
                        onChange={e => setFormData({...formData, purchasePrice: e.target.value})} 
                        className="w-full pl-10 pr-4 py-3 border rounded-xl font-bold !bg-white !text-slate-900 text-rose-600" 
                      />
                    </div>
                  </InputWrapper>
                  <InputWrapper label="Purchase Account">
                    <select className="w-full px-4 py-3 border rounded-xl bg-white !text-slate-900">
                      <option>Cost of Goods Sold</option>
                      <option>Materials</option>
                    </select>
                  </InputWrapper>
                  <div className="col-span-2">
                    <InputWrapper label="Purchase Description">
                      <textarea 
                        value={formData.purchaseDescription || ''} 
                        onChange={e => setFormData({...formData, purchaseDescription: e.target.value})} 
                        className="w-full px-4 py-3 border rounded-xl h-24 !bg-white !text-slate-900" 
                        placeholder="Internal notes for purchasing team..."
                      />
                    </InputWrapper>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'inventory' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <SectionHeader icon={<Warehouse/>} title="Inventory Control" desc="Stock tracking and valuation settings." />
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <ShieldCheck className="text-blue-600" />
                  <span className="text-sm font-bold text-blue-900">Track inventory for this item</span>
                  <input type="checkbox" checked={formData.trackInventory} onChange={e => setFormData({...formData, trackInventory: e.target.checked})} className="ml-auto w-5 h-5 accent-blue-600" />
                </div>
              </div>
            )}

            <div className="pt-10 border-t flex justify-end gap-3">
              <button type="button" onClick={() => navigate('/items')} className="px-6 py-2.5 font-bold text-slate-500">Discard</button>
              <button type="submit" className="px-10 py-2.5 bg-blue-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">Save Record</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
