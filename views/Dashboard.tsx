
import React from 'react';
import { 
  TrendingUp, TrendingDown, Users, Package, ShoppingCart, 
  DollarSign, Wallet, AlertTriangle, Clock, CheckCircle2, 
  ChevronRight, Filter, Truck, ShieldCheck, Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip
} from 'recharts';
import { salesService } from '../services/sales.service';
import { purchaseService } from '../services/purchase.service';
import { itemService } from '../services/item.service';

const Dashboard = () => {
  const navigate = useNavigate();
  
  const sos = salesService.getSalesOrders();
  const totalRevenue = sos.reduce((sum, s) => sum + s.total, 0);
  const lowStockCount = itemService.getLowStockItems().length;
  
  const customers = salesService.getCustomers();
  const arTotal = customers.reduce((sum, c) => sum + salesService.getCustomerBalance(c.id), 0);
  
  const vendors = purchaseService.getVendors();
  const apTotal = vendors.reduce((sum, v) => sum + purchaseService.getVendorBalance(v.id), 0);
  
  const pendingOrders = sos.filter(s => s.status === 'Confirmed' || s.status === 'Draft');

  const chartData = [
    { name: 'Mon', sales: 4000 },
    { name: 'Tue', sales: 3000 },
    { name: 'Wed', sales: 5000 },
    { name: 'Thu', sales: 2780 },
    { name: 'Fri', sales: 1890 },
    { name: 'Sat', sales: 2390 },
    { name: 'Sun', sales: 3490 },
  ];

  const StatCard = ({ label, value, trend, icon, color, onClick }: any) => (
    <div 
      onClick={onClick}
      className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600 group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
          {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {trend === 'up' ? 'Healthy' : 'Action'}
        </div>
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-2xl font-black text-slate-900">{value}</h3>
    </div>
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Executive Summary</h1>
          <p className="text-slate-500 text-sm">Real-time financials and inventory health in AED.</p>
        </div>
        <div className="flex items-center gap-3">
           <button 
            onClick={() => navigate('/health')}
            className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
          >
            <Activity size={16} /> Run System Test
          </button>
          <button className="bg-white border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition-all">
            <Filter size={16} />
            YTD Period
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Receivables (AR)" value={`AED ${arTotal.toLocaleString()}`} trend="up" icon={<Wallet size={20} />} color="bg-blue-600" onClick={() => navigate('/sales/invoices')} />
        <StatCard label="Payables (AP)" value={`AED ${apTotal.toLocaleString()}`} trend="down" icon={<Truck size={20} />} color="bg-rose-600" onClick={() => navigate('/purchases/bills')} />
        <StatCard label="Gross Revenue" value={`AED ${totalRevenue.toLocaleString()}`} trend="up" icon={<DollarSign size={20} />} color="bg-emerald-600" onClick={() => navigate('/reports')} />
        <StatCard label="Inventory Status" value={lowStockCount > 0 ? `${lowStockCount} Low` : 'Optimal'} trend={lowStockCount > 0 ? 'down' : 'up'} icon={<Package size={20} />} color={lowStockCount > 0 ? 'bg-amber-600' : 'bg-indigo-600'} onClick={() => navigate('/inventory/dashboard')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8">Cash Flow Analysis (AED)</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Action Required</h3>
            <div className="space-y-4">
              {pendingOrders.length > 0 ? pendingOrders.slice(0, 3).map((order) => {
                const cust = salesService.getCustomerById(order.customerId);
                return (
                  <div key={order.id} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100 group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 text-xs">SO</div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{order.orderNumber}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{cust?.name}</p>
                      </div>
                    </div>
                    <button onClick={() => navigate(`/sales/orders/${order.id}`)} className="p-2 text-slate-300 group-hover:text-blue-600 transition-all"><ChevronRight size={20} /></button>
                  </div>
                );
              }) : (
                <div className="text-center py-10 text-slate-400">
                  <CheckCircle2 size={40} className="mx-auto mb-4 opacity-20" />
                  <p className="text-xs font-bold uppercase">All systems nominal</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl text-white">
            <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Clock size={16} />
              Module Shortcuts
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'New SO', path: '/sales/orders/new' },
                { label: 'New PO', path: '/purchases/orders/new' },
                { label: 'Stock Adj', path: '/inventory/adjustments' },
                { label: 'Reports', path: '/reports' }
              ].map(link => (
                <button key={link.label} onClick={() => navigate(link.path)} className="py-3 px-4 bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all">
                  {link.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
             <div className="flex items-center gap-3 mb-4">
                <ShieldCheck size={20} className="text-emerald-500" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">System Health</h3>
             </div>
             <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                   <span className="text-xs text-slate-500">Inventory Sync</span>
                   <span className="text-[10px] font-black uppercase text-emerald-600 px-2 bg-emerald-50 rounded-full">Active</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                   <span className="text-xs text-slate-500">Financial Ledger</span>
                   <span className="text-[10px] font-black uppercase text-emerald-600 px-2 bg-emerald-50 rounded-full">Locked</span>
                </div>
                <button 
                  onClick={() => navigate('/health')}
                  className="w-full mt-2 py-3 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                >
                  Diagnostic Logs
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
