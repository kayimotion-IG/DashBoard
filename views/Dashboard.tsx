
import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Package, 
  DollarSign, Wallet, Clock, CheckCircle2, 
  ChevronRight, Filter, Truck, ShieldCheck, Activity,
  Building, Receipt, ArrowUpRight, ArrowDownRight,
  X, Info, UserCheck, Boxes, FileText, ShoppingCart, PackageCheck,
  BarChart3, Layers, AlertCircle, ArrowRight, HandCoins
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { salesService } from '../services/sales.service';
import { purchaseService } from '../services/purchase.service';
import { itemService } from '../services/item.service';
import { useAuth } from '../App';

const Dashboard = () => {
  const navigate = useNavigate();
  const { settings, user } = useAuth();
  
  const stats = useMemo(() => {
    const sos = salesService.getSalesOrders();
    const invs = salesService.getInvoices();
    const receipts = salesService.getPaymentsReceived();
    const bills = purchaseService.getBills();
    const customers = salesService.getCustomers();
    const vendors = purchaseService.getVendors();
    const disbursements = purchaseService.getPaymentsMade();

    // Core Metrics
    const activeSos = sos.filter(s => s.status !== 'Invoiced' && s.status !== 'Closed');
    const grossRevenue = invs.filter(i => i.status !== 'Voided').reduce((sum, i) => sum + (Number(i.total) || 0), 0);
    const arTotal = customers.reduce((sum, c) => sum + (salesService.getCustomerBalance(c.id) || 0), 0);
    const apTotal = vendors.reduce((sum, v) => sum + (purchaseService.getVendorBalance(v.id) || 0), 0);
    const inventoryValue = itemService.calculateInventoryValue();
    const lowStockCount = itemService.getLowStockItems().length;

    // Create a unified stream of recent financial activity
    const stream = [
      ...invs.map(i => ({ type: 'INV', date: i.date, amount: i.total, ref: i.invoiceNumber, label: 'Sales Invoice', customer: salesService.getCustomerById(i.customerId)?.name || 'Client' })),
      ...receipts.map(r => ({ type: 'REC', date: r.date, amount: r.amount, ref: r.paymentNumber, label: 'Payment Received', customer: salesService.getCustomerById(r.customerId)?.name || 'Client' })),
      ...disbursements.map(d => ({ type: 'DISB', date: d.date, amount: d.amount, ref: d.paymentNumber, label: 'Vendor Payment', customer: purchaseService.getVendorById(d.vendorId)?.name || 'Supplier' }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);

    return {
      activeSos,
      grossRevenue,
      arTotal,
      apTotal,
      inventoryValue,
      lowStockCount,
      financialStream: stream,
      pendingOrders: sos.filter(s => s.status === 'Confirmed' || s.status === 'Draft').slice(0, 4)
    };
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
      <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
      <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">{subtext}</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500 text-slate-900">
      {/* 1. PREMIUM HERO CONSOLE */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[48px] p-10 shadow-2xl border border-white/5">
         <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] bg-brand rounded-full mix-blend-screen filter blur-[120px] opacity-10 animate-pulse"></div>
         <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
            <div className="flex items-center gap-8">
               <div className="w-24 h-24 bg-brand rounded-[32px] flex items-center justify-center font-black text-4xl text-slate-900 shadow-[0_20px_50px_rgba(251,175,15,0.3)] transition-transform hover:rotate-3">K</div>
               <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-4xl font-black text-white tracking-tight">KlenCare Enterprise</h2>
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/30 flex items-center gap-1">
                      <ShieldCheck size={12}/> Logic Persistent
                    </span>
                  </div>
                  <p className="text-slate-400 text-lg font-medium mt-2">
                    Managed Entity: <span className="text-brand font-bold">{settings.companyName}</span>
                  </p>
               </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
               <div className="px-8 py-5 bg-white/5 rounded-[28px] border border-white/10 backdrop-blur-md">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Asset Valuation</p>
                  <p className="text-2xl font-black text-white">AED {stats.inventoryValue.toLocaleString()}</p>
               </div>
               <div className="px-8 py-5 bg-brand rounded-[28px] shadow-xl shadow-amber-500/20">
                  <p className="text-[9px] font-black text-slate-900/60 uppercase tracking-[0.2em] mb-1">Accounts Receivable</p>
                  <p className="text-2xl font-black text-slate-900">AED {stats.arTotal.toLocaleString()}</p>
               </div>
            </div>
         </div>
      </div>

      {/* 2. CORE PERFORMANCE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Gross Revenue" 
          value={`AED ${stats.grossRevenue.toLocaleString()}`} 
          subtext="Total Tax Invoices"
          trend="up" 
          icon={<BarChart3 size={22} />} 
          colorClass="bg-blue-600" 
          onClick={() => navigate('/reports')} 
        />
        <StatCard 
          label="Accounts Payable" 
          value={`AED ${stats.apTotal.toLocaleString()}`} 
          subtext="Total Unpaid Bills"
          trend="down" 
          icon={<Truck size={22} />} 
          colorClass="bg-rose-600" 
          onClick={() => navigate('/purchases/bills')} 
        />
        <StatCard 
          label="Orders In Pipeline" 
          value={stats.activeSos.length} 
          subtext="Awaiting Shipment"
          trend="up" 
          icon={<ShoppingCart size={22} />} 
          colorClass="bg-amber-600" 
          onClick={() => navigate('/sales/orders')} 
        />
        <StatCard 
          label="Inventory Health" 
          value={stats.lowStockCount === 0 ? 'Healthy' : `${stats.lowStockCount} Critical`} 
          subtext="Below Reorder Points"
          trend={stats.lowStockCount > 0 ? 'down' : 'up'} 
          icon={<Boxes size={22} />} 
          colorClass={stats.lowStockCount > 0 ? 'bg-rose-600' : 'bg-emerald-600'} 
          onClick={() => navigate('/inventory/dashboard')} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {/* CONSOLIDATED LEDGER STREAM */}
          <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden">
             <div className="flex items-center justify-between mb-10">
                <div>
                   <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Financial Transaction Stream</h3>
                   <p className="text-xs text-slate-400 font-medium mt-1">Live audit trail of all AR/AP movements.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">
                  <Activity size={12} className="text-brand animate-pulse"/> Engine Live
                </div>
             </div>
             
             <div className="space-y-4">
                {stats.financialStream.map((txn, idx) => {
                  const isIn = txn.type === 'INV' || txn.type === 'REC';
                  return (
                    <div key={idx} className={`group flex items-center justify-between p-5 rounded-[24px] border transition-all ${isIn ? 'bg-emerald-50/30 border-emerald-100/50 hover:bg-emerald-50' : 'bg-rose-50/30 border-rose-100/50 hover:bg-rose-50'}`}>
                      <div className="flex items-center gap-5">
                         <div className={`w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border group-hover:scale-110 transition-transform ${isIn ? 'text-emerald-600 border-emerald-100' : 'text-rose-600 border-rose-100'}`}>
                            {isIn ? <ArrowDownRight size={24}/> : <ArrowUpRight size={24}/>}
                         </div>
                         <div>
                            <p className="text-sm font-black text-slate-900">{txn.label}: {txn.ref}</p>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{txn.customer}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className={`text-base font-black ${isIn ? 'text-emerald-600' : 'text-rose-600'}`}>
                           {isIn ? '+' : '-'} AED {Number(txn.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                         </p>
                         <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(txn.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  );
                })}
                
                {stats.financialStream.length === 0 && (
                   <div className="py-20 text-center text-slate-400 italic font-medium">System initialized. Awaiting transactions...</div>
                )}
             </div>
          </div>

          {/* FULFILLMENT QUEUE */}
          <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Fulfillment Queue</h3>
               <button onClick={() => navigate('/sales/orders')} className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">View All <ArrowRight size={14}/></button>
            </div>
            
            <div className="space-y-3">
              {stats.pendingOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-5 hover:bg-slate-50 rounded-[24px] transition-all border border-transparent hover:border-slate-100 group cursor-pointer" onClick={() => navigate(`/sales/orders/${order.id}`)}>
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400 text-xs uppercase group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">SO</div>
                    <div>
                      <p className="text-sm font-black text-slate-900">{order.orderNumber}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{salesService.getCustomerById(order.customerId)?.name || 'Client'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                     <span className={`text-[9px] font-black px-3 py-1.5 rounded-xl border ${order.status === 'Confirmed' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{order.status.toUpperCase()}</span>
                     <button className="p-3 text-slate-300 group-hover:text-brand transition-all"><ChevronRight size={24} /></button>
                  </div>
                </div>
              ))}
              {stats.pendingOrders.length === 0 && (
                 <div className="py-12 bg-slate-50 rounded-[32px] border border-dashed border-slate-200 text-center text-slate-400 text-sm italic">No pending orders.</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* RAPID ACTION SIDEBAR */}
          <div className="bg-slate-900 p-10 rounded-[40px] shadow-2xl text-white">
            <h3 className="text-xs font-black text-brand uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
              <Clock size={16} /> Rapid Deployment
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => navigate('/sales/orders/new')} className="flex flex-col items-center gap-3 py-6 bg-white/5 rounded-[24px] text-[10px] font-black uppercase tracking-widest border border-white/10 hover:bg-blue-600 transition-all">
                <ShoppingCart size={18}/> Orders
              </button>
              <button onClick={() => navigate('/sales/invoices/new')} className="flex flex-col items-center gap-3 py-6 bg-white/5 rounded-[24px] text-[10px] font-black uppercase tracking-widest border border-white/10 hover:bg-indigo-600 transition-all">
                <Receipt size={18}/> Invoice
              </button>
              <button onClick={() => navigate('/sales/statements')} className="flex flex-col items-center gap-3 py-6 bg-white/5 rounded-[24px] text-[10px] font-black uppercase tracking-widest border border-white/10 hover:bg-amber-600 transition-all">
                <FileText size={18}/> Statements
              </button>
              <button onClick={() => navigate('/purchases/payments/new')} className="flex flex-col items-center gap-3 py-6 bg-white/5 rounded-[24px] text-[10px] font-black uppercase tracking-widest border border-white/10 hover:bg-rose-600 transition-all">
                <HandCoins size={18}/> Record Pay
              </button>
            </div>
          </div>

          {/* STOCK STATUS WIDGET */}
          <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                   <AlertCircle size={24} />
                </div>
                <div>
                   <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Inventory Status</h3>
                   <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Stock Criticality</p>
                </div>
             </div>
             <div className="space-y-4">
                <div className="flex justify-between items-end mb-2">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Storage Capacity</p>
                   <p className="text-xs font-black text-slate-900">72%</p>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                   <div className="h-full bg-brand w-[72%] rounded-full shadow-[0_0_10px_rgba(251,175,15,0.4)]"></div>
                </div>
                <button 
                  onClick={() => navigate('/inventory/dashboard')}
                  className="w-full mt-4 py-4 bg-slate-900 text-white rounded-[20px] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all"
                >
                  Manage Stock
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
