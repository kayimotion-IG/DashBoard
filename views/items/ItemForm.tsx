
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Save, X, ArrowLeft, Package, DollarSign, 
  Ruler, Info, ShieldCheck, Tag, Warehouse, ShoppingCart,
  Barcode, Truck, Layers, Weight, Boxes, Maximize, Loader2
} from 'lucide-react';
import { useAuth } from '../../App';
import { itemService } from '../../services/item.service';
import { purchaseService } from '../../services/purchase.service';

const SectionHeader = ({ icon, title, desc }: any) => (
  <div className="mb-8 border-b border-slate-100 pb-4">
    <div className="flex items-center gap-3 mb-1">
      <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">{icon}</div>
      <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">{title}</h3>
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

  const [activeTab, setActiveTab] = useState<'basic' | 'sales' | 'inventory' | 'physical'>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const vendors = purchaseService.getVendors();

  const [formData, setFormData] = useState<any>({
    name: '', sku: '', itemType: 'Goods', unit: 'pcs', brand: '', manufacturer: '',
    category: 'General', taxCode: 'VAT 5%', taxPreference: 'Taxable',
    sellingPrice: 0, salesDescription: '', purchasePrice: 0, purchaseDescription: '',
    preferredVendorId: '', trackInventory: true, openingStock: 0, openingStockRate: 0,
    reorderLevel: 0, reorderQty: 0, hsnSac: '', barcode: '', weight: 0, 
    weightUnit: 'kg', length: 0, width: 0, height: 0, dimensionUnit: 'cm',
    status: 'Active'
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      const item = itemService.getItemById(id);
      if (item) setFormData({ ...item });
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.sku?.trim()) {
      setError('Item Name and SKU are mandatory fields.');
      return;
    }
    
    setIsSaving(true);
    setError('');

    try {
      const submissionData = {
        ...formData,
        purchasePrice: Number(formData.purchasePrice) || 0,
        sellingPrice: Number(formData.sellingPrice) || 0,
        openingStock: Number(formData.openingStock) || 0,
        reorderLevel: Number(formData.reorderLevel) || 0,
        weight: Number(formData.weight) || 0,
        length: Number(formData.length) || 0,
        width: Number(formData.width) || 0,
        height: Number(formData.height) || 0,
      };

      if (isEdit) await itemService.updateItem(id!, submissionData, user);
      else await itemService.createItem(submissionData, user);
      
      navigate('/items');
    } catch (err: any) {
      setError(err.message || 'System failed to commit item to vault.');
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/items')} className="p-2 hover:bg-white hover:shadow-md rounded-full transition-all text-slate-500 bg-slate-50 border border-slate-200">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{isEdit ? 'Update Product' : 'Create New Product'}</h1>
            <p className="text-sm text-slate-500 font-medium">Define inventory tracking, pricing models, and physical dimensions.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/items')} disabled={isSaving} className="px-6 py-2.5 font-bold text-slate-500 hover:text-slate-900 transition-colors">Discard</button>
          <button 
            type="submit" 
            form="item-form"
            disabled={isSaving}
            className="flex items-center gap-2 px-10 py-2.5 bg-blue-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {isSaving ? 'Vaulting...' : 'Commit to Catalog'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-700 font-bold rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <X className="bg-rose-200 rounded-full p-0.5" size={16} /> {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-64 shrink-0 space-y-2">
          {[
            { id: 'basic', label: 'Primary Info', icon: <Info size={16}/> },
            { id: 'sales', label: 'Pricing & Vendors', icon: <ShoppingCart size={16}/> },
            { id: 'inventory', label: 'Inventory Setup', icon: <Warehouse size={16}/> },
            { id: 'physical', label: 'Physical Details', icon: <Maximize size={16}/> }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-sm font-bold transition-all border ${
                activeTab === tab.id 
                ? 'bg-slate-900 text-white border-slate-900 shadow-xl' 
                : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              <div className="flex items-center gap-3">
                {tab.icon}
                {tab.label}
              </div>
              {activeTab === tab.id && <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm p-10 min-h-[600px]">
          <form onSubmit={handleSubmit} id="item-form" className="space-y-12">
            {activeTab === 'basic' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <SectionHeader icon={<Package/>} title="Item Identity" desc="Core details used for identification and grouping." />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="md:col-span-2">
                    <InputWrapper label="Product / Service Name" required>
                      <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-4 focus:ring-blue-50 transition-all font-bold text-lg" placeholder="e.g. Premium Industrial Degreaser" />
                    </InputWrapper>
                  </div>
                  <InputWrapper label="SKU (Unique Identifier)" required>
                    <input required value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-4 focus:ring-blue-50 transition-all font-mono uppercase" placeholder="e.g. IDG-001-X" />
                  </InputWrapper>
                  <InputWrapper label="Unit of Measure">
                    <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full px-4 py-3 border rounded-xl outline-none bg-white">
                      <option value="pcs">Pcs (Pieces)</option>
                      <option value="box">Box</option>
                      <option value="kg">Kg (Kilograms)</option>
                      <option value="m">Meters</option>
                      <option value="set">Set</option>
                      <option value="dz">Dozen</option>
                    </select>
                  </InputWrapper>
                  <InputWrapper label="Brand Name">
                    <div className="relative">
                      <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full pl-10 pr-4 py-3 border rounded-xl outline-none" placeholder="e.g. KlenCare Pro" />
                    </div>
                  </InputWrapper>
                  <InputWrapper label="Manufacturer">
                    <input value={formData.manufacturer} onChange={e => setFormData({...formData, manufacturer: e.target.value})} className="w-full px-4 py-3 border rounded-xl outline-none" placeholder="Producer entity name" />
                  </InputWrapper>
                  <InputWrapper label="Item Category">
                    <input value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3 border rounded-xl outline-none" placeholder="e.g. Liquids / Safety Gear" />
                  </InputWrapper>
                  <InputWrapper label="Status">
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-3 border rounded-xl outline-none bg-white">
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </InputWrapper>
                </div>
              </div>
            )}

            {activeTab === 'sales' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <SectionHeader icon={<Tag/>} title="Commercial Terms" desc="Configure pricing, tax, and procurement preferences." />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="p-8 bg-blue-50/50 rounded-3xl border border-blue-100 space-y-6">
                      <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2"> <Tag size={12}/> Sales Configuration </h4>
                      <InputWrapper label="Selling Price" required>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">AED</span>
                          <input type="number" step="0.01" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: e.target.value})} className="w-full pl-12 pr-4 py-3 border rounded-xl outline-none font-black text-blue-600 text-lg focus:ring-4 focus:ring-blue-100" />
                        </div>
                      </InputWrapper>
                      <InputWrapper label="Sales Description">
                        <textarea value={formData.salesDescription} onChange={e => setFormData({...formData, salesDescription: e.target.value})} className="w-full px-4 py-3 border rounded-xl h-24 outline-none text-sm" placeholder="Visible on customer invoices..." />
                      </InputWrapper>
                   </div>

                   <div className="p-8 bg-rose-50/30 rounded-3xl border border-rose-100 space-y-6">
                      <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-2"> <ShoppingCart size={12}/> Procurement Configuration </h4>
                      <InputWrapper label="Purchase Rate (Cost Price)" required>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">AED</span>
                          <input type="number" step="0.01" value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: e.target.value})} className="w-full pl-12 pr-4 py-3 border rounded-xl outline-none font-black text-rose-600 text-lg focus:ring-4 focus:ring-rose-100" />
                        </div>
                      </InputWrapper>
                      <InputWrapper label="Preferred Vendor">
                        <div className="relative">
                          <Truck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                          <select value={formData.preferredVendorId} onChange={e => setFormData({...formData, preferredVendorId: e.target.value})} className="w-full pl-10 pr-4 py-3 border rounded-xl outline-none bg-white text-sm">
                            <option value="">Choose Supplier...</option>
                            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                          </select>
                        </div>
                      </InputWrapper>
                      <InputWrapper label="Tax Preference">
                         <select value={formData.taxPreference} onChange={e => setFormData({...formData, taxPreference: e.target.value})} className="w-full px-4 py-3 border rounded-xl outline-none bg-white">
                            <option value="Taxable">Taxable</option>
                            <option value="Non-Taxable">Non-Taxable</option>
                         </select>
                      </InputWrapper>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'inventory' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <SectionHeader icon={<Warehouse/>} title="Inventory Management" desc="Configure stock counts, reorder alerts, and tracking modes." />
                
                <div className="flex items-center gap-4 p-6 bg-slate-900 text-white rounded-3xl shadow-xl">
                  <div className="p-3 bg-blue-600 rounded-2xl"> <ShieldCheck size={24}/> </div>
                  <div className="flex-1">
                    <p className="text-sm font-black">Dynamic Inventory Tracking</p>
                    <p className="text-xs text-slate-400">Enable this to generate ledger entries and track stock levels in real-time.</p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-xl">
                    <span className="text-[10px] font-black uppercase">{formData.trackInventory ? 'Active' : 'Disabled'}</span>
                    <input type="checkbox" checked={formData.trackInventory} onChange={e => setFormData({...formData, trackInventory: e.target.checked})} className="w-5 h-5 accent-blue-500" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-8 border border-slate-100 rounded-3xl space-y-6 bg-slate-50/50">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Opening Balances</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <InputWrapper label="Opening Stock">
                        <input type="number" value={formData.openingStock} onChange={e => setFormData({...formData, openingStock: e.target.value})} className="w-full px-4 py-3 border rounded-xl outline-none font-bold" />
                      </InputWrapper>
                      <InputWrapper label="Value per Unit">
                        <input type="number" value={formData.openingStockRate} onChange={e => setFormData({...formData, openingStockRate: e.target.value})} className="w-full px-4 py-3 border rounded-xl outline-none font-bold" />
                      </InputWrapper>
                    </div>
                  </div>

                  <div className="p-8 border border-slate-100 rounded-3xl space-y-6 bg-amber-50/30">
                    <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Stock Control Limits</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <InputWrapper label="Reorder Level">
                        <input type="number" value={formData.reorderLevel} onChange={e => setFormData({...formData, reorderLevel: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none font-bold text-amber-700" />
                      </InputWrapper>
                      <InputWrapper label="Reorder Quantity">
                        <input type="number" value={formData.reorderQty} onChange={e => setFormData({...formData, reorderQty: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none font-bold text-blue-600" />
                      </InputWrapper>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'physical' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <SectionHeader icon={<Maximize/>} title="Physical Attributes" desc="Specify dimensions, weights, and identification codes for logistics." />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <InputWrapper label="Barcode / UPC">
                    <div className="relative">
                      <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl outline-none font-mono" placeholder="Scan or enter code..." />
                    </div>
                  </InputWrapper>
                  <InputWrapper label="HSN / SAC Code">
                    <input value={formData.hsnSac} onChange={e => setFormData({...formData, hsnSac: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none" placeholder="Harmonized System Code" />
                  </InputWrapper>
                  <InputWrapper label="Weight">
                    <div className="flex">
                      <input type="number" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="w-full px-4 py-3 border border-r-0 rounded-l-xl outline-none font-bold" />
                      <select value={formData.weightUnit} onChange={e => setFormData({...formData, weightUnit: e.target.value})} className="px-4 py-3 border border-l-0 rounded-r-xl outline-none bg-slate-50 text-[10px] font-black uppercase">
                        <option value="kg">KG</option>
                        <option value="g">G</option>
                        <option value="lb">LB</option>
                      </select>
                    </div>
                  </InputWrapper>
                </div>

                <div className="p-8 border border-slate-100 rounded-[32px] bg-slate-50/30">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"> <Ruler size={14}/> Dimensions (L x W x H) </h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <InputWrapper label="Length">
                      <input type="number" value={formData.length} onChange={e => setFormData({...formData, length: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none font-bold" />
                    </InputWrapper>
                    <InputWrapper label="Width">
                      <input type="number" value={formData.width} onChange={e => setFormData({...formData, width: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none font-bold" />
                    </InputWrapper>
                    <InputWrapper label="Height">
                      <input type="number" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none font-bold" />
                    </InputWrapper>
                    <InputWrapper label="Dimension Unit">
                      <select value={formData.dimensionUnit} onChange={e => setFormData({...formData, dimensionUnit: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none bg-white font-black uppercase text-xs">
                        <option value="cm">cm</option>
                        <option value="in">in</option>
                        <option value="mm">mm</option>
                        <option value="m">m</option>
                      </select>
                    </InputWrapper>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-10 border-t border-slate-100 flex justify-end gap-3">
              <button type="button" onClick={() => navigate('/items')} disabled={isSaving} className="px-6 py-2.5 font-bold text-slate-500">Cancel</button>
              <button type="submit" disabled={isSaving} className="px-12 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl hover:translate-y-[-2px] transition-all active:scale-95 disabled:opacity-50">
                {isSaving ? 'Synchronizing Vault...' : 'Save Product Record'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
