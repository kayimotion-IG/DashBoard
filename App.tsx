import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, 
  BarChart3, FileText, LogOut, Cloud, Database,
  Truck, Wallet, ClipboardList, Boxes, Receipt, 
  CreditCard, History, Settings as SettingsIcon,
  PackageCheck, FileMinus, HardDrive, ShieldCheck
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
import DeliveryChallanList from './views/sales/DeliveryChallanList.tsx';
import DeliveryChallanForm from './views/sales/DeliveryChallanForm.tsx';
import CreditNotes from './views/sales/CreditNotes.tsx';
import CreditNoteForm from './views/sales/CreditNoteForm.tsx';
import Statements from './views/sales/Statements.tsx';

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
import { apiRequest } from './services/api.ts';

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
  const [settings, setSettings] = useState<AppSettings>(itemService.getSettings());
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // 1. AUTO-LOGIN BYPASS
    const session = localStorage.getItem('klencare_session');
    if (!session) {
      const adminUser: User = { 
        id: '1', 
        name: 'System Owner', 
        role: Role.Admin, 
        email: 'admin@klencare.net' 
      };
      localStorage.setItem('klencare_session', JSON.stringify(adminUser));
      localStorage.setItem('klencare_token', 'local-auto-bypass-' + Date.now());
      setUser(adminUser);
    } else {
      try { setUser(JSON.parse(session)); } 
      catch (e) { localStorage.removeItem('klencare_session'); }
    }
    
    setLoading(false);
  }, []);

  const refreshSettings = () => setSettings(itemService.getSettings());

  const login = async (username: string, pass: string) => {
    const res = await apiRequest('POST', '/api/auth/login', { username, password: pass });
    if (res && res.token) {
      setUser(res.user);
      navigate('/');
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('klencare_token');
    localStorage.removeItem('klencare_session');
    setUser(null);
    navigate('/login');
  };

  const can = (perm: string) => true; // Grant all to current session

  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#0f172a]">
      <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const NavItem = ({ label, icon, path }: { label: string, icon: any, path: string }) => {
    const active = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
    return (
      <Link to={path} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-xs font-bold ${active ? 'bg-brand text-slate-900 shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
        {React.cloneElement(icon, { size: 16 })}
        {label}
      </Link>
    );
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, can, settings, refreshSettings }}>
      <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 font-sans">
        <aside className="w-64 bg-slate-900 flex flex-col border-r border-slate-800 shrink-0">
          <div className="p-6 border-b border-slate-800/50">
             <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-brand rounded-xl flex items-center justify-center font-black text-slate-900 shadow-lg text-lg">K</div>
                <span className="text-lg font-bold text-white tracking-tight italic">KlenCare <span className="text-brand">ERP</span></span>
             </div>
          </div>
          
          <nav className="flex-1 overflow-y-auto p-4 space-y-5 sidebar-scroll">
            <NavItem label="Command Dashboard" icon={<LayoutDashboard />} path="/" />

            <div className="space-y-1">
              <p className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Inventory Control</p>
              <NavItem label="Items Catalog" icon={<Package />} path="/items" />
              <NavItem label="Stock Status" icon={<Boxes />} path="/inventory/dashboard" />
              <NavItem label="Assemblies / BOM" icon={<HardDrive />} path="/inventory/assemblies" />
              <NavItem label="Adjustments" icon={<History />} path="/inventory/adjustments" />
            </div>

            <div className="space-y-1">
              <p className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Sales & Fulfillment</p>
              <NavItem label="Customers" icon={<Users />} path="/sales/customers" />
              <NavItem label="Sales Orders" icon={<ShoppingCart />} path="/sales/orders" />
              <NavItem label="Tax Invoices" icon={<Receipt />} path="/sales/invoices" />
              <NavItem label="Delivery Challans" icon={<PackageCheck />} path="/sales/delivery-challans" />
              <NavItem label="Credit Notes" icon={<FileMinus />} path="/sales/credit-notes" />
            </div>

            <div className="space-y-1">
              <p className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Purchases & Payables</p>
              <NavItem label="Vendors" icon={<Truck />} path="/purchases/vendors" />
              <NavItem label="Purchase Orders" icon={<ClipboardList />} path="/purchases/orders" />
              <NavItem label="Goods Receive (GRN)" icon={<HardDrive />} path="/purchases/receives" />
              <NavItem label="Vendor Bills" icon={<Wallet />} path="/purchases/bills" />
              <NavItem label="Payments Made" icon={<CreditCard />} path="/purchases/payments" />
            </div>

            <div className="space-y-1">
              <p className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Analytics</p>
              <NavItem label="Intelligence Reports" icon={<BarChart3 />} path="/reports" />
            </div>
          </nav>

          <div className="p-4 border-t border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-[10px] font-black text-slate-900 uppercase">{user?.name?.substring(0,2)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                <p className="text-[9px] text-brand font-black uppercase tracking-wider">{user?.role}</p>
              </div>
              <Link to="/settings" className="text-slate-500 hover:text-white"><SettingsIcon size={16} /></Link>
              <button onClick={logout} className="text-slate-500 hover:text-white p-1"><LogOut size={16} /></button>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-8 relative">
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
            <Route path="/sales/delivery-challans" element={<DeliveryChallanList />} />
            <Route path="/sales/delivery-challans/new" element={<DeliveryChallanForm />} />
            <Route path="/sales/credit-notes" element={<CreditNotes />} />
            <Route path="/sales/credit-notes/new" element={<CreditNoteForm />} />
            <Route path="/sales/statements" element={<Statements />} />
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
      </div>
    </AuthContext.Provider>
  );
}