import React, { useState } from 'react';
import { 
  TrendingUp, TrendingDown, Package, 
  DollarSign, Wallet, Clock, CheckCircle2, 
  ChevronRight, Filter, Truck, ShieldCheck, Activity,
  Sparkles, Building, Receipt, ArrowUpRight, ArrowDownRight,
  X, Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip
} from 'recharts';
import { salesService } from '../services/sales.service';
import { purchaseService } from '../services/purchase.service';
import { itemService } from '../services/item.service';
import { useAuth } from '../App';

const Dashboard = () => {
  const navigate = useNavigate();
  const { settings, user } = useAuth();
  const [showAPDetails, setShowAPDetails] = useState(false);
  
  const sos = salesService?.getSalesOrders?.() || [];
  const activeSos = sos.filter(s => s.status !== 'Invoiced' && s.status !== 'Closed');
  const grossRevenue = sos.filter(s => s.status !== 'Draft').reduce((sum, s) => sum + (Number(s.total) || 0), 0);
  
  const itemsRes = itemService?.getItems?.({}, 1, 1000) || { data: [], total: 0 };
  const lowStockCount = itemService?.getLowStockItems?.()?.length || 0;
  
  const customers = salesService?.getCustomers?.() || [];
  const arTotal = customers.reduce((sum, c) => sum + (salesService.getCustomerBalance(c.id) || 0), 0);
  
  const vendors = purchaseService?.getVendors?.() || [];
  const openBills = purchaseService.getBills().filter(b => b.balanceDue > 0);
  const apTotal = vendors.reduce((sum, v) => sum + (purchaseService.getVendorBalance(v.id) || 0), 0);
  
  const pendingOrders = sos.filter(s => s.status === 'Confirmed' || s.status === 'Draft').slice(0, 5);

  // Recent Global Activity Feed
  const recentPayments = purchaseService.getPaymentsMade().slice(-3).reverse();
  const recentInvoices = salesService.getInvoices().slice(-2).reverse();

  const chartData = [
    { name: 'Mon', sales: 4200 },
    { name: 'Tue', sales: 3800 },
    { name: 'Wed', sales: 6100 },
    { name: 'Thu', sales: 5200 },
    { name: 'Fri', sales: 4800 },
    { name: 'Sat', sales: 2900 },
    { name: 'Sun', sales: 3400 },
  ];

  const StatCard = ({ label, value, trend, icon, colorClass, onClick, active }: any) => (
    <div 
      onClick={onClick}
      className={`bg-white p-6 rounded-[28px] border transition-all cursor-pointer group relative overflow-hidden ${active ? 'ring-2 ring-[#fbaf0f] border-[#fbaf0f] shadow-xl' : 'border-slate-200 shadow-sm hover:shadow-md'}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 text-slate-900 group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
          {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {trend === 'up' ? 'Growth' : 'Risk'}
        </div>
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
      {active && <div className="absolute top-2 right-2 w-2 h-2 bg-[#fbaf0f] rounded-full animate-ping"></div>}
    </div>
  );

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Dynamic Header Banner */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[40px] p-10 shadow-2xl border border-slate-800">
         <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-[#fbaf0f] rounded-full mix-blend-multiply filter blur-3xl opacity-5"></div>
         
         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center gap-8">
               <div className="bg-transparent flex items-center justify-center">
                  {settings.logoUrl ? (
                    <img src={settings.logoUrl} alt="Org Logo" className="h-24 w-auto object-contain brightness-110 drop-shadow-[0_10px_15px_rgba(0,0,0,0.3)]" />
                  ) : (
                    <div className="w-20 h-20 bg-[#fbaf0f] rounded-2xl flex items-center justify-center font-black text-3xl text-slate-900 shadow-xl">K</div>
                  )}
               </div>
               <div>
                  <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
                    System Health: <span className="text-[#fbaf0f]">Optimal</span> <Sparkles className="text-[#fbaf0f]" size={24} />
                  </h2>
                  <p className="text-slate-400 text-base font-medium mt-1">
                    Managing <span className="text-white font-bold">{settings.companyName}</span> Digital Ledger.
                  </p>
               </div>
            </div>
            <div className="flex items-center gap-4">
               <div className="px-6 py-4 bg-white/5 rounded-3xl border border-white/10 text-center min-w-[130px]">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Sales</p>
                  <p className="text-2xl font-black text-white">{activeSos.length}</p>
               </div>
               <div className="px-6 py-4 bg-white/5 rounded-3xl border border-white/10 text-center min-w-[130px]">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Open Bills</p>
                  <p className={`text-2xl font-black ${openBills.length > 0 ? 'text-rose-400' : 'text-[#fbaf0f]'}`}>{openBills.length}</p>
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        <StatCard label="Receivables (AR)" value={`AED ${arTotal.toLocaleString()}`} trend="up" icon={<Wallet size={20} />} colorClass="bg-blue-600" onClick={() => navigate('/sales/invoices')} />
        <StatCard 
          label="Payables (AP)" 
          value={`AED ${apTotal.toLocaleString()}`} 
          trend={apTotal > 0 ? "down" : "up"} 
          icon={<Truck size={20} />} 
          colorClass="bg-rose-600" 
          active={apTotal > 0}
          onClick={() => setShowAPDetails(true)} 
        />
        <StatCard label="Sales Revenue" value={`AED ${grossRevenue.toLocaleString()}`} trend="up" icon={<DollarSign size={20} />} colorClass="bg-[#fbaf0f]" onClick={() => navigate('/reports')} />
        <StatCard label="Stock Integrity" value={lowStockCount > 0 ? `${lowStockCount} Low` : 'Healthy'} trend={lowStockCount > 0 ? 'down' : 'up'} icon={<Package size={20} />} colorClass={lowStockCount > 0 ? 'bg-amber-600' : 'bg-emerald-600'} onClick={() => navigate('/inventory/dashboard')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Recent Activity Feed</h3>
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full text-[10px] font-bold text-slate-400">
                  <Clock size={12}/> Updated Just Now
                </div>
             </div>
             <div className="space-y-4">
                {recentPayments.map(p => (
                   <div key={p.id} className="flex items-center justify-between p-4 bg-rose-50/30 rounded-2xl border border-rose-100/50">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-rose-600 shadow-sm border border-rose-100">
                            <ArrowUpRight size={20}/>
                         </div>
                         <div>
                            <p className="text-sm font-bold text-slate-900">Vendor Disbursement</p>
                            <p className="text-[10px] text-slate-500 font-black uppercase">{p.paymentMode} • Ref: {p.reference || p.paymentNumber}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-sm font-black text-rose-600">- AED {p.amount.toLocaleString()}</p>
                         <p className="text-[10px] text-slate-400 font-bold">{new Date(p.date).toLocaleDateString()}</p>
                      </div>
                   </div>
                ))}
                {recentInvoices.map(inv => (
                   <div key={inv.id} className="flex items-center justify-between p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/50">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                            <ArrowDownRight size={20}/>
                         </div>
                         <div>
                            <p className="text-sm font-bold text-slate-900">Tax Invoice Issued</p>
                            <p className="text-[10px] text-slate-500 font-black uppercase">{inv.invoiceNumber}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-sm font-black text-emerald-600">+ AED {inv.total.toLocaleString()}</p>
                         <p className="text-[10px] text-slate-400 font-bold">{new Date(inv.date).toLocaleDateString()}</p>
                      </div>
                   </div>
                ))}
             </div>
          </div>

          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Fulfillment Queue</h3>
            <div className="space-y-3">
              {pendingOrders.map((order) => {
                const cust = salesService.getCustomerById(order.customerId);
                return (
                  <div key={order.id} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100 group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-[18px] flex items-center justify-center font-black text-slate-400 text-xs uppercase">SO</div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 group-hover:text-[#fbaf0f] transition-colors">{order.orderNumber}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{cust?.name || 'Client Unresolved'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <span className={`text-[9px] font-black px-2 py-1 rounded-lg border ${order.status === 'Confirmed' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{order.status.toUpperCase()}</span>
                       <button onClick={() => navigate(`/sales/orders/${order.id}`)} className="p-2 text-slate-300 group-hover:text-amber-500 transition-all"><ChevronRight size={20} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900 p-8 rounded-[32px] shadow-2xl text-white">
            <h3 className="text-xs font-black text-[#fbaf0f] uppercase tracking-widest mb-6 flex items-center gap-2">
              <Clock size={16} />
              Operational Shortcuts
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Sales Order', path: '/sales/orders/new' },
                { label: 'Record Bill', path: '/purchases/bills/new' },
                { label: 'Quick Receipt', path: '/sales/payments/new' },
                { label: 'EOM Audit', path: '/reports' }
              ].map(link => (
                <button key={link.label} onClick={() => navigate(link.path)} className="py-4 px-4 bg-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#fbaf0f] hover:text-slate-900 transition-all shadow-lg active:scale-95">
                  {link.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
             <div className="flex items-center gap-3 mb-6">
                <ShieldCheck size={20} className="text-brand" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Regulatory Status</h3>
             </div>
             <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                   <span className="text-xs text-slate-500 font-medium">TRN Validation</span>
                   <span className="text-[10px] font-black uppercase text-emerald-600 px-2 bg-emerald-50 rounded-full">Active</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                   <span className="text-xs text-slate-500 font-medium">VAT Period</span>
                   <span className="text-[10px] font-black uppercase text-blue-600 px-2 bg-blue-50 rounded-full">Current</span>
                </div>
                <button 
                  onClick={() => navigate('/sales/statements')}
                  className="w-full mt-4 py-3.5 bg-[#fbaf0f] text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-amber-100 hover:bg-brandDark transition-all active:scale-95"
                >
                  Generate EOM Statements
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* AP Drilldown Side Panel */}
      {showAPDetails && (
         <div className="fixed inset-0 z-[100] flex justify-end">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAPDetails(false)}></div>
            <div className="relative w-full max-w-md bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
               <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><Truck size={24}/></div>
                     <div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Payables Ledger</h3>
                        <p className="text-xs text-slate-500 font-medium">Open Vendor Liabilities</p>
                     </div>
                  </div>
                  <button onClick={() => setShowAPDetails(false)} className="p-2.5 text-slate-400 hover:text-rose-500 transition-colors bg-white rounded-xl shadow-sm"><X size={20} /></button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-8 space-y-6">
                  {openBills.length > 0 ? openBills.map(bill => {
                     const vendor = purchaseService.getVendorById(bill.vendorId);
                     return (
                        <div key={bill.id} className="p-6 border border-slate-100 rounded-[28px] hover:border-rose-200 transition-all bg-white shadow-sm group">
                           <div className="flex justify-between items-start mb-4">
                              <div>
                                 <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Bill No: {bill.billNumber}</p>
                                 <p className="text-sm font-bold text-slate-900 mt-1">{vendor?.name}</p>
                              </div>
                              <span className="px-2 py-1 bg-amber-50 text-amber-700 text-[9px] font-black uppercase rounded-lg">Due: {new Date(bill.dueDate).toLocaleDateString()}</span>
                           </div>
                           <div className="flex justify-between items-end">
                              <div>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase">Balance Due</p>
                                 <p className="text-xl font-black text-slate-900">AED {bill.balanceDue.toLocaleString()}</p>
                              </div>
                              <button 
                                onClick={() => { setShowAPDetails(false); navigate(`/purchases/payments/new?billId=${bill.id}&vendorId=${bill.vendorId}`); }}
                                className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-[#fbaf0f] hover:text-slate-900 transition-all"
                              >
                                 <ArrowUpRight size={18} />
                              </button>
                           </div>
                        </div>
                     );
                  }) : (
                     <div className="text-center py-20">
                        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                           <CheckCircle2 size={40}/>
                        </div>
                        <h4 className="text-lg font-black text-slate-900">Ledger Balanced</h4>
                        <p className="text-sm text-slate-500 mt-2">All vendor bills have been fully paid.</p>
                     </div>
                  )}
               </div>
               
               <div className="p-8 bg-slate-50 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-6">
                     <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Total Liability</p>
                     <p className="text-2xl font-black text-rose-600">AED {apTotal.toLocaleString()}</p>
                  </div>
                  <button 
                    onClick={() => { setShowAPDetails(false); navigate('/purchases/payments/new'); }}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-slate-800 transition-all active:scale-95"
                  >
                     New General Disbursement
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default Dashboard;
