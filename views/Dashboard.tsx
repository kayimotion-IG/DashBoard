
import React from 'react';
import { 
  TrendingUp, TrendingDown, Package, 
  DollarSign, Wallet, Clock, CheckCircle2, 
  ChevronRight, Filter, Truck, ShieldCheck, Activity,
  Sparkles, Building
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
  
  const sos = salesService?.getSalesOrders?.() || [];
  const confirmedSos = sos.filter(s => s.status !== 'Draft');
  const grossRevenue = confirmedSos.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
  
  const itemsRes = itemService?.getItems?.({}, 1, 1000) || { data: [], total: 0 };
  const items = itemsRes.data || [];
  const lowStockCount = itemService?.getLowStockItems?.(items)?.length || 0;
  
  const customers = salesService?.getCustomers?.() || [];
  const arTotal = customers.reduce((sum, c) => sum + (salesService.getCustomerBalance(c.id) || 0), 0);
  
  const vendors = purchaseService?.getVendors?.() || [];
  const apTotal = vendors.reduce((sum, v) => sum + (purchaseService.getVendorBalance(v.id) || 0), 0);
  
  const pendingOrders = sos.filter(s => s.status === 'Confirmed' || s.status === 'Draft').slice(0, 5);

  const chartData = [
    { name: 'Mon', sales: 4200 },
    { name: 'Tue', sales: 3800 },
    { name: 'Wed', sales: 6100 },
    { name: 'Thu', sales: 5200 },
    { name: 'Fri', sales: 4800 },
    { name: 'Sat', sales: 2900 },
    { name: 'Sun', sales: 3400 },
  ];

  const StatCard = ({ label, value, trend, icon, colorClass, onClick }: any) => (
    <div 
      onClick={onClick}
      className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
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
    </div>
  );

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Personalized Welcome Banner - Logo floats with native transparency */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[32px] p-10 shadow-2xl border border-slate-800">
         <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-[#fbaf0f] rounded-full mix-blend-multiply filter blur-3xl opacity-5"></div>
         <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-5"></div>
         
         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center gap-8">
               <div className="bg-transparent flex items-center justify-center">
                  {settings.logoUrl ? (
                    <img 
                      src={settings.logoUrl} 
                      alt="Org Logo" 
                      className="h-24 w-auto object-contain brightness-110 drop-shadow-[0_10px_15px_rgba(0,0,0,0.3)]" 
                    />
                  ) : (
                    <div className="w-20 h-20 bg-[#fbaf0f] rounded-xl flex items-center justify-center font-black text-3xl text-slate-900 shadow-xl">K</div>
                  )}
               </div>
               <div>
                  <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
                    Welcome back, {user?.name.split(' ')[0]} <Sparkles className="text-[#fbaf0f]" size={24} />
                  </h2>
                  <p className="text-slate-400 text-base font-medium mt-1">
                    System operations for <span className="text-white font-bold">{settings.companyName}</span> are stable.
                  </p>
               </div>
            </div>
            <div className="flex items-center gap-4">
               <div className="px-6 py-4 bg-white/5 rounded-3xl border border-white/10 text-center min-w-[120px]">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Orders</p>
                  <p className="text-2xl font-black text-white">{sos.length}</p>
               </div>
               <div className="px-6 py-4 bg-white/5 rounded-3xl border border-white/10 text-center min-w-[120px]">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">In Stock</p>
                  <p className="text-2xl font-black text-[#fbaf0f]">{items.length}</p>
               </div>
            </div>
         </div>
      </div>

      <div className="flex items-center justify-between mt-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Enterprise Overview</h1>
          <p className="text-slate-500 text-sm">Real-time ledger data for the UAE region.</p>
        </div>
        <div className="flex items-center gap-3">
           <button 
            onClick={() => navigate('/health')}
            className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-[#fbaf0f] rounded-xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
          >
            <Activity size={16} /> Diagnostic Hub
          </button>
          <button className="bg-white border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition-all">
            <Filter size={16} />
            Period Analysis
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Receivables (AR)" value={`AED ${arTotal.toLocaleString()}`} trend="up" icon={<Wallet size={20} />} colorClass="bg-blue-600" onClick={() => navigate('/sales/invoices')} />
        <StatCard label="Payables (AP)" value={`AED ${apTotal.toLocaleString()}`} trend="down" icon={<Truck size={20} />} colorClass="bg-rose-600" onClick={() => navigate('/purchases/bills')} />
        <StatCard label="Sales Revenue" value={`AED ${grossRevenue.toLocaleString()}`} trend="up" icon={<DollarSign size={20} />} colorClass="bg-[#fbaf0f]" onClick={() => navigate('/reports')} />
        <StatCard label="Stock Integrity" value={lowStockCount > 0 ? `${lowStockCount} Low` : 'Healthy'} trend={lowStockCount > 0 ? 'down' : 'up'} icon={<Package size={20} />} colorClass={lowStockCount > 0 ? 'bg-amber-600' : 'bg-emerald-600'} onClick={() => navigate('/inventory/dashboard')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8">Performance Curve (7-Day)</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fbaf0f" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#fbaf0f" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="sales" stroke="#fbaf0f" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Execution Queue</h3>
            <div className="space-y-4">
              {pendingOrders.length > 0 ? pendingOrders.map((order) => {
                const cust = salesService.getCustomerById(order.customerId);
                return (
                  <div key={order.id} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100 group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 text-xs uppercase">SO</div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 group-hover:text-[#fbaf0f] transition-colors">{order.orderNumber}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{cust?.name || 'Client Unresolved'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <span className="text-[10px] font-black text-amber-600 px-2 py-1 bg-amber-50 rounded-lg border border-amber-100">{order.status}</span>
                       <button onClick={() => navigate(`/sales/orders/${order.id}`)} className="p-2 text-slate-300 group-hover:text-amber-500 transition-all"><ChevronRight size={20} /></button>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-10 text-slate-400">
                  <CheckCircle2 size={40} className="mx-auto mb-4 opacity-20 text-emerald-500" />
                  <p className="text-xs font-bold uppercase tracking-widest">Workflow Cleared</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl text-white">
            <h3 className="text-xs font-black text-[#fbaf0f] uppercase tracking-widest mb-6 flex items-center gap-2">
              <Clock size={16} />
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Issue SO', path: '/sales/orders/new' },
                { label: 'Create PO', path: '/purchases/orders/new' },
                { label: 'Inventory', path: '/inventory/dashboard' },
                { label: 'Financials', path: '/reports' }
              ].map(link => (
                <button key={link.label} onClick={() => navigate(link.path)} className="py-3 px-4 bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#fbaf0f] hover:text-slate-900 transition-all">
                  {link.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
             <div className="flex items-center gap-3 mb-6">
                <ShieldCheck size={20} className="text-brand" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Compliance Status</h3>
             </div>
             <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                   <span className="text-xs text-slate-500 font-medium">Monthly Returns</span>
                   <span className="text-[10px] font-black uppercase text-emerald-600 px-2 bg-emerald-50 rounded-full">Ready</span>
                </div>
                <button 
                  onClick={() => navigate('/sales/statements')}
                  className="w-full mt-4 py-3 bg-[#fbaf0f] text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-100 hover:bg-brandDark transition-all active:scale-95"
                >
                  Generate EOM Statements
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
