
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, FileText, Send, Download, Mail, 
  User as UserIcon, Building2, ShieldCheck, 
  CheckCircle2, Loader2, Save, Printer, Eye
} from 'lucide-react';
import { salesService } from '../../services/sales.service';
import { pdfService } from '../../services/pdf.service';
import { useAuth } from '../../App';
import { Invoice, Customer } from '../../types';

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [emailData, setEmailData] = useState({
    to: '',
    subject: '',
    body: ''
  });

  useEffect(() => {
    if (id) {
      const inv = salesService.getInvoiceById(id);
      if (inv) {
        setInvoice(inv);
        const cust = salesService.getCustomerById(inv.customerId);
        if (cust) {
          setCustomer(cust);
          setEmailData({
            to: cust.email || '',
            subject: `Tax Invoice ${inv.invoiceNumber} - ${cust.companyName || cust.name}`,
            body: `Dear ${cust.name},\n\nPlease find attached Tax Invoice ${inv.invoiceNumber} for your recent order.\n\nTotal Amount: AED ${inv.total.toLocaleString()}\nDue Date: ${new Date(inv.dueDate).toLocaleDateString()}\n\nThank you for choosing KlenCare FZC.`
          });
        }
      }
    }
  }, [id]);

  if (!invoice || !customer) return <div className="p-20 text-center text-slate-400 italic">Syncing record...</div>;

  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      await salesService.updateInvoice(invoice.id, invoice);
      setSuccessMsg('Record updated successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e) {
      alert('Update failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendEmail = async () => {
    setIsSending(true);
    try {
      await salesService.sendInvoiceEmail(invoice.id, emailData);
      setSuccessMsg('Email dispatched to client queue.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e) {
      alert('Email failed');
    } finally {
      setIsSending(false);
    }
  };

  const handleDownloadPDF = () => {
    pdfService.generateInvoice(invoice, customer, user);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/sales/invoices')} className="p-2.5 bg-white border rounded-xl hover:bg-slate-50 transition-all text-slate-500">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{invoice.invoiceNumber}</h1>
            <p className="text-sm text-slate-500 font-medium">Billed to: <span className="text-slate-900 font-bold">{customer.name}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           {successMsg && (
             <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-2">
                <CheckCircle2 size={14} /> {successMsg}
             </span>
           )}
           <button 
             onClick={handleDownloadPDF}
             className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-xl active:scale-95 transition-all"
           >
             <Download size={18} /> Download PDF
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT PANEL: EDITABLE BILLING DETAILS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-10 space-y-8">
             <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><FileText size={16}/> Tax Invoice Metadata</h3>
                <button onClick={handleUpdate} disabled={isSaving} className="text-blue-600 text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:text-blue-800">
                   {isSaving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>} Save Changes
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Invoice Number</label>
                   <input value={invoice.invoiceNumber} onChange={e => setInvoice({...invoice, invoiceNumber: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-50" />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Customer TRN (VAT #)</label>
                   <div className="relative">
                      <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                      <input value={invoice.lpoNumber || ''} onChange={e => setInvoice({...invoice, lpoNumber: e.target.value})} placeholder="e.g. 100..." className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-2xl font-mono text-sm outline-none focus:ring-4 focus:ring-blue-50" />
                   </div>
                </div>
                <div className="md:col-span-2 space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notes / Remarks</label>
                   <textarea rows={2} value={invoice.notes || ''} onChange={e => setInvoice({...invoice, notes: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-50" />
                </div>
             </div>

             <div className="pt-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Billed Items</h4>
                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                   <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase">
                         <tr>
                            <th className="px-6 py-4">Item</th>
                            <th className="px-6 py-4 text-center">Qty</th>
                            <th className="px-6 py-4 text-right">Total</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 bg-white">
                         {invoice.lines?.map((line, idx) => (
                           <tr key={idx}>
                              <td className="px-6 py-4 text-sm font-bold text-slate-700">{line.itemName}</td>
                              <td className="px-6 py-4 text-center text-sm font-bold text-slate-500">{line.quantity}</td>
                              <td className="px-6 py-4 text-right text-sm font-black text-slate-900">AED {line.total.toLocaleString()}</td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        </div>

        {/* RIGHT PANEL: EMAIL DISPATCHER */}
        <div className="space-y-6">
           <div className="bg-slate-900 rounded-[40px] shadow-2xl p-8 text-white space-y-6">
              <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                 <div className="w-12 h-12 bg-blue-600 rounded-[18px] flex items-center justify-center shadow-lg"><Send size={20}/></div>
                 <div>
                    <h3 className="text-sm font-black uppercase tracking-widest">Email Dispatcher</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Direct Client Outreach</p>
                 </div>
              </div>

              <div className="space-y-5">
                 <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Recipient (To)</label>
                    <div className="relative">
                       <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14}/>
                       <input value={emailData.to} onChange={e => setEmailData({...emailData, to: e.target.value})} className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white outline-none focus:border-blue-500 transition-all" placeholder="accounts@client.ae" />
                    </div>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Subject Line</label>
                    <input value={emailData.subject} onChange={e => setEmailData({...emailData, subject: e.target.value})} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white outline-none focus:border-blue-500 transition-all" />
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Message Body</label>
                    <textarea rows={8} value={emailData.body} onChange={e => setEmailData({...emailData, body: e.target.value})} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] leading-relaxed text-slate-300 outline-none focus:border-blue-500 transition-all resize-none" />
                 </div>

                 <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center"><Printer size={16}/></div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Compliance: VAT PDF will be attached automatically.</p>
                 </div>

                 <button 
                   onClick={handleSendEmail}
                   disabled={isSending}
                   className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[20px] font-black uppercase text-xs tracking-[0.2em] shadow-[0_15px_40px_rgba(37,99,235,0.3)] transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                 >
                   {isSending ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>}
                   {isSending ? 'Sending...' : 'Dispatch Email'}
                 </button>
              </div>
           </div>

           <div className="bg-white rounded-[32px] border border-slate-200 p-6 shadow-sm">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Internal Log</h4>
              <div className="space-y-4">
                 <div className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
                    <p className="text-[10px] text-slate-600 font-medium leading-relaxed">Invoice generated by <span className="font-bold">{user?.name}</span> at {new Date(invoice.date).toLocaleTimeString()}.</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
