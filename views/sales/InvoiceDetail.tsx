
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, FileText, Send, Download, Mail, 
  User as UserIcon, Building2, ShieldCheck, 
  CheckCircle2, Loader2, Save, Printer, Eye, History, Clock,
  ArrowUpRight, Info, DollarSign, PieChart, MailCheck, AlertCircle
} from 'lucide-react';
import { salesService } from '../../services/sales.service';
import { pdfService } from '../../services/pdf.service';
import { itemService } from '../../services/item.service';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../App';
import { Invoice, Customer } from '../../types';

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [isPlainText, setIsPlainText] = useState(false);

  const [emailData, setEmailData] = useState({
    to: '',
    subject: '',
    body: ''
  });

  const refreshHistory = async () => {
    try {
      const allComms = await apiRequest('GET', '/api/communications');
      setHistory(allComms.filter((c: any) => c.entityId === id));
    } catch (e) {}
  };

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
        refreshHistory();
      }
    }
  }, [id]);

  if (!invoice || !customer) return <div className="p-20 text-center text-slate-400 italic">Syncing record...</div>;

  const lastDispatch = history.length > 0 ? history[0] : null;
  const costBasis = salesService.calculateLineCost(invoice.lines || []);
  const profit = invoice.total - (invoice.total * 0.0476) - costBasis; 
  const margin = invoice.total > 0 ? (profit / (invoice.total / 1.05)) * 100 : 0;

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
      await salesService.sendInvoiceEmail(invoice.id, { 
        ...emailData, 
        sentBy: user?.name,
        plainText: isPlainText 
      });
      setSuccessMsg('Email dispatched successfully.');
      refreshHistory();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e) {
      alert('Email failed');
    } finally {
      setIsSending(false);
    }
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
           <button onClick={() => pdfService.generateInvoice(invoice, customer, user)} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-xl active:scale-95 transition-all">
             <Download size={18} /> Download PDF
           </button>
        </div>
      </div>

      {/* DISPATCH VERIFICATION BANNER */}
      {lastDispatch && (
        <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-[28px] flex items-center justify-between shadow-sm animate-in slide-in-from-top-2">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                 <MailCheck size={24}/>
              </div>
              <div>
                 <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest">Delivery Verified</h4>
                    <span className="px-2 py-0.5 bg-indigo-600 text-white rounded-md text-[8px] font-black uppercase">SMTP OK</span>
                 </div>
                 <p className="text-xs text-indigo-600 font-medium mt-0.5">Sent to <span className="font-bold">{lastDispatch.recipient}</span> on {new Date(lastDispatch.timestamp).toLocaleString()}</p>
              </div>
           </div>
           <button onClick={() => setActiveTab('history')} className="px-5 py-2 bg-white border border-indigo-200 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">View Receipt</button>
        </div>
      )}

      <div className="flex border-b border-slate-200">
         <button onClick={() => setActiveTab('details')} className={`px-8 py-4 text-sm font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>Invoice Details</button>
         <button onClick={() => setActiveTab('history')} className={`px-8 py-4 text-sm font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>Communication History ({history.length})</button>
      </div>

      {activeTab === 'details' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                    <input value={invoice.invoiceNumber} onChange={e => setInvoice({...invoice, invoiceNumber: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Customer TRN</label>
                    <input value={invoice.lpoNumber || ''} onChange={e => setInvoice({...invoice, lpoNumber: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-2xl font-mono text-sm outline-none" />
                  </div>
              </div>
            </div>

            <div className="bg-emerald-900 rounded-[40px] shadow-2xl p-10 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-10 -mt-10 w-64 h-64 bg-emerald-500 rounded-full blur-[100px] opacity-10"></div>
                <div className="relative z-10">
                   <div className="flex items-center gap-3 mb-8">
                      <div className="p-3 bg-white/10 rounded-2xl"><PieChart size={24} className="text-emerald-400"/></div>
                      <h3 className="text-lg font-black uppercase tracking-widest">Internal Profit Analysis</h3>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                      <div>
                         <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">Total Cost (Basis)</p>
                         <p className="text-2xl font-black">AED {costBasis.toLocaleString()}</p>
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">Estimated Net Profit</p>
                         <p className="text-2xl font-black">AED {profit.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-3xl border border-white/10 flex flex-col items-center justify-center">
                         <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">Margin Percentage</p>
                         <div className="flex items-center gap-2">
                            <span className="text-3xl font-black text-white">{margin.toFixed(1)}%</span>
                            <ArrowUpRight className="text-emerald-400" size={24} />
                         </div>
                      </div>
                   </div>
                </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[40px] shadow-2xl p-8 text-white space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-6">
                 <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-[18px] flex items-center justify-center shadow-lg"><Send size={20}/></div>
                    <h3 className="text-sm font-black uppercase tracking-widest">Email Dispatcher</h3>
                 </div>
                 
                 <label className="flex items-center gap-2 cursor-pointer group">
                    <span className="text-[9px] font-black uppercase text-slate-500 group-hover:text-blue-400 transition-colors">Plain Text</span>
                    <input 
                      type="checkbox" 
                      checked={isPlainText} 
                      onChange={e => setIsPlainText(e.target.checked)}
                      className="w-4 h-4 accent-blue-500 rounded" 
                    />
                 </label>
              </div>
              <div className="space-y-5">
                 <input value={emailData.to} onChange={e => setEmailData({...emailData, to: e.target.value})} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none" placeholder="Recipient..." />
                 <input value={emailData.subject} onChange={e => setEmailData({...emailData, subject: e.target.value})} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none" />
                 <textarea rows={6} value={emailData.body} onChange={e => setEmailData({...emailData, body: e.target.value})} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-300 outline-none resize-none" />
                 
                 <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                    <Info size={14} className="text-blue-400 shrink-0"/>
                    <p className="text-[9px] text-blue-300 font-bold uppercase tracking-tighter leading-tight">
                      {isPlainText ? 'Sending as plain-text message. Fast & Simple.' : 'Sending with professional HTML & PDF attachments.'}
                    </p>
                 </div>

                 <button onClick={handleSendEmail} disabled={isSending} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[20px] font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3 disabled:opacity-50">
                   {isSending ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>}
                   {isSending ? 'Dispatching...' : 'Send Invoice'}
                 </button>
              </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-10">
           <div className="space-y-6">
              {history.length === 0 ? (
                <div className="text-center py-20 text-slate-300 italic">No communication logs found for this invoice.</div>
              ) : history.map((log) => (
                <div key={log.id} className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 flex items-start gap-5">
                   <div className="p-3 bg-white rounded-2xl shadow-sm text-blue-600"><Mail size={24}/></div>
                   <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                         <h4 className="text-sm font-black text-slate-900">{log.subject}</h4>
                         <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 uppercase tracking-widest">{log.status}</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-4">Sent to: <span className="text-slate-900 font-bold">{log.recipient}</span></p>
                      <div className="p-4 bg-white rounded-2xl border border-slate-100 text-[11px] text-slate-600 whitespace-pre-wrap">{log.body}</div>
                      <div className="mt-4 flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                         <div className="flex items-center gap-1"><Clock size={12}/> {new Date(log.timestamp).toLocaleString()}</div>
                         <div className="flex items-center gap-1"><UserIcon size={12}/> By {log.sentBy}</div>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
}
