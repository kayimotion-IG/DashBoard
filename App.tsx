
import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, 
  BarChart3, FileText, LogOut, Cloud, Database,
  Truck, Wallet, ClipboardList, Boxes, Receipt, 
  CreditCard, History, Settings as SettingsIcon,
  PackageCheck, FileMinus, HardDrive, ShieldCheck,
  DownloadCloud, MonitorSmartphone, Wifi, WifiOff,
  Hammer, ShoppingBag, Store, HandCoins, Loader2, Download,
  Monitor, Smartphone, ChevronRight, X, Info, CheckCircle,
  MailCheck
} from 'lucide-react';

import Dashboard from './views/Dashboard.tsx';
import ItemsList from './views/ItemsList.tsx';
import ItemForm from './views/items/ItemForm.tsx';
import ItemDetail from './views/items/ItemDetail.tsx';
import InventoryDashboard from './views/inventory/Dashboard.tsx';
import Adjustments from './views/inventory/Adjustments.tsx';
import Assemblies from './views/inventory/Assemblies.tsx';

import Customers from './views/sales/Customers.tsx';
import CustomerForm from './views/sales/CustomerForm.tsx';
import SalesOrders from './views/sales/SalesOrders.tsx';
import SalesOrderForm from './views/sales/SalesOrderForm.tsx';
import SalesOrderDetail from './views/sales/SalesOrderDetail.tsx';
import Invoices from './views/sales/Invoices.tsx';
import InvoiceForm from './views/sales/InvoiceForm.tsx';
import InvoiceDetail from './views/sales/InvoiceDetail.tsx';
import DeliveryChallanList from './views/sales/DeliveryChallanList.tsx';
import DeliveryChallanForm from './views/sales/DeliveryChallanForm.tsx';
import CreditNotes from './views/sales/CreditNotes.tsx';
import CreditNoteForm from './views/sales/CreditNoteForm.tsx';
import Statements from './views/sales/Statements.tsx';
import CommunicationsLog from './views/operations/CommunicationsLog.tsx';

import Vendors from './views/purchases/Vendors.tsx';
import VendorForm from './views/purchases/VendorForm.tsx';
import PurchaseOrders from './views/purchases/PurchaseOrders.tsx';
import PurchaseOrderForm from './views/purchases/PurchaseOrderForm.tsx';
import PurchaseOrderDetail from './views/purchases/PurchaseOrderDetail.tsx';
import Bills from './views/purchases/Bills.tsx';
import BillForm from './views/purchases/BillForm.tsx';
import GoodsReceiveList from './views/purchases/GoodsReceiveList.tsx';
import GoodsReceiveForm from './views/purchases/GoodsReceiveForm.tsx';
import PaymentMadeList from './views/purchases/PaymentMadeList.tsx';
import PaymentMadeForm from './views/purchases/PaymentMadeForm.tsx';

import Reports from './views/Reports.tsx';
import Settings from './views/Settings.tsx';
import Backup from './views/admin/Backup.tsx';
import Login from './views/auth/Login.tsx';
import TeamAccess from './views/admin/TeamAccess.tsx';

import { User, AppSettings, Role } from './types.ts';
import { itemService } from './services/item.service.ts';
import { backupService } from './services/backup.service.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, pass: string) => Promise<boolean>;
  logout: () => void;
  can: (action: string) => boolean;
  settings: AppSettings;
  refreshSettings: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth error");
  return context;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(itemService.getSettings());
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(!!standalone);

    const session = localStorage.getItem('klencare_session');
    const adminUser: User = { 
      id: '1', 
      name: 'System Owner', 
      role: Role.Admin, 
      email: 'admin@klencare.net' 
    };
    
    if (!session) {
      localStorage.setItem('klencare_session', JSON.stringify(adminUser));
      setUser(adminUser);
    } else {
      setUser(JSON.parse(session));
    }
    setLoading(false);

    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));

    const handlePrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handlePrompt);
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, []);

  const handleInstallApp = async () => {
    if (isStandalone) return;
    
    setInstalling(true);
    if (!deferredPrompt) {
      setShowInstallGuide(true);
      setInstalling(false);
      return;
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsStandalone(true);
    }
    setInstalling(false);
  };

  const refreshSettings = () => setSettings(itemService.getSettings());
  const login = async () => true;
  const logout = () => {
    localStorage.removeItem('klencare_session');
    setUser(null);
  };
  const can = (perm: string) => true;

  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-slate-900"><div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin"></div></div>;

  const NavItem = ({ label, icon, path }: { label: string, icon: any, path: string }) => {
    const active = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
    return (
      <Link to={path} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-[11px] font-bold ${active ? 'bg-brand text-slate-900 shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
        {React.cloneElement(icon, { size: 14 })}
        {label}
      </Link>
    );
  };

  const NavSection = ({ title, children }: { title: string, children?: React.ReactNode }) => (
    <div className="space-y-0.5 pt-4 first:pt-0">
      <p className="px-3 text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5">{title}</p>
      {children}
    </div>
  );

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, can, settings, refreshSettings }}>
      <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 font-sans relative">
        <aside className="w-64 bg-slate-950 flex flex-col border-r border-slate-800 shrink-0">
          <div className="p-5 border-b border-slate-800/50 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-brand rounded-lg flex items-center justify-center font-black text-slate-900 shadow-lg text-xs">K</div>
                <span className="text-sm font-bold text-white tracking-tight">KlenCare <span className="text-brand">ERP</span></span>
             </div>
          </div>
          
          <nav className="flex-1 overflow-y-auto p-3 space-y-1 sidebar-scroll custom-scrollbar">
            <NavItem label="Control Center" icon={<LayoutDashboard />} path="/" />

            <NavSection title="Inventory Suite">
              <NavItem label="Items Catalog" icon={<Package />} path="/items" />
              <NavItem label="Stock Levels" icon={<Boxes />} path="/inventory/dashboard" />
              <NavItem label="Adjustments" icon={<ClipboardList />} path="/inventory/adjustments" />
              <NavItem label="Assemblies (BOM)" icon={<Hammer />} path="/inventory/assemblies" />
            </NavSection>

            <NavSection title="Sales Operations">
              <NavItem label="Customers" icon={<Users />} path="/sales/customers" />
              <NavItem label="Sales Orders" icon={<ShoppingCart />} path="/sales/orders" />
              <NavItem label="Tax Invoices" icon={<Receipt />} path="/sales/invoices" />
              <NavItem label="Dispatch Logs" icon={<MailCheck />} path="/operations/communications" />
              <NavItem label="Delivery (GRN)" icon={<Truck />} path="/sales/delivery-challans" />
              <NavItem label="Credit Notes" icon={<FileMinus />} path="/sales/credit-notes" />
              <NavItem label="Statements" icon={<FileText />} path="/sales/statements" />
            </NavSection>

            <NavSection title="Purchasing & AP">
              <NavItem label="Suppliers" icon={<Store />} path="/purchases/vendors" />
              <NavItem label="Purchase Orders" icon={<ShoppingBag />} path="/purchases/orders" />
              <NavItem label="Goods Receive" icon={<PackageCheck />} path="/purchases/receives" />
              <NavItem label="Vendor Bills" icon={<Wallet />} path="/purchases/bills" />
              <NavItem label="Payments Made" icon={<CreditCard />} path="/purchases/payments" />
            </NavSection>

            <NavSection title="Analytics">
              <NavItem label="Financial Reports" icon={<BarChart3 />} path="/reports" />
            </NavSection>
          </nav>

          <div className="p-3 space-y-2 bg-slate-900/40 border-t border-slate-800">
            <button 
              onClick={handleInstallApp}
              disabled={installing}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all border ${
                isStandalone 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                : 'bg-slate-800 hover:bg-slate-700 text-brand border-brand/10 shadow-lg shadow-black/20'
              }`}
            >
              {installing ? <Loader2 size={14} className="animate-spin"/> : isStandalone ? <CheckCircle size={14} /> : <DownloadCloud size={14} />}
              {installing ? 'Preparing...' : isStandalone ? 'Desktop Ready' : 'Install ERP App'}
            </button>

            <div className="flex items-center gap-3 px-1 py-1">
              <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-[10px] font-black text-slate-900 uppercase">AD</div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-white truncate">{user?.name}</p>
                <div className="flex items-center gap-1">
                  <ShieldCheck size={10} className="text-emerald-500" />
                  <p className="text-[8px] text-slate-400 font-bold uppercase">Enterprise Admin</p>
                </div>
              </div>
              <Link to="/settings" className="text-slate-500 hover:text-white p-1.5 hover:bg-slate-800 rounded-lg transition-all"><SettingsIcon size={14} /></Link>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-8 relative bg-slate-50">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/items" element={<ItemsList />} />
            <Route path="/items/new" element={<ItemForm />} />
            <Route path="/items/edit/:id" element={<ItemForm />} />
            <Route path="/items/:id" element={<ItemDetail />} />
            <Route path="/inventory/dashboard" element={<InventoryDashboard />} />
            <Route path="/inventory/adjustments" element={<Adjustments />} />
            <Route path="/inventory/assemblies" element={<Assemblies />} />
            <Route path="/sales/customers" element={<Customers />} />
            <Route path="/sales/customers/new" element={<CustomerForm />} />
            <Route path="/sales/customers/edit/:id" element={<CustomerForm />} />
            <Route path="/sales/orders" element={<SalesOrders />} />
            <Route path="/sales/orders/new" element={<SalesOrderForm />} />
            <Route path="/sales/orders/:id" element={<SalesOrderDetail />} />
            <Route path="/sales/invoices" element={<Invoices />} />
            <Route path="/sales/invoices/new" element={<InvoiceForm />} />
            <Route path="/sales/invoices/view/:id" element={<InvoiceDetail />} />
            <Route path="/sales/delivery-challans" element={<DeliveryChallanList />} />
            <Route path="/sales/delivery-challans/new" element={<DeliveryChallanForm />} />
            <Route path="/sales/credit-notes" element={<CreditNotes />} />
            <Route path="/sales/credit-notes/new" element={<CreditNoteForm />} />
            <Route path="/sales/statements" element={<Statements />} />
            <Route path="/operations/communications" element={<CommunicationsLog />} />
            <Route path="/purchases/vendors" element={<Vendors />} />
            <Route path="/purchases/vendors/new" element={<VendorForm />} />
            <Route path="/purchases/vendors/edit/:id" element={<VendorForm />} />
            <Route path="/purchases/orders" element={<PurchaseOrders />} />
            <Route path="/purchases/orders/new" element={<PurchaseOrderForm />} />
            <Route path="/purchases/orders/:id" element={<PurchaseOrderDetail />} />
            <Route path="/purchases/receives" element={<GoodsReceiveList />} />
            <Route path="/purchases/receives/new" element={<GoodsReceiveForm />} />
            <Route path="/purchases/bills" element={<Bills />} />
            <Route path="/purchases/bills/new" element={<BillForm />} />
            <Route path="/purchases/payments" element={<PaymentMadeList />} />
            <Route path="/purchases/payments/new" element={<PaymentMadeForm />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin/team" element={<TeamAccess />} />
            <Route path="/admin/backup" element={<Backup />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        {showInstallGuide && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col border border-white/10 animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-brand/10 text-brand rounded-2xl shadow-sm"><MonitorSmartphone size={24}/></div>
                   <div>
                      <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">Desktop Installation Hub</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Native Experience Assistant</p>
                   </div>
                </div>
                <button onClick={() => setShowInstallGuide(false)} className="p-2.5 text-slate-400 hover:text-rose-500 transition-colors bg-white rounded-xl shadow-sm border border-slate-100"><X size={20} /></button>
              </div>
              
              <div className="flex-1 p-10 space-y-10 overflow-y-auto">
                 <div className="space-y-4">
                    <h4 className="text-xl font-black text-slate-900 tracking-tight">KlenCare ERP is a Progressive Enterprise App.</h4>
                    <p className="text-slate-500 text-sm leading-relaxed">
                       To "install" it on your PC, you don't need a bulky .exe file. Follow these steps to add it to your Start Menu, Taskbar, or Desktop:
                    </p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-md"><Monitor size={16}/></div>
                          <h5 className="font-black text-xs uppercase text-slate-900">Chrome / Edge (PC)</h5>
                       </div>
                       <ul className="text-xs text-slate-600 space-y-3 font-medium">
                          <li className="flex gap-2">
                             <span className="w-5 h-5 bg-white border rounded-full flex items-center justify-center shrink-0 font-bold text-[10px]">1</span>
                             Look for the <span className="font-black text-blue-600">Install</span> icon in the right side of your Address Bar.
                          </li>
                          <li className="flex gap-2">
                             <span className="w-5 h-5 bg-white border rounded-full flex items-center justify-center shrink-0 font-bold text-[10px]">2</span>
                             Click it and select <span className="font-bold">Install</span> when prompted.
                          </li>
                       </ul>
                    </div>

                    <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100 space-y-4">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-rose-600 text-white rounded-lg flex items-center justify-center shadow-md"><Smartphone size={16}/></div>
                          <h5 className="font-black text-xs uppercase text-slate-900">Safari (Mac/iOS)</h5>
                       </div>
                       <ul className="text-xs text-slate-600 space-y-3 font-medium">
                          <li className="flex gap-2">
                             <span className="w-5 h-5 bg-white border rounded-full flex items-center justify-center shrink-0 font-bold text-[10px]">1</span>
                             Tap the <span className="font-black text-rose-600">Share</span> icon (square with arrow).
                          </li>
                          <li className="flex gap-2">
                             <span className="w-5 h-5 bg-white border rounded-full flex items-center justify-center shrink-0 font-bold text-[10px]">2</span>
                             Scroll and tap <span className="font-bold">"Add to Home Screen"</span>.
                          </li>
                       </ul>
                    </div>
                 </div>

                 <div className="p-6 bg-slate-900 rounded-3xl text-white flex items-center justify-between group cursor-pointer" onClick={() => backupService.exportClientState()}>
                    <div className="flex items-center gap-4">
                       <div className="p-3 bg-white/10 rounded-2xl"><Download size={20}/></div>
                       <div>
                          <p className="text-sm font-black">Still having trouble?</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Download Offline Database Backup Instead</p>
                       </div>
                    </div>
                    <ChevronRight className="text-slate-500 group-hover:text-brand transition-all" size={20}/>
                 </div>
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-center">
                 <button onClick={() => setShowInstallGuide(false)} className="px-12 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-slate-800 transition-all active:scale-95">Got it, let's go</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthContext.Provider>
  );
}
