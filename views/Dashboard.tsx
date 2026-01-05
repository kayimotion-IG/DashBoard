
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Package, 
  BarChart3, Truck, ShieldCheck, Activity,
  ArrowUpRight, ArrowDownRight,
  ShoppingCart, Boxes, Receipt, ArrowRight, HandCoins,
  Clock, FileText, Loader2, Handshake, Pin, MailCheck, Globe,
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { salesService } from '../services/sales.service';
import { purchaseService } from '../services/purchase.service';
import { itemService } from '../services/item.service';
import { apiRequest } from '../services/api';
import { useAuth } from '../App';

const Dashboard = () => {
  const navigate = useNavigate();
  const { settings } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  const calculateStats = async () => {
    await Promise.all([
      salesService.refresh(),
      purchaseService.refresh(),
      itemService.refresh()
    ]);

    const sos = salesService.getSalesOrders();
    const invs = salesService.getInvoices();
    const receipts = salesService.getPaymentsReceived();
    const customers = salesService.getCustomers();
    const vendors = purchaseService.getVendors();
    const disbursements = purchaseService.getPaymentsMade();
    
    // Fetch last communication
    const comms = await apiRequest('GET', '/api/communications');
    const lastComm = (comms && Array.isArray(comms) && comms.length > 0) ? comms[0] : null;

    const grossRevenue = invs.filter(i => i.status !== 'Voided').reduce((sum, i) => sum + (Number(i.total) || 0), 0);
    
    const totalCost = invs.filter(i => i.status !== 'Voided').reduce((sum, i) => {
      return sum + salesService.calculateLineCost(i.lines || []);
    }, 0);

    const grossProfit = grossRevenue - totalCost;

    const arTotal = customers.reduce((sum, c) => sum + (salesService.getCustomerBalance(c.id) || 0), 0);
    const apTotal = vendors.reduce((sum, v) => sum + (purchaseService.getVendorBalance(v.id) || 0), 0);
    const inventoryValue = itemService.calculateInventoryValue();
    const lowStockCount = itemService.getLowStockItems().length;

    const stream = [
      ...invs.map(i => ({ type: 'INV', date: i.date, amount: i.total, ref: i.invoiceNumber, label: 'Sales Invoice', entity: salesService.getCustomerById(i.customerId)?.name || 'Client' })),
      ...receipts.map(r => ({ type: 'REC', date: r.date, amount: r.amount, ref: r.paymentNumber, label: 'Payment Received', entity: salesService.getCustomerById(r.customerId)?.name || 'Client' })),
      ...disbursements.map(d => ({ type: 'DISB', date: d.date, amount: d.amount, ref: d.paymentNumber, label: 'Vendor Payment', entity: purchaseService.getVendorById(d.vendorId)?.name || 'Supplier' }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);

    const pinnedInvoices = invs.filter(i => i.isPinned).slice(0, 3);

    setDashboardData({
      grossRevenue,
      grossProfit,
      arTotal,
      apTotal,
      inventoryValue,
      lowStockCount,
      pinnedInvoices,
      lastComm,
      financialStream: stream
    });
    setLoading(false);
  };

  useEffect(() => {
    calculateStats();
  }, []);

  const StatCard = ({ label, value, subtext, trend, icon, colorClass, onClick }: any) => (
    <div 
      onClick={onClick}
      className="bg-white p-6 rounded-[32px] border border-slate-200 transition-all cursor-pointer group hover:shadow-2xl hover:border-brand/30 relative overflow-hidden"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl ${colorClass} bg-opacity-10 text-slate-900 group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
          {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {trend === 'up' ? 'Growth' : 'Liability'}
        </div>
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-2xl font-black text-slate-900 tracking-tight">
        {loading ? <div className="h-8 w-24 bg-slate-100 animate-pulse rounded-lg"></div> : value}
      </h3>
      <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">{subtext}</p>
    </div>
  );

  if (loading && !dashboardData) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-brand" size={40} />
        <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Hydrating Enterprise Ledger...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500 text-slate-900">
      <div className="relative overflow-hidden bg-slate-900 rounded-[48px] p-10 shadow-2xl border border-white/5">
         <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] bg-brand rounded-full mix-blend-screen filter blur-[120px] opacity-10 animate-pulse"></div>
         <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
            <div className="flex items-center gap-8">
               <div className="w-24 h-24 bg-brand rounded-[32px] flex items-center justify-center font-black text-4xl text-slate-900 shadow-[0_20px_50px_rgba(251,175,15,0.3)]">K</div>
               <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-4xl font-black text-white tracking-tight">KlenCare Enterprise</h2>
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/30 flex items-center gap-1">
                      <ShieldCheck size={12}/> Vault Persistent
                    </span>
                  </div>
                  <p className="text-slate-400 text-lg font-medium mt-2">
                    Entity: <span className="text-brand font-bold">{settings.companyName}</span>
                  </p>
               </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
               <div className="px-8 py-5 bg-white/5 rounded-[28px] border border-white/10 backdrop-blur-md text-right">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Asset Valuation</p>
                  <p className="text-2xl font-black text-white">AED {dashboardData.inventoryValue.toLocaleString()}</p>
               </div>
               <div className="px-8 py-5 bg-brand rounded-[28px] shadow-xl shadow-amber-500/20 text-right">
                  <p className="text-[9px] font-black text-slate-900/60 uppercase tracking-[0.2em] mb-1">Total Receivables</p>
                  <p className="text-2xl font-black text-slate-900">AED {dashboardData.arTotal.toLocaleString()}</p>
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Gross Revenue" 
          value={`AED ${dashboardData.grossRevenue.toLocaleString()}`} 
          subtext="Total Billables"
          trend="up" 
          icon={<BarChart3 size={22} />} 
          colorClass="bg-blue-600" 
          onClick={() => navigate('/reports')} 
        />
        <StatCard 
          label="Gross Profit" 
          value={`AED ${dashboardData.grossProfit.toLocaleString()}`} 
          subtext="Revenue - Cost Basis"
          trend="up" 
          icon={<Handshake size={22} />} 
          colorClass="bg-emerald-600" 
          onClick={() => navigate('/reports')} 
        />
        <StatCard 
          label="Accounts Payable" 
          value={`AED ${dashboardData.apTotal.toLocaleString()}`} 
          subtext="Liability to Vendors"
          trend="down" 
          icon={<Truck size={22} />} 
          colorClass="bg-rose-600" 
          onClick={() => navigate('/purchases/bills')} 
        />
        <StatCard 
          label="Inventory Health" 
          value={dashboardData.lowStockCount === 0 ? 'Optimal' : `${dashboardData.lowStockCount} Low Stock`} 
          subtext="Asset Control"
          trend={dashboardData.lowStockCount > 0 ? 'down' : 'up'} 
          icon={<Boxes size={22} />} 
          colorClass={dashboardData.lowStockCount > 0 ? 'bg-rose-600' : 'bg-emerald-600'} 
          onClick={() => navigate('/inventory/dashboard')} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {dashboardData.pinnedInvoices?.length > 0 && (
                <div className="bg-amber-50/50 border border-amber-200/50 rounded-[40px] p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-brand rounded-xl text-slate-900 shadow-lg shadow-amber-500/20"><Pin size={18} fill="currentColor" /></div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Priority Focus</h3>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {dashboardData.pinnedInvoices.map((inv: any) => (
                      <div 
                        key={inv.id} 
                        onClick={() => navigate(`/sales/invoices/view/${inv.id}`)}
                        className="bg-white p-4 rounded-2xl border border-amber-200/50 shadow-sm hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
                      >
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{inv.invoiceNumber}</p>
                          <p className="text-xs font-black text-slate-900 truncate">{salesService.getCustomerById(inv.customerId)?.name}</p>
                        </div>
                        <p className="text-sm font-black text-brand">AED {inv.total.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
             )}

             <div className="bg-blue-50/50 border border-blue-200/50 rounded-[40px] p-8 space-y-6">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/20"><MailCheck size={18} /></div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Communication Relay</h3>
                   </div>
                   <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase border border-emerald-100">
                      <Globe size={10}/> Relay Ready
                   </div>
                </div>
                
                {dashboardData.lastComm ? (
                   <div className="bg-white p-5 rounded-3xl border border-blue-100 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Outbound Message</p>
                      <p className="text-sm font-bold text-slate-800 truncate">{dashboardData.lastComm.subject}</p>
                      <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <CheckCircle2 size={12} className="text-emerald-500"/>
                            <span className="text-[10px] font-black text-slate-500 uppercase">Status: Gone</span>
                         </div>
                         <span className="text-[9px] font-bold text-slate-300 uppercase">{new Date(dashboardData.lastComm.timestamp).toLocaleTimeString()}</span>
                      </div>
                   </div>
                ) : (
                   <div className="text-center py-6 text-slate-400 italic text-xs">No recent dispatches detected.</div>
                )}
                
                <button onClick={() => navigate('/operations/communications')} className="w-full py-3 bg-white border border-blue-200 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">Audit Communications</button>
             </div>
          </div>

          <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm">
             <div className="flex items-center justify-between mb-10">
                <div>
                   <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Transaction Stream</h3>
                   <p className="text-xs text-slate-400 font-medium mt-1">Real-time ledger movements.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">
                  <Activity size={12} className="text-brand animate-pulse"/> Ledger Active
                </div>
             </div>
             
             <div className="space-y-4">
                {dashboardData.financialStream.map((txn: any, idx: number) => {
                  const isIn = txn.type === 'INV' || txn.type === 'REC';
                  return (
                    <div key={idx} className={`flex items-center justify-between p-5 rounded-[24px] border transition-all ${isIn ? 'bg-emerald-50/30 border-emerald-100/50' : 'bg-rose-50/30 border-rose-100/50'}`}>
                      <div className="flex items-center gap-5">
                         <div className={`w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border ${isIn ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isIn ? <ArrowDownRight size={24}/> : <ArrowUpRight size={24}/>}
                         </div>
                         <div>
                            <p className="text-sm font-black text-slate-900">{txn.label}: {txn.ref}</p>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{txn.entity}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className={`text-base font-black ${isIn ? 'text-emerald-600' : 'text-rose-600'}`}>
                           {isIn ? '+' : '-'} AED {Number(txn.amount).toLocaleString()}
                         </p>
                         <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(txn.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  );
                })}
                {dashboardData.financialStream.length === 0 && (
                   <div className="py-20 text-center text-slate-300 italic font-medium">No recent transactions detected.</div>
                )}
             </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900 p-10 rounded-[40px] shadow-2xl text-white">
            <h3 className="text-xs font-black text-brand uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
              <Clock size={16} /> Rapid Entry
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => navigate('/sales/orders/new')} className="flex flex-col items-center gap-3 py-6 bg-white/5 rounded-[24px] text-[10px] font-black uppercase tracking-widest border border-white/10 hover:bg-brand hover:text-slate-900 transition-all">
                <ShoppingCart size={18}/> Sales
              </button>
              <button onClick={() => navigate('/items/new')} className="flex flex-col items-center gap-3 py-6 bg-white/5 rounded-[24px] text-[10px] font-black uppercase tracking-widest border border-white/10 hover:bg-blue-600 transition-all">
                <Package size={18}/> Add Item
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
