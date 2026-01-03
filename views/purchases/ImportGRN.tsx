import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileUp, ArrowLeft, CheckCircle2, AlertTriangle, 
  ChevronRight, UploadCloud, RefreshCw, Layers 
} from 'lucide-react';
import { useAuth } from '../../App';
import { purchaseService } from '../../services/purchase.service';
import { itemService } from '../../services/item.service';

export default function ImportGRN() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState(1);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [results, setResults] = useState<{
    totalRows: number, 
    grnsCreated: number, 
    linesCreated: number,
    failed: number, 
    errors: string[]
  }>({ totalRows: 0, grnsCreated: 0, linesCreated: 0, failed: 0, errors: [] });

  const fields = [
    { key: 'vendorName', label: 'Vendor Name', required: true },
    { key: 'receiveNo', label: 'Receive No (GRN)', required: true },
    { key: 'receiveDate', label: 'Date' },
    { key: 'warehouse', label: 'Warehouse' },
    { key: 'sku', label: 'SKU', required: true },
    { key: 'itemName', label: 'Item Name' },
    { key: 'qty', label: 'Quantity', required: true },
    { key: 'unitCost', label: 'Unit Cost' },
    { key: 'taxCode', label: 'Tax Code' },
    { key: 'notes', label: 'Notes' }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n').map(l => l.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
        if (lines.length < 1) return;
        
        setHeaders(lines[0]);
        setRows(lines.slice(1).filter(r => r.length > 0 && r.some(cell => cell !== '')));
        
        // Auto-map based on common strings
        const initialMap: any = {};
        lines[0].forEach((h) => {
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

  // FIX: processImport is now async to handle awaited service calls correctly
  const processImport = async () => {
    let grnsCreatedCount = 0;
    let linesCreatedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // Grouping by receiveNo
    const grnGroups: Record<string, any[]> = {};

    rows.forEach((row, idx) => {
      try {
        const rowData: any = {};
        fields.forEach(f => {
          const headerIdx = headers.indexOf(mapping[f.key]);
          if (headerIdx !== -1) {
            rowData[f.key] = row[headerIdx];
          }
        });

        if (!rowData.receiveNo || !rowData.sku || !rowData.vendorName) {
          throw new Error(`Row ${idx + 2}: Missing mandatory fields (Vendor, ReceiveNo or SKU).`);
        }

        const qty = Number(rowData.qty) || 0;
        if (qty <= 0) return; // Skip zero or negative qty

        if (!grnGroups[rowData.receiveNo]) {
          grnGroups[rowData.receiveNo] = [];
        }
        grnGroups[rowData.receiveNo].push(rowData);
      } catch (err: any) {
        failedCount++;
        errors.push(err.message);
      }
    });

    // Process each group
    for (const receiveNo of Object.keys(grnGroups)) {
      const lines = grnGroups[receiveNo];
      const firstLine = lines[0];

      try {
        // Resolve Vendor
        // FIX: Added await to findOrCreateVendor
        const vendor = await purchaseService.findOrCreateVendor(firstLine.vendorName, user);
        
        // Resolve Warehouse
        const warehouse = itemService.findOrCreateWarehouse(firstLine.warehouse || 'Main Warehouse');

        const grnLines: any[] = [];
        let grnTotal = 0;

        for (const line of lines) {
          // Resolve Item
          let item = itemService.getItemBySku(line.sku);
          if (!item) {
            // FIX: itemService.createItem is async, must be awaited
            item = await itemService.createItem({
              name: line.itemName || line.sku,
              sku: line.sku,
              itemType: 'Goods',
              trackInventory: true,
              category: 'General',
              purchasePrice: Number(line.unitCost) || 0,
              sellingPrice: (Number(line.unitCost) || 0) * 1.2
            }, user);
          }

          const unitCost = Number(line.unitCost) || 0;
          const qty = Number(line.qty);
          const lineTotal = unitCost * qty;
          
          grnLines.push({
            id: `LN-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            itemId: item.id,
            sku: item.sku,
            itemName: item.name,
            quantity: qty,
            unitCost: unitCost,
            total: lineTotal
          });

          grnTotal += lineTotal;
          linesCreatedCount++;
        }

        // FIX: purchaseService.createGRN is async, must be awaited
        await purchaseService.createGRN({
          receiveNo,
          vendorId: vendor.id,
          warehouseId: warehouse.id,
          date: firstLine.receiveDate || new Date().toISOString(),
          total: grnTotal,
          lines: grnLines,
          notes: firstLine.notes || 'Imported from CSV'
        }, user!);

        grnsCreatedCount++;
      } catch (err: any) {
        failedCount += lines.length;
        errors.push(`GRN ${receiveNo}: ${err.message}`);
      }
    }

    setResults({ 
      totalRows: rows.length, 
      grnsCreated: grnsCreatedCount, 
      linesCreated: linesCreatedCount,
      failed: failedCount, 
      errors 
    });
    setStep(3);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/purchases/orders')} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-500">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Import Purchase Receives</h1>
          <p className="text-sm text-slate-500">Bulk upload Goods Receive Notes (GRN) and update inventory ledgers.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 bg-slate-50">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex-1 flex items-center justify-center py-4 gap-2 text-xs font-black uppercase tracking-widest ${step === s ? 'text-blue-600 bg-white border-b-2 border-blue-600' : 'text-slate-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center border ${step >= s ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'}`}>{s}</span>
              {s === 1 ? 'Upload' : s === 2 ? 'Mapping' : 'Summary'}
            </div>
          ))}
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="text-center py-12">
              <label className="cursor-pointer group">
                <div className="mx-auto w-24 h-24 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-blue-100 shadow-sm">
                  <UploadCloud size={48} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Select GRN CSV File</h3>
                <p className="text-sm text-slate-400 mb-8 max-w-sm mx-auto">Upload your purchase receipt file. Lines with same <b>Receive No</b> will be grouped.</p>
                <input type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
                <span className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all">Choose CSV</span>
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Field Correlation</h4>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {fields.map(field => (
                      <div key={field.key} className="flex flex-col gap-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        <select 
                          value={mapping[field.key] || ''} 
                          onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                          className="px-3 py-2 border border-slate-200 rounded-lg outline-none text-sm bg-white focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="">(Not mapped)</option>
                          {headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Receipt Preview</h4>
                  <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-[10px] text-left">
                      <thead className="bg-slate-50">
                        <tr>
                          {headers.slice(0, 4).map(h => (
                            <th key={h} className="px-3 py-2 font-black text-slate-500 truncate max-w-[80px]">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {rows.slice(0, 5).map((row, i) => (
                          <tr key={i}>
                            {row.slice(0, 4).map((cell, j) => (
                              <td key={j} className="px-3 py-2 text-slate-600 truncate max-w-[80px]">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
                    <Layers size={16} className="text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-blue-700 leading-relaxed font-medium">
                      <b>Auto-Grouping:</b> The system detected {rows.length} rows. Multiple items for the same Receive No will be consolidated into single GRN documents.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={processImport}
                  className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                >
                  Finalize & Post Receives
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-8 space-y-10 animate-in zoom-in-95 duration-300">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {[
                  { label: 'Total Rows', count: results.totalRows, color: 'text-slate-600', bg: 'bg-slate-50' },
                  { label: 'GRNs Created', count: results.grnsCreated, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'Lines Posted', count: results.linesCreated, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Failed Rows', count: results.failed, color: 'text-red-600', bg: 'bg-red-50' },
                ].map((stat, i) => (
                  <div key={i} className={`${stat.bg} p-6 rounded-2xl border border-transparent`}>
                    <p className={`text-3xl font-black ${stat.color}`}>{stat.count}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              {results.errors.length > 0 && (
                <div className="max-w-2xl mx-auto p-6 bg-red-50 border border-red-100 rounded-2xl text-left">
                  <h5 className="text-xs font-black text-red-700 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <AlertTriangle size={16} /> Error Log
                  </h5>
                  <ul className="text-[11px] text-red-600 space-y-1.5 font-medium max-h-48 overflow-y-auto custom-scrollbar pr-2">
                    {results.errors.map((e, i) => <li key={i} className="flex gap-2"><span className="opacity-40">•</span>{e}</li>)}
                  </ul>
                </div>
              )}

              <div className="pt-4 flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full text-xs font-bold border border-emerald-100">
                  <CheckCircle2 size={16} /> Receives Processed Successfully
                </div>
                <button 
                  onClick={() => navigate('/purchases/orders')}
                  className="px-10 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-2xl active:scale-95 transition-all"
                >
                  Go to Purchase List
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}