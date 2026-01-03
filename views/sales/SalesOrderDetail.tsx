
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ShoppingCart, Truck, Receipt, 
  CheckCircle2, Clock, Printer, Mail, MoreVertical,
  ChevronRight, AlertCircle, PackageCheck, FileDown, Paperclip,
  ExternalLink, Wallet, FileText, Loader2, X
} from 'lucide-react';
import { salesService } from '../../services/sales.service';
import { pdfService } from '../../services/pdf.service';
import { useAuth } from '../../App';
import { SalesOrder, Customer, Invoice } from '../../types';

export default function SalesOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, can } = useAuth();
  
  const [so, setSO] = useState<SalesOrder | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (id) {
      const order = salesService.getSOById(id);
      if (order) {
        setSO(order);
        setCustomer(salesService.getCustomerById(order.customerId) || null);
      }
    }
  }, [id]);

  if (!so) return <div className="p-20 text-center text-slate-400 italic">Order not found...</div>;

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await salesService.updateSOStatus(so.id, 'Confirmed', user);
      setSO({...so, status: 'Confirmed'});
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShip = async () => {
    setIsProcessing(true);
    try {
      await salesService.createDelivery(so.id, user);
      setSO({...so, status: 'Shipped'});
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportPDF = () => {
    if (so && customer) pdfService.generateSalesOrder(so, customer, user);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/sales/orders')} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-500">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900">{so.orderNumber}</h1>
            <p className="text-sm text-slate-500">Order date: {new Date(so.date).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExportPDF} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50">
            <FileDown size={18} /> Export PDF
          </button>
          
          {so.status === 'Draft' && (
            <button 
              disabled={isProcessing}
              onClick={handleApprove}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-xl hover:bg-blue-700 disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
              Confirm Order
            </button>
          )}

          {so.status === 'Confirmed' && (
            <button 
              disabled={isProcessing}
              onClick={handleShip}
              className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 text-white rounded-xl font-bold text-sm shadow-xl hover:bg-amber-700 disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Truck size={18} />}
              Generate Shipment
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 bg-slate-50 border-b flex items-center gap-2">
            <ShoppingCart size={18} className="text-blue-600" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Line Items</h3>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400">
              <tr>
                <th className="px-8 py-4">Item</th>
                <th className="px-6 py-4 text-center">Qty</th>
                <th className="px-6 py-4 text-right">Rate</th>
                <th className="px-8 py-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {so.lines.map(line => (
                <tr key={line.id}>
                  <td className="px-8 py-5 text-sm font-bold text-slate-700">{line.itemName}</td>
                  <td className="px-6 py-5 text-center font-bold text-slate-500">{line.quantity}</td>
                  <td className="px-6 py-5 text-right text-slate-500">{line.rate.toFixed(2)}</td>
                  <td className="px-8 py-5 text-right font-black text-slate-900">AED {line.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-8 bg-slate-50 border-t flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm font-bold text-slate-500">
                <span>Sub Total</span>
                <span>AED {so.subTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-black text-blue-600 pt-2 border-t">
                <span>TOTAL</span>
                <span>AED {so.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Customer</h4>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-black text-xl">{customer?.name[0]}</div>
              <div>
                <p className="text-sm font-black text-slate-900">{customer?.name}</p>
                <p className="text-xs text-slate-500">{customer?.companyName}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900 p-6 rounded-3xl text-white">
             <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Order Status</p>
             <p className="text-2xl font-black">{so.status}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
