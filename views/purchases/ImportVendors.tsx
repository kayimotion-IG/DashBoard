
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileUp, ArrowLeft, CheckCircle2, AlertTriangle, 
  ChevronRight, UploadCloud, RefreshCw, X, ShieldCheck,
  Loader2, XCircle
} from 'lucide-react';
import { useAuth } from '../../App';

export default function ImportVendors() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState(1);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [updateMode, setUpdateMode] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [results, setResults] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n').map(l => l.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
        setHeaders(lines[0]);
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

      const response = await fetch('/api/imports/vendors/commit', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setResults(data);
        setStep(3);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/purchases/vendors')} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-500">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Import Vendors</h1>
          <p className="text-sm text-slate-500">Commiting supplier data to server storage.</p>
        </div>
      </div>

      {errorMsg && <div className="p-4 bg-red-50 text-red-700 rounded-xl font-bold flex items-center gap-2"><XCircle size={20}/> {errorMsg}</div>}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 bg-slate-50">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex-1 py-4 text-center text-xs font-black uppercase ${step === s ? 'text-blue-600 bg-white border-b-2 border-blue-600' : 'text-slate-400'}`}>
              {s === 1 ? 'Upload' : s === 2 ? 'Confirm' : 'Finished'}
            </div>
          ))}
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="text-center py-12">
              <label className="cursor-pointer group">
                <UploadCloud size={48} className="mx-auto text-blue-600 mb-4" />
                <input type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
                <span className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold">Select Vendor CSV</span>
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase">Vendor Name Column</label>
                  <select 
                    value={mapping.name || ''} 
                    onChange={(e) => setMapping({ ...mapping, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                  >
                    <option value="">(Choose column)</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                  <h4 className="text-sm font-black text-blue-900 mb-2">SAFE IMPORT MODE</h4>
                  <p className="text-xs text-blue-700">No data is ever deleted. If a vendor exists, we skip it by default unless "Update Mode" is checked.</p>
                </div>
              </div>
              <button 
                onClick={processImport}
                disabled={processing || !mapping.name}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {processing ? <Loader2 className="animate-spin" size={20} /> : 'Confirm & Commit to Server'}
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-10 space-y-6">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-xl font-bold">Import Completed</h2>
              <div className="text-sm text-slate-500">
                <p>Created: {results.created}</p>
                <p>Failed: {results.failed}</p>
              </div>
              <button onClick={() => navigate('/purchases/vendors?reset=1')} className="px-10 py-3 bg-blue-600 text-white rounded-xl font-bold">Return to Vendors</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
