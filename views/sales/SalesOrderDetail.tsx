
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ShoppingCart, Truck, Receipt, 
  CheckCircle2, Clock, Printer, Mail, MoreVertical,
  ChevronRight, AlertCircle, PackageCheck, FileDown, Paperclip
} from 'lucide-react';
import { salesService } from '../../services/sales.service';
import { itemService } from '../../services/item.service';
import { pdfService } from '../../services/pdf.service';
import { documentService } from '../../services/document.service';
import { useAuth } from '../../App';
import { SalesOrder, Customer, AppDocument } from '../../types';

export default function SalesOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, can } = useAuth();
  
  const [so, setSO] = useState<SalesOrder | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [attachments, setAttachments] = useState<AppDocument[]>([]);

  useEffect(() => {
    if (id) {
      const order = salesService.getSOById(id);
      if (order) {
        setSO(order);
        setCustomer(salesService.getCustomerById(order.customerId) || null);
        setAttachments(documentService.getDocumentsForEntity('SALES_ORDER', id));
      }
    }
  }, [id]);

  if (!so) return <div className="p-20 text-center font-bold text-slate-400 italic">Order not found...</div>;

  const handleApprove = () => {
    salesService.updateSOStatus(so.id, 'Confirmed', user);
    setSO({...so, status: 'Confirmed'});
  };

  const handleShip = () => {
    try {
      salesService.createDelivery(so.id, 'WH01', user);
      setSO({...so, status: 'Shipped'});
      alert('Delivery Challan generated and Stock deducted.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleInvoice = () => {
    salesService.createInvoiceFromSO(so.id, user);
    setSO({...so, status: 'Invoiced'});
    alert('Invoice generated for this order.');
  };

  const handleExportPDF = () => {
    if (so && customer) {
      pdfService.generateSalesOrder(so, customer, user);
    }
  };

  const StatusStepper = () => (
    <div className="flex items-center gap-4 py-8 px-6 bg-slate-50 rounded-3xl border border-slate-100">
      {[
        { label: 'Draft', status: 'Draft', icon: <Clock size={16} /> },
        { label: 'Confirmed', status: 'Confirmed', icon: <CheckCircle2 size={16} /> },
        { label: 'Shipped', status: 'Shipped', icon: <Truck size={16} /> },
        { label: 'Invoiced', status: 'Invoiced', icon: <Receipt size={16} /> }
      ].map((step, idx) => {
        const statuses = ['Draft', 'Confirmed', 'Shipped', 'Invoiced', 'Closed'];
        const isPast = statuses.indexOf(so.status) >= idx;
        const isCurrent = so.status === step.status;
        return (
          <React.Fragment key={step.status}>
            <div className={`flex flex-col items-center gap-2 ${isPast ? 'text-blue-600' : 'text-slate-300'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${isPast ? 'border-blue-600 bg-white' : 'border-slate-200'}`}>
                {step.icon}
              </div>
              <span className="text-[10px] font-black uppercase tracking-tighter">{step.label}</span>
            </div>
            {idx < 3 && <div className={`flex-1 h-0.5 ${isPast ? 'bg-blue-600' : 'bg-slate-200'}`}></div>}
          </React.Fragment>
        );
      })}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/sales/orders')} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-500">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900">{so.orderNumber}</h1>
              <span className="text-xs font-black px-2 py-0.5 bg-slate-100 text-slate-400 rounded-md border border-slate-200 font-mono uppercase">ID: {so.id}</span>
            </div>
            <p className="text-sm text-slate-500 font-medium">Placed on {new Date(so.date).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExportPDF} className="p-2.5 text-slate-700 bg-white border border-slate-200 rounded-xl transition-all flex items-center gap-2 text-sm font-bold shadow-sm hover:bg-slate-50">
            <FileDown size={18} />
            Export PDF
          </button>
          
          {so.status === 'Draft' && can('sales.approve') && (
            <button 
              onClick={handleApprove}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-sm shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
            >
              <CheckCircle2 size={18} />
              Confirm Order
            </button>
          )}

          {so.status === 'Confirmed' && (
            <button 
              onClick={handleShip}
              className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 font-bold text-sm shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
            >
              <Truck size={18} />
              Convert to Shipment
            </button>
          )}

          {so.status === 'Shipped' && (
            <button 
              onClick={handleInvoice}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold text-sm shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
            >
              <Receipt size={18} />
              Create Invoice
            </button>
          )}
        </div>
      </div>

      <StatusStepper />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <PackageCheck size={18} className="text-blue-600" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Order Summary</h3>
            </div>
            <table className="w-full text-left">
              <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-4">Item & Description</th>
                  <th className="px-6 py-4 text-center">Qty</th>
                  <th className="px-6 py-4 text-right">Rate</th>
                  <th className="px-8 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {so.lines.map(line => (
                  <tr key={line.id} className="text-sm">
                    <td className="px-8 py-5">
                      <p className="font-bold text-slate-900">{line.itemName}</p>
                      <p className="text-[10px] text-slate-400 font-medium">SKU Tracking Active</p>
                    </td>
                    <td className="px-6 py-5 text-center font-black text-slate-700">{line.quantity}</td>
                    <td className="px-6 py-5 text-right text-slate-500">AED {line.rate.toFixed(2)}</td>
                    <td className="px-8 py-5 text-right font-black text-slate-900">AED {line.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-end">
              <div className="w-72 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Sub Total</span>
                  <span className="text-slate-900 font-bold">AED {so.subTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">VAT (5%)</span>
                  <span className="text-slate-900 font-bold">AED {so.taxTotal.toLocaleString()}</span>
                </div>
                <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Grand Total</span>
                  <span className="text-2xl font-black text-blue-600">AED {so.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Paperclip size={16} className="text-slate-400" />
                  Attachments
                </h3>
                <button className="text-[10px] font-black text-blue-600 uppercase">Add Files</button>
             </div>
             <div className="grid grid-cols-2 gap-4">
               {attachments.map(att => (
                 <div key={att.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                    <div className="p-2 bg-white rounded-lg text-slate-400 group-hover:text-blue-500 transition-colors"><FileDown size={18} /></div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate">{att.name}</p>
                      <p className="text-[10px] text-slate-400">{(att.size / 1024).toFixed(1)} KB</p>
                    </div>
                 </div>
               ))}
               {attachments.length === 0 && <p className="text-xs text-slate-400 italic py-4">No documents linked to this order.</p>}
             </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Customer Context</h4>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-black text-lg">
                {customer?.name[0]}
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">{customer?.name}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{customer?.companyName}</p>
              </div>
            </div>
            
            <div className="space-y-4 pt-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Billing Address</p>
                <p className="text-xs text-slate-600 leading-relaxed">{customer?.billingAddress}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Shipping Address</p>
                <p className="text-xs text-slate-600 leading-relaxed">{customer?.shippingAddress}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
