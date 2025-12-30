
import React, { useState } from 'react';
import { 
  BarChart3, PieChart as PieChartIcon, Download, 
  Search, Calendar, Filter, FileSpreadsheet, 
  TrendingUp, Users, Package, Clock, ShieldCheck
} from 'lucide-react';
import { reportService } from '../services/report.service';

type ReportType = 'sales_customer' | 'sales_item' | 'inventory_value' | 'ar_aging';

export default function Reports() {
  const [activeReport, setActiveReport] = useState<ReportType>('sales_customer');
  const [search, setSearch] = useState('');

  const renderReportContent = () => {
    switch (activeReport) {
      case 'sales_customer':
        const customerData = reportService.getSalesByCustomer();
        return (
          <div className="animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-900">Revenue by Customer</h3>
              <button onClick={() => reportService.exportToCSV(customerData, 'Sales_By_Customer')} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-100 hover:bg-emerald-100 transition-all">
                <FileSpreadsheet size={16} /> Export CSV
              </button>
            </div>
            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Invoices</th>
                    <th className="px-6 py-4 text-right">Total Revenue</th>
                    <th className="px-6 py-4 text-right">Outstanding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {customerData.map((row, i) => (
                    <tr key={i} className="text-sm">
                      <td className="px-6 py-4 font-bold text-slate-900">{row.customer} <br/><span className="text-[10px] text-slate-400 uppercase font-black">{row.company}</span></td>
                      <td className="px-6 py-4 text-slate-600">{row.invoiceCount}</td>
                      <td className="px-6 py-4 text-right font-black text-slate-900">AED {row.totalRevenue.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-black text-amber-600">AED {row.balance.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'sales_item':
        const itemData = reportService.getSalesByItem();
        return (
          <div className="animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-900">Item Sales Performance</h3>
              <button onClick={() => reportService.exportToCSV(itemData, 'Sales_By_Item')} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-100 hover:bg-emerald-100 transition-all">
                <FileSpreadsheet size={16} /> Export CSV
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {itemData.map((row, i) => (
                <div key={i} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-lg transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-black"># {i+1}</div>
                    <div>
                      <p className="text-sm font-black text-slate-900">{row.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-black">{row.sku}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-12">
                     <div className="text-center">
                        <p className="text-sm font-black text-slate-900">{row.qtySold}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-black">Sold</p>
                     </div>
                     <div className="text-right min-w-[100px]">
                        <p className="text-lg font-black text-blue-600">AED {row.revenue.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-black">Revenue</p>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'inventory_value':
        const valData = reportService.getStockValuation();
        return (
          <div className="animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-900">Inventory Valuation Summary</h3>
              <button onClick={() => reportService.exportToCSV(valData, 'Stock_Valuation')} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-100 hover:bg-emerald-100 transition-all">
                <FileSpreadsheet size={16} /> Export CSV
              </button>
            </div>
            <div className="bg-slate-900 p-8 rounded-3xl mb-8 text-white flex items-center justify-between">
               <div>
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Total Asset Valuation</p>
                  <h2 className="text-4xl font-black">AED {valData.reduce((sum, r) => sum + r.valuation, 0).toLocaleString()}</h2>
               </div>
               <div className="hidden sm:block">
                  <TrendingUp size={64} className="text-emerald-500 opacity-20" />
               </div>
            </div>
            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Item Details</th>
                    <th className="px-6 py-4 text-center">On Hand</th>
                    <th className="px-6 py-4 text-right">Unit Cost</th>
                    <th className="px-6 py-4 text-right">Total Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {valData.map((row, i) => (
                    <tr key={i} className="text-sm">
                      <td className="px-6 py-4 font-bold text-slate-900">{row.name} <br/><span className="text-[10px] text-slate-400 font-mono">{row.sku}</span></td>
                      <td className="px-6 py-4 text-center font-black text-slate-600">{row.onHand}</td>
                      <td className="px-6 py-4 text-right text-slate-500">AED {row.unitCost.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right font-black text-slate-900">AED {row.valuation.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'ar_aging':
        const agingData = reportService.getARAging();
        return (
          <div className="animate-in fade-in duration-300">
             <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-900">AR Aging (Receivables)</h3>
              <button onClick={() => reportService.exportToCSV(agingData, 'AR_Aging')} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-100 hover:bg-emerald-100 transition-all">
                <FileSpreadsheet size={16} /> Export CSV
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {agingData.map((row, i) => (
                <div key={i} className="p-6 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xs ${row.daysOverdue > 30 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                       {row.daysOverdue}D
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">{row.invoiceNumber}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{row.customer}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-slate-900">AED {row.amount.toLocaleString()}</p>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${row.status === 'Overdue' ? 'text-red-500' : 'text-blue-500'}`}>{row.status}</p>
                  </div>
                </div>
              ))}
              {agingData.length === 0 && <p className="text-center py-20 text-slate-400 italic">No outstanding receivables found.</p>}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics & Reports</h1>
          <p className="text-slate-500 text-sm">Actionable business intelligence for organizational growth.</p>
        </div>
        <div className="flex items-center gap-3 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl border border-blue-100 text-[10px] font-black uppercase tracking-widest">
           <ShieldCheck size={16} /> Certified Financials
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="space-y-2">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-4">Report Categories</p>
           {[
             { id: 'sales_customer', label: 'Sales by Customer', icon: <Users size={16} /> },
             { id: 'sales_item', label: 'Sales by Item', icon: <BarChart3 size={16} /> },
             { id: 'inventory_value', label: 'Stock Valuation', icon: <Package size={16} /> },
             { id: 'ar_aging', label: 'AR Aging Report', icon: <Clock size={16} /> },
           ].map(report => (
             <button
               key={report.id}
               onClick={() => setActiveReport(report.id as any)}
               className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all border ${
                 activeReport === report.id 
                 ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-200' 
                 : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
               }`}
             >
               {report.icon}
               {report.label}
             </button>
           ))}
        </div>

        <div className="lg:col-span-3 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm min-h-[600px]">
          {renderReportContent()}
        </div>
      </div>
    </div>
  );
}
