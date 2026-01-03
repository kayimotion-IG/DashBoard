import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ClipboardList, Truck, Receipt, 
  CheckCircle2, Clock, Calendar, PackageCheck, FileDown, 
  User as UserIcon, Building2, AlertCircle, ArrowRight
} from 'lucide-react';
import { purchaseService } from '../../services/purchase.service';
import { pdfService } from '../../services/pdf.service';
import { useAuth } from '../../App';
import { PurchaseOrder, Vendor } from '../../types';

export default function PurchaseOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, can } = useAuth();
  
  const [po, setPO] = useState<PurchaseOrder | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);

  useEffect(() => {
    if (id) {
      const order = purchaseService.getPOById(id);
      if (order) {
        setPO(order);
        setVendor(purchaseService.getVendorById(order.vendorId) || null);
      }
    }
  }, [id]);

  if (!po) return <div className="p-20 text-center font-bold text-slate-400 italic">Purchase Order not found...</div>;

  const handleExportPDF = () => {
    if (po && vendor) {
      pdfService.generatePurchaseOrder(po, vendor, user);
    }
  };

  const handleIssue = async () => {
    await purchaseService.updatePOStatus(po.id, 'Issued', user);
    setPO({...po, status: 'Issued'});
  };

  const handleReceive = async () => {
    try {
      await purchaseService.receivePO(po.id, 'WH01', user);
      setPO({...po, status: 'Received'});
      alert('Items received into Main Warehouse. Stock ledger updated.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleBill = async () => {
    try {
      await purchaseService.createBillFromPO(po.id, user);
      setPO({...po, status: 'Billed'});
      alert('Vendor bill generated for this order.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const StatusStepper = () => (
    <div className="flex items-center gap-4 py-8 px-6 bg-slate-50 rounded-3xl border border-slate-100">
      {[
        { label: 'Draft', status: 'Draft', icon: <Clock size={16} /> },
        { label: 'Issued', status: 'Issued', icon: <CheckCircle2 size={16} /> },
        { label: 'Received', status: 'Received', icon: <Truck size={16} /> },
        { label: 'Billed', status: 'Billed', icon: <Receipt size={16} /> }
      ].map((step, idx) => {
        const statuses = ['Draft', 'Issued', 'Received', 'Billed', 'Cancelled'];
        const isPast = statuses.indexOf(po.status) >= idx;
        return (
          <React.Fragment key={step.status}>
            <div className={`flex flex-col items-center gap-2 ${isPast ? 'text-rose-600' : 'text-slate-300'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${isPast ? 'border-rose-600 bg-white shadow-sm' : 'border-slate-200'}`}>
                {step.icon}
              </div>
              <span className="text-[10px] font-black uppercase tracking-tighter">{step.label}</span>
            </div>
            {idx < 3 && <div className={`flex-1 h-0.5 ${isPast ? 'bg-rose-600' : 'bg-slate-200'}`}></div>}
          </React.Fragment>
        );
      })}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/purchases/orders')} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-500">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900">{po.poNumber}</h1>
              <span className="text-xs font-black px-2 py-0.5 bg-slate-100 text-slate-400 rounded-md border border-slate-200 font-mono uppercase">ID: {po.id}</span>
            </div>
            <p className="text-sm text-slate-500 font-medium">Issued on {new Date(po.date).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExportPDF} className="p-2.5 text-slate-700 bg-white border border-slate-200 rounded-xl transition-all flex items-center gap-2 text-sm font-bold shadow-sm hover:bg-slate-50">
            <FileDown size={18} />
            Export PDF
          </button>
          
          {po.status === 'Draft' && can('purchases.create') && (
            <button 
              onClick={handleIssue}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-sm shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
            >
              <CheckCircle2 size={18} />
              Issue PO
            </button>
          )}

          {po.status === 'Issued' && (
            <button 
              onClick={handleReceive}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold text-sm shadow-xl active:scale-95 transition-all"
            >
              <Truck size={18} />
              Receive Items
            </button>
          )}

          {po.status === 'Received' && (
            <button 
              onClick={handleBill}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold text-sm shadow-xl active:scale-95 transition-all"
            >
              <Receipt size={18} />
              Convert to Bill
            </button>
          )}
        </div>
      </div>

      {po.status === 'Draft' && (
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-[32px] flex items-start gap-4 animate-in slide-in-from-top-4">
          <div className="p-3 bg-white rounded-2xl shadow-sm text-amber-600">
            <AlertCircle size={24} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-black text-amber-900 uppercase tracking-widest mb-1">Status: Internal Draft</h4>
            <p className="text-xs text-amber-700 leading-relaxed font-medium">
              This Purchase Order is currently a draft. It has not been authorized or issued to the vendor. 
              Review the costs and items below, then click <b>"Issue PO"</b> to finalize the procurement request.
            </p>
          </div>
          <button 
            onClick={handleIssue}
            className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-200 hover:bg-amber-700 transition-all active:scale-95"
          >
            Issue Now <ArrowRight size={16} />
          </button>
        </div>
      )}

      <StatusStepper />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <ClipboardList size={18} className="text-rose-600" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Order Specification</h3>
            </div>
            <table className="w-full text-left">
              <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-4">Item Catalog #</th>
                  <th className="px-6 py-4 text-center">Qty</th>
                  <th className="px-6 py-4 text-right">Unit Cost (AED)</th>
                  <th className="px-8 py-4 text-right">Line Total (AED)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {po.lines.map(line => (
                  <tr key={line.id} className="text-sm">
                    <td className="px-8 py-5">
                      <p className="font-bold text-slate-900">{line.itemName}</p>
                    </td>
                    <td className="px-6 py-5 text-center font-black text-slate-700">{line.quantity}</td>
                    <td className="px-6 py-5 text-right text-slate-500">AED {line.rate.toFixed(2)}</td>
                    <td className="px-8 py-5 text-right font-black text-slate-900">AED {line.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-end">
              <div className="w-72">
                <div className="pt-3 flex justify-between items-center">
                  <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Grand Total</span>
                  <span className="text-2xl font-black text-rose-600">AED {po.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Supplier Information</h4>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center font-black text-lg">
                {vendor?.name[0]}
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">{vendor?.name}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{vendor?.companyName}</p>
              </div>
            </div>
            
            <div className="space-y-4 pt-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Office Address</p>
                <p className="text-xs text-slate-600 leading-relaxed">{vendor?.address || 'No address specified'}</p>
              </div>
              {po.expectedDate && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-100 text-xs font-bold">
                   <AlertCircle size={16} />
                   Delivery expected by {new Date(po.expectedDate).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}