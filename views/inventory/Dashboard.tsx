
import React from 'react';
import { 
  Package, TrendingUp, AlertTriangle, DollarSign, 
  ArrowRight, Box, History
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { itemService } from '../../services/item.service';

const Dashboard = () => {
  const navigate = useNavigate();
  const lowStock = itemService.getLowStockItems();
  const stockValue = itemService.calculateInventoryValue();
  const totalStock = itemService.getItems({}).total;
  const recentMoves = itemService.getStockMoves().slice(0, 10).reverse();

  const pieData = [
    { name: 'In Stock', value: totalStock - lowStock.length },
    { name: 'Low Stock', value: lowStock.length },
  ];
  const COLORS = ['#10b981', '#ef4444'];

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Overview</h1>
          <p className="text-slate-500 text-sm">Real-time valuation and stock performance metrics.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/inventory/adjustments')} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-bold text-sm">Stock Adjustments</button>
          <button onClick={() => navigate('/inventory/assemblies')} className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-sm shadow-lg shadow-blue-500/20">Manage Assemblies</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg w-fit mb-4"><DollarSign size={20} /></div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Inventory Value</p>
          <h3 className="text-2xl font-black text-slate-900">${stockValue.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg w-fit mb-4"><Package size={20} /></div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total SKU Count</p>
          <h3 className="text-2xl font-black text-slate-900">{totalStock}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-2 bg-red-50 text-red-600 rounded-lg w-fit mb-4"><AlertTriangle size={20} /></div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Low Stock Alerts</p>
          <h3 className="text-2xl font-black text-red-600">{lowStock.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg w-fit mb-4"><TrendingUp size={20} /></div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Turnover Rate</p>
          <h3 className="text-2xl font-black text-slate-900">4.2x</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Recent Inventory Movements</h4>
            <div className="space-y-4">
              {recentMoves.length > 0 ? recentMoves.map(m => {
                const item = itemService.getItemById(m.itemId);
                return (
                  <div key={m.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${m.inQty > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                        {m.inQty > 0 ? <Box size={16} /> : <TrendingUp size={16} className="rotate-90" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{item?.name}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-black">{m.refType} · {m.refNo}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-black ${m.inQty > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {m.inQty > 0 ? `+${m.inQty}` : `-${m.outQty}`}
                      </p>
                      <p className="text-[10px] text-slate-400">{new Date(m.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                );
              }) : <p className="text-center py-10 text-slate-400 italic text-sm">No recent movement found.</p>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Stock Health</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-around text-center mt-4">
              <div>
                <p className="text-lg font-black text-emerald-600">{totalStock - lowStock.length}</p>
                <p className="text-[10px] text-slate-400 uppercase font-black">Healthy</p>
              </div>
              <div>
                <p className="text-lg font-black text-red-600">{lowStock.length}</p>
                <p className="text-[10px] text-slate-400 uppercase font-black">Critical</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl shadow-xl">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Urgent Low Stock</h4>
            <div className="space-y-3">
              {lowStock.slice(0, 3).map(i => (
                <div key={i.id} className="flex items-center justify-between p-2 bg-slate-800 rounded-lg">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{i.name}</p>
                    <p className="text-[10px] text-slate-400">Has {itemService.calculateStock(i.id)} / Reorder {i.reorderLevel}</p>
                  </div>
                  <button onClick={() => navigate(`/items/${i.id}`)} className="p-1.5 text-blue-400 hover:bg-slate-700 rounded-md">
                    <ArrowRight size={14} />
                  </button>
                </div>
              ))}
              {lowStock.length === 0 && <p className="text-xs text-slate-500 italic text-center py-4">All stock levels healthy.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
