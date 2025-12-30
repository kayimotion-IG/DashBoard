
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileUp, ArrowLeft, CheckCircle2, AlertTriangle, 
  ChevronRight, UploadCloud, RefreshCw, ShieldCheck,
  Loader2, XCircle, Table as TableIcon, FileText, Info
} from 'lucide-react';
import { useAuth } from '../../App';

export default function ImportItems() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState(1);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [updateMode, setUpdateMode] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [results, setResults] = useState<any>(null);

  const fields = [
    { key: 'name', label: 'Item Name', required: true },
    { key: 'sku', label: 'SKU', required: true },
    { key: 'itemType', label: 'Item Type' },
    { key: 'unit', label: 'Unit' },
    { key: 'brand', label: 'Brand' },
    { key: 'category', label: 'Category' },
    { key: 'sellingPrice', label: 'Selling Price' },
    { key: 'purchasePrice', label: 'Purchase Price' },
    { key: 'hsnSac', label: 'HSN/SAC' },
    { key: 'barcode', label: 'Barcode/UPC' },
    { key: 'openingStock', label: 'Opening Stock' },
    { key: 'openingStockRate', label: 'Stock Rate' },
    { key: 'reorderLevel', label: 'Reorder Point' }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setErrorMsg('');

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        
        // Robust split handling both CRLF and LF
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length < 1) {
          setErrorMsg('The selected file appears to be empty.');
          return;
        }

        // Delimiter Detection Logic
        const head = lines[0];
        const counts = { 
          ',': (head.match(/,/g) || []).length, 
          ';': (head.match(/;/g) || []).length, 
          '\t': (head.match(/\t/g) || []).length 
        };
        const delimiter = (Object.keys(counts) as Array<keyof typeof counts>).reduce((a, b) => counts[a] > counts[b] ? a : b);

        const parsedHeaders = head.split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
        const dataRows = lines.slice(1).map(line => {
          // Simple CSV split (not for complex nested quotes, but good for preview)
          return line.split(delimiter).map(cell => cell.trim().replace(/^"|"$/g, ''));
        });

        if (dataRows.length === 0) {
           setErrorMsg('Only headers were detected. No data rows found.');
           return;
        }

        setHeaders(parsedHeaders);
        setRawRows(dataRows);
        
        const initialMap: any = {};
        parsedHeaders.forEach(h => {
          const match = fields.find(f => 
            f.label.toLowerCase() === h.toLowerCase() || 
            f.key.toLowerCase() === h.toLowerCase() ||
            h.toLowerCase().includes(f.key.toLowerCase())
          );
          if (match) initialMap[match.key] = h;
        });
        setMapping(initialMap);
        setStep(2);
      };
      reader.readAsText(selected);
    }
  };

  const processImport = async () => {
    if (!file) return;
    setProcessing(true);
    setErrorMsg('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mapping', JSON.stringify(mapping));
      formData.append('updateMode', updateMode.toString());
      formData.append('_csrf', 'KlenCare-Session-Protected-Token');

      const response = await fetch('/api/imports/items/commit', { 
        method: 'POST', 
        body: formData 
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `HTTP Error ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setResults(data);
        setStep(3);
      } else {
        throw new Error(data.error || 'Server rejected the import data.');
      }
    } catch (err: any) {
      console.error('[Import Critical Hang Fix]', err);
      setErrorMsg(err.message || 'Network disconnected or server hung during sync.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/items')} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-500 bg-white border border-slate-200 shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Product Importer</h1>
          <p className="text-sm text-slate-500 font-medium">Zoho Books compatible bulk synchronization pipeline.</p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 p-6 rounded-3xl flex items-start gap-4 text-red-700 animate-in slide-in-from-top-2 duration-300 shadow-lg shadow-red-100">
           <XCircle size={24} className="shrink-0 mt-1" />
           <div>
              <p className="font-black uppercase text-xs tracking-widest mb-1">Processing Error</p>
              <p className="text-sm font-medium">{errorMsg}</p>
           </div>
        </div>
      )}

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-2xl overflow-hidden">
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex-1 flex items-center justify-center py-6 gap-3 text-xs font-black uppercase tracking-[0.2em] transition-all ${step === s ? 'text-blue-600 bg-white border-b-4 border-blue-600' : 'text-slate-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] border-2 ${step >= s ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-200' : 'border-slate-300'}`}>{s}</span>
              {s === 1 ? 'Select' : s === 2 ? 'Finalize' : 'Complete'}
            </div>
          ))}
        </div>

        <div className="p-12">
          {step === 1 && (
            <div className="text-center py-16 space-y-10">
              <label className="cursor-pointer group block max-w-lg mx-auto p-20 border-4 border-dashed border-slate-100 rounded-[40px] hover:border-blue-400 hover:bg-blue-50/30 transition-all">
                <div className="mx-auto w-24 h-24 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-xl shadow-blue-100"><UploadCloud size={48} /></div>
                <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Upload Catalog</h3>
                <p className="text-slate-400 text-sm font-medium mb-10 px-8">Accepts .csv, .tsv and .txt with automatic delimiter detection.</p>
                <input type="file" className="hidden" accept=".csv,.tsv,.txt" onChange={handleFileChange} />
                <span className="inline-block px-12 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-slate-800 active:scale-95 transition-all">Browse Storage</span>
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-12 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="space-y-8">
                  <div className="p-8 bg-slate-50 rounded-3xl border border-slate-200 space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">1. Column Mapping</h4>
                    {fields.map(field => (
                      <div key={field.key} className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase flex justify-between">
                          {field.label} {field.required && <span className="text-red-400 text-[8px]">REQUIRED</span>}
                        </label>
                        <select 
                          value={mapping[field.key] || ''} 
                          onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })} 
                          className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm bg-white focus:ring-4 focus:ring-blue-100 transition-all font-bold"
                        >
                          <option value="">(Skip this field)</option>
                          {headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>

                  <div className="p-8 bg-emerald-50 rounded-3xl border border-emerald-100 space-y-4">
                    <h4 className="text-[10px] font-black text-emerald-800 uppercase tracking-[0.2em] flex items-center gap-2"> <ShieldCheck size={14} /> 2. Overwrite Policy </h4>
                    <label className="flex items-center gap-3 cursor-pointer group">
                       <input type="checkbox" checked={updateMode} onChange={e => setUpdateMode(e.target.checked)} className="w-6 h-6 accent-emerald-600 rounded-lg" />
                       <span className="text-sm font-black text-emerald-900">Update Existing SKUs</span>
                    </label>
                    <p className="text-[10px] text-emerald-600 leading-relaxed font-bold">Matching SKUs will be updated. New records will be appended. No data is ever deleted.</p>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                   <div className="flex items-center justify-between px-2">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">3. Data Preview ({rawRows.length} items detected)</h4>
                      {rawRows.length === 1 && (
                         <div className="flex items-center gap-2 text-amber-600 text-[10px] font-black uppercase">
                            <AlertTriangle size={14}/> Delimiter Warning
                         </div>
                      )}
                   </div>
                   <div className="border border-slate-100 rounded-[32px] overflow-hidden shadow-2xl bg-white">
                     <div className="max-h-[650px] overflow-auto custom-scrollbar">
                        <table className="w-full text-[11px] text-left">
                          <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-100">
                            <tr>
                              {fields.map(f => <th key={f.key} className="px-6 py-4 font-black text-slate-600 border-r border-slate-100 last:border-0">{f.label}</th>)}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {rawRows.slice(0, 50).map((row, i) => (
                              <tr key={i} className="hover:bg-blue-50/20 transition-colors">
                                {fields.map(f => {
                                  const col = mapping[f.key];
                                  const val = col ? row[headers.indexOf(col)] : '-';
                                  return <td key={f.key} className="px-6 py-4 text-slate-500 font-bold whitespace-nowrap border-r border-slate-50 last:border-0">{val || '-'}</td>
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                     </div>
                   </div>
                   <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Showing first 50 of {rawRows.length} rows</p>
                </div>
              </div>

              <div className="pt-12 border-t border-slate-100 flex justify-end items-center gap-10">
                <div className="flex items-center gap-3 text-slate-400"> 
                  <Info size={16}/> 
                  <span className="text-[10px] font-black uppercase">CSV Parsing Layer Active</span> 
                </div>
                <button 
                  onClick={processImport}
                  disabled={processing || !mapping.sku || !mapping.name}
                  className="flex items-center gap-4 px-16 py-5 bg-blue-600 text-white rounded-3xl font-black text-sm uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(37,99,235,0.3)] hover:translate-y-[-2px] active:scale-95 transition-all disabled:opacity-50 disabled:translate-y-0"
                >
                  {processing ? <><Loader2 className="animate-spin" size={20} /> COMMITTING...</> : <>START DATABASE SYNC <ChevronRight size={20} /></>}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-16 space-y-12 animate-in zoom-in-95 duration-500">
               <div className="w-32 h-32 bg-emerald-50 text-emerald-600 rounded-[40px] flex items-center justify-center mx-auto shadow-inner border-2 border-emerald-100"><CheckCircle2 size={64} /></div>
               <div className="space-y-3">
                 <h2 className="text-4xl font-black text-slate-900 tracking-tight">Sync Successfully Finished</h2>
                 <p className="text-slate-500 text-base font-medium">Internal ledger and inventory database have been updated.</p>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
                 {[
                   { label: 'Created', count: results.created, color: 'text-blue-600', bg: 'bg-blue-50' },
                   { label: 'Updated', count: results.updated, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                   { label: 'Skipped', count: results.skipped, color: 'text-slate-400', bg: 'bg-slate-50' },
                   { label: 'Failed', count: results.failed, color: 'text-red-600', bg: 'bg-red-50' },
                 ].map((stat, i) => (
                   <div key={i} className={`${stat.bg} p-10 rounded-[32px] border border-transparent hover:shadow-2xl transition-all`}>
                     <p className={`text-5xl font-black ${stat.color}`}>{stat.count}</p>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3">{stat.label}</p>
                   </div>
                 ))}
               </div>

               {results.errors.length > 0 && (
                 <div className="max-w-3xl mx-auto p-10 bg-red-50 border border-red-100 rounded-[32px] text-left">
                    <h5 className="text-xs font-black text-red-700 uppercase tracking-widest mb-6 flex items-center gap-3"><XCircle size={18}/> Error Processing Trace</h5>
                    <ul className="text-[11px] font-bold text-red-600 space-y-2 max-h-48 overflow-auto custom-scrollbar pr-4">
                      {results.errors.map((e: string, i: number) => <li key={i} className="flex gap-2"><span>•</span> {e}</li>)}
                    </ul>
                 </div>
               )}

               <div className="flex justify-center gap-4">
                  <button onClick={() => setStep(1)} className="px-10 py-5 bg-white border-2 border-slate-200 text-slate-700 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-slate-50 transition-all"> Import More </button>
                  <button onClick={() => navigate('/items?reset=1')} className="px-20 py-5 bg-slate-900 text-white rounded-3xl font-black text-sm uppercase tracking-[0.3em] shadow-2xl hover:bg-slate-800 transition-all active:scale-95"> VIEW ITEM CATALOG </button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
