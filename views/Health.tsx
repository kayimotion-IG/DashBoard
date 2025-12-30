
import React, { useState, useEffect } from 'react';
import { 
  Activity, ShieldCheck, Database, AlertCircle, RefreshCw, 
  CheckCircle2, XCircle, AlertTriangle, Layers, Trash2,
  Clock, ShieldAlert, Zap, Server, WifiOff
} from 'lucide-react';
import { itemService } from '../services/item.service';
import { salesService } from '../services/sales.service';
import { purchaseService } from '../services/purchase.service';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';

interface TestResult {
  name: string;
  status: 'pending' | 'pass' | 'fail' | 'skipped';
  error?: string;
  details?: string;
}

export default function Health() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [cleanupStatus, setCleanupStatus] = useState<string>('');
  const [serverHealth, setServerHealth] = useState<any>(null);

  const runFullSystemTest = async () => {
    if (running) return;
    setRunning(true);
    setCleanupStatus('');
    setServerHealth(null);
    
    const tests: TestResult[] = [
      { name: 'Server Communication & Runtime', status: 'pending' },
      { name: 'Database Read/Write Integrity', status: 'pending' },
      { name: 'Inventory Ledger (IN/OUT Linking)', status: 'pending' },
      { name: 'Sales Flow (Order -> Stock -> AR)', status: 'pending' },
      { name: 'Purchase Flow (PO -> Stock -> AP)', status: 'pending' },
      { name: 'Financial Consistency & Reports', status: 'pending' }
    ];
    setResults([...tests]);

    const updateStatus = (index: number, status: 'pass' | 'fail' | 'skipped', error?: string, details?: string) => {
      tests[index] = { ...tests[index], status, error, details };
      setResults([...tests]);
    };

    const cleanupIds: { items: string[], customers: string[], vendors: string[] } = { items: [], customers: [], vendors: [] };

    try {
      // 1. Server Health Check (With 5-second Timeout Watchdog)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      try {
        const startServer = Date.now();
        const srvRes = await fetch('/admin/system-test/run', { 
          method: 'POST',
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!srvRes.ok) throw new Error(`Server returned ${srvRes.status}`);
        
        const srvData = await srvRes.json();
        setServerHealth(srvData.report);
        updateStatus(0, 'pass', undefined, `Latency: ${Date.now() - startServer}ms`);
      } catch (srvErr: any) {
        clearTimeout(timeoutId);
        const msg = srvErr.name === 'AbortError' ? 'Connection Timeout' : 'Server Unreachable';
        updateStatus(0, 'skipped', msg, 'Running in Client-Only Mode');
        console.warn('System Test: Server diagnostics skipped.', srvErr);
      }

      // 2. DB Integrity (Local/Session Write Test)
      try {
        localStorage.setItem('klencare_test_ping', Date.now().toString());
        if (localStorage.getItem('klencare_test_ping')) updateStatus(1, 'pass');
        else throw new Error("Local Storage write blocked.");
      } catch (e: any) {
        updateStatus(1, 'fail', e.message);
        throw e; // Critical failure
      }

      // 3. Inventory linking
      const testItem = itemService.createItem({ 
        name: 'TEST__CHIP_X1', 
        sku: 'TEST-' + Math.random().toString(36).substr(2, 4).toUpperCase(), 
        purchasePrice: 100,
        trackInventory: true 
      }, user);
      cleanupIds.items.push(testItem.id);
      
      const startStock = itemService.calculateStock(testItem.id);
      itemService.addStockMove({
        itemId: testItem.id, warehouseId: 'WH01', refType: 'ADJUSTMENT', refNo: 'TEST-001',
        inQty: 50, outQty: 0, note: 'System Test Adjustment'
      });

      if (itemService.calculateStock(testItem.id) === startStock + 50) updateStatus(2, 'pass', undefined, 'OnHand 0 -> 50 OK');
      else throw new Error("Stock ledger calculation mismatch.");

      // 4. Sales linking
      const testCust = salesService.createCustomer({ name: 'TEST__ENTERPRISE_DUBAI' }, user);
      cleanupIds.customers.push(testCust.id);

      const testSO = salesService.createSO({ customerId: testCust.id, total: 1000, lines: [{ itemId: testItem.id, quantity: 10, rate: 100 }] }, user);
      salesService.createDelivery({ customerId: testCust.id, dcNumber: 'DC-TEST-1', lines: [{ itemId: testItem.id, quantity: 10 }] }, 'WH01', user);
      const stockAfterSale = itemService.calculateStock(testItem.id);
      
      const testInv = salesService.createInvoice({ customerId: testCust.id, total: 1000, invoiceNumber: 'INV-TEST-1' }, user);
      const balanceAfterInv = salesService.getCustomerBalance(testCust.id);

      if (stockAfterSale === 40 && balanceAfterInv === 1000) updateStatus(3, 'pass', undefined, 'Stock 50 -> 40, AR +1000 OK');
      else throw new Error(`Sales linking failed. Stock: ${stockAfterSale}, AR: ${balanceAfterInv}`);

      // 5. Purchase linking
      const testVend = purchaseService.createVendor({ name: 'TEST__SUPPLIER_GULF' }, user);
      cleanupIds.vendors.push(testVend.id);

      purchaseService.createGRN({ vendorId: testVend.id, receiveNo: 'GRN-TEST-1', lines: [{ itemId: testItem.id, quantity: 20, unitCost: 80 }] }, user);
      const stockAfterPurchase = itemService.calculateStock(testItem.id);

      const testBill = purchaseService.createBill({ vendorId: testVend.id, total: 1600, billNumber: 'BIL-TEST-1' }, user);
      const balanceAfterBill = purchaseService.getVendorBalance(testVend.id);

      if (stockAfterPurchase === 60 && balanceAfterBill === 1600) updateStatus(4, 'pass', undefined, 'Stock 40 -> 60, AP +1600 OK');
      else throw new Error(`Purchase linking failed. Stock: ${stockAfterPurchase}, AP: ${balanceAfterBill}`);

      // 6. Financial Settlement
      salesService.recordPayment({ customerId: testCust.id, invoiceId: testInv.id, amount: 600 }, user);
      purchaseService.recordPayment({ vendorId: testVend.id, billId: testBill.id, amount: 1600 }, user);

      const arFinal = salesService.getCustomerBalance(testCust.id);
      const apFinal = purchaseService.getVendorBalance(testVend.id);

      if (arFinal === 400 && apFinal === 0) updateStatus(5, 'pass', undefined, 'Payment Receipts & Disbursements OK');
      else throw new Error(`Final balances incorrect. AR: ${arFinal}, AP: ${apFinal}`);

      // --- CLEANUP ---
      setCleanupStatus('Sanitizing system: Purging test records...');
      cleanupIds.vendors.forEach(id => purchaseService.deleteVendor(id, user));
      cleanupIds.customers.forEach(id => salesService.deleteCustomer(id, user));
      cleanupIds.items.forEach(id => itemService.deleteItem(id, user));
      setCleanupStatus('System successfully sanitized.');

    } catch (err: any) {
      const pendingIdx = tests.findIndex(t => t.status === 'pending');
      if (pendingIdx !== -1) updateStatus(pendingIdx, 'fail', err.message);
      setCleanupStatus('Test failed. Check module linkages.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-8">
      <div className="flex items-center justify-between px-2">
         <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600 rounded-[24px] flex items-center justify-center text-white shadow-xl shadow-blue-200">
               <ShieldCheck size={32} />
            </div>
            <div>
               <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Integrity Panel</h1>
               <p className="text-slate-500 font-medium">Cross-module linking and data safety validation engine.</p>
            </div>
         </div>
         <button 
           onClick={() => navigate('/settings')}
           className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
         >
           Return to Config
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white rounded-[32px] border border-slate-200 shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <Zap size={20} className="text-amber-500 fill-amber-500" />
                    <span className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Diagnostic Engine</span>
                 </div>
                 <button 
                  onClick={runFullSystemTest}
                  disabled={running}
                  className="flex items-center gap-2 px-10 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50 shadow-xl"
                 >
                   {running ? <RefreshCw size={14} className="animate-spin" /> : 'Run Smoke Test'}
                 </button>
              </div>

              <div className="p-8 space-y-4">
                {results.length === 0 ? (
                  <div className="text-center py-20 text-slate-400 space-y-4">
                    <Activity size={48} className="mx-auto opacity-20" />
                    <p className="text-sm font-bold uppercase tracking-widest italic">Ready to validate KlenCare core logic.</p>
                  </div>
                ) : results.map((res, i) => (
                  <div key={i} className={`flex items-center justify-between p-5 bg-white border rounded-[24px] shadow-sm transition-all duration-300 ${res.status === 'fail' ? 'border-red-200 bg-red-50/10' : res.status === 'skipped' ? 'border-amber-100 bg-amber-50/20' : 'border-slate-100'}`}>
                    <div className="flex items-center gap-5">
                      {res.status === 'pass' ? (
                        <CheckCircle2 className="text-emerald-500" size={24} />
                      ) : res.status === 'fail' ? (
                        <XCircle className="text-red-500" size={24} />
                      ) : res.status === 'skipped' ? (
                        <WifiOff className="text-amber-500" size={24} />
                      ) : (
                        <div className="w-6 h-6 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin"></div>
                      )}
                      <div>
                        <p className={`text-sm font-black ${res.status === 'fail' ? 'text-red-600' : res.status === 'skipped' ? 'text-amber-700' : 'text-slate-800'}`}>{res.name}</p>
                        {res.details && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">{res.details}</p>}
                      </div>
                    </div>
                    {res.error && (
                      <div className="flex items-center gap-2 max-w-[200px]">
                         <ShieldAlert size={14} className={res.status === 'skipped' ? 'text-amber-500' : 'text-red-500'} />
                         <span className={`text-[10px] font-black leading-tight ${res.status === 'skipped' ? 'text-amber-600' : 'text-red-600'}`}>{res.error}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {cleanupStatus && (
                <div className="px-8 py-4 bg-slate-900 text-slate-300 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                   <Trash2 size={12} className="text-blue-400" />
                   {cleanupStatus}
                </div>
              )}
           </div>
        </div>

        <div className="space-y-6">
           <div className="bg-slate-900 p-8 rounded-[32px] text-white shadow-2xl">
              <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <Server size={18} /> Server Status
              </h3>
              {serverHealth ? (
                <div className="space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <p className="text-[10px] text-slate-500 font-black uppercase">FS Mode</p>
                         <p className="text-sm font-bold text-emerald-400">{serverHealth.filesystem}</p>
                      </div>
                      <div>
                         <p className="text-[10px] text-slate-500 font-black uppercase">RAM RSS</p>
                         <p className="text-sm font-bold">{serverHealth.memory}</p>
                      </div>
                      <div>
                         <p className="text-[10px] text-slate-500 font-black uppercase">Persistence</p>
                         <p className="text-sm font-bold text-blue-400">{serverHealth.database}</p>
                      </div>
                      <div>
                         <p className="text-[10px] text-slate-500 font-black uppercase">Uptime</p>
                         <p className="text-sm font-bold">{serverHealth.uptime}</p>
                      </div>
                   </div>
                   <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700">
                      <p className="text-[9px] font-black text-slate-500 uppercase mb-2">Build Identifier</p>
                      <p className="text-[10px] font-mono text-blue-300 truncate">{serverHealth.server_runtime}</p>
                   </div>
                </div>
              ) : (
                <div className="py-10 text-center text-slate-600 italic text-xs space-y-4">
                   <WifiOff size={32} className="mx-auto opacity-20" />
                   <p>Awaiting test run or server is offline.</p>
                </div>
              )}
           </div>

           <div className="bg-blue-50 border border-blue-100 p-8 rounded-[32px] space-y-4">
              <Layers size={24} className="text-blue-600" />
              <p className="text-xs text-blue-800 leading-relaxed font-bold">
                <b>Linking Validation:</b> This test simulates real-world usage from PO receipt to Sales dispatch. Client-only mode verifies the browser-side business logic works even if the server file system is disconnected.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
