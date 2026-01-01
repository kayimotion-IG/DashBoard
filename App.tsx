
import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, ShoppingCart, Truck, Users, 
  BarChart3, FileText, LogOut, Search, Bell, 
  ChevronDown, ChevronRight, Plus, Menu, X, 
  Boxes, ShieldCheck, Settings as SettingsIcon, ClipboardList, Database, Activity,
  FileMinus
} from 'lucide-react';
import Dashboard from './views/Dashboard';
import ItemsList from './views/ItemsList';
import ItemForm from './views/items/ItemForm';
import ItemDetail from './views/items/ItemDetail';
import ImportItems from './views/items/ImportItems';
import InventoryDashboard from './views/inventory/Dashboard';
import Adjustments from './views/inventory/Adjustments';
import Assemblies from './views/inventory/Assemblies';
import Customers from './views/sales/Customers';
import CustomerForm from './views/sales/CustomerForm';
import SalesOrders from './views/sales/SalesOrders';
import SalesOrderForm from './views/sales/SalesOrderForm';
import SalesOrderDetail from './views/sales/SalesOrderDetail';
import Invoices from './views/sales/Invoices';
import InvoiceForm from './views/sales/InvoiceForm';
import CreditNotes from './views/sales/CreditNotes';
import CreditNoteForm from './views/sales/CreditNoteForm';
import DeliveryChallanList from './views/sales/DeliveryChallanList';
import DeliveryChallanForm from './views/sales/DeliveryChallanForm';
import PaymentReceivedList from './views/sales/PaymentReceivedList';
import PaymentReceivedForm from './views/sales/PaymentReceivedForm';
import Vendors from './views/purchases/Vendors';
import VendorForm from './views/purchases/VendorForm';
import PurchaseOrders from './views/purchases/PurchaseOrders';
import PurchaseOrderForm from './views/purchases/PurchaseOrderForm';
import PurchaseOrderDetail from './views/purchases/PurchaseOrderDetail';
import GoodsReceiveList from './views/purchases/GoodsReceiveList';
import GoodsReceiveForm from './views/purchases/GoodsReceiveForm';
import Bills from './views/purchases/Bills';
import BillForm from './views/purchases/BillForm';
import PaymentMadeList from './views/purchases/PaymentMadeList';
import PaymentMadeForm from './views/purchases/PaymentMadeForm';
import Documents from './views/Documents';
import Reports from './views/Reports';
import Settings from './views/Settings';
import Backup from './views/admin/Backup';
import Health from './views/Health';
import Login from './views/auth/Login';
import Unauthorized from './views/errors/Unauthorized';
import { User, Role, Permission } from './types';
import { hasPermission } from './config/permissions';
import { auditService } from './services/audit.service';

// --- Auth Context ---
interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  can: (p: Permission) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

// --- Sidebar Configuration ---
const SIDEBAR_GROUPS = [
  { label: 'Home', icon: <LayoutDashboard size={20} />, path: '/', permission: 'items.view' },
  { label: 'Items', icon: <Package size={20} />, path: '/items', permission: 'items.view' },
  { 
    label: 'Inventory', 
    icon: <Boxes size={20} />, 
    permission: 'inventory.view',
    children: [
      { label: 'Dashboard', path: '/inventory/dashboard' },
      { label: 'Assemblies', path: '/inventory/assemblies' },
      { label: 'Adjustments', path: '/inventory/adjustments' },
    ] 
  },
  { 
    label: 'Sales', 
    icon: <ShoppingCart size={20} />, 
    permission: 'sales.view',
    children: [
      { label: 'Customers', path: '/sales/customers' },
      { label: 'Sales Orders', path: '/sales/orders' },
      { label: 'Delivery Challans', path: '/sales/delivery-challans' },
      { label: 'Invoices', path: '/sales/invoices' },
      { label: 'Credit Notes', path: '/sales/credit-notes' },
      { label: 'Payments Received', path: '/sales/payments' },
    ] 
  },
  { 
    label: 'Purchases', 
    icon: <Truck size={20} />, 
    permission: 'purchases.view',
    children: [
      { label: 'Vendors', path: '/purchases/vendors' },
      { label: 'Purchase Orders', path: '/purchases/orders' },
      { label: 'Receives (GRN)', path: '/purchases/receives' },
      { label: 'Bills', path: '/purchases/bills' },
      { label: 'Payments Made', path: '/purchases/payments' },
    ] 
  },
  { label: 'Reports', icon: <BarChart3 size={20} />, path: '/reports', permission: 'reports.view' },
  { label: 'Documents', icon: <FileText size={20} />, path: '/documents', permission: 'documents.view' },
  { 
    label: 'System', 
    icon: <SettingsIcon size={20} />, 
    permission: 'admin.access',
    children: [
      { label: 'Settings', path: '/settings' },
      { label: 'Health Check', path: '/health' },
      { label: 'Backup & Recovery', path: '/admin/backup' },
    ]
  },
];

interface SidebarItemProps {
  item: any;
  depth?: number;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ item, depth = 0 }) => {
  const { can } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  if (item.permission && !can(item.permission as Permission)) return null;

  const hasChildren = item.children && item.children.length > 0;
  const isActive = location.pathname === item.path || (hasChildren && item.children.some((c: any) => c.path === location.pathname));

  const content = (
    <div 
      className={`
        flex items-center justify-between px-4 py-2.5 mx-2 rounded-lg cursor-pointer transition-all duration-200
        ${isActive ? 'bg-[#f97316] text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
        ${depth > 0 ? 'ml-8 text-sm py-2' : ''}
      `}
      onClick={() => hasChildren && setIsOpen(!isOpen)}
    >
      <div className="flex items-center gap-3">
        {item.icon && <span className={isActive ? 'text-white' : 'text-slate-500'}>{item.icon}</span>}
        <span className="font-medium">{item.label}</span>
      </div>
      {hasChildren && (
        <span>{isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
      )}
    </div>
  );

  return (
    <div className="mb-1">
      {item.path && !hasChildren ? (
        <Link to={item.path}>{content}</Link>
      ) : content}
      
      {hasChildren && isOpen && (
        <div className="mt-1 flex flex-col gap-1">
          {item.children.map((child: any) => (
            <SidebarItem key={child.path} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem('klencare_session');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const login = async (email: string, pass: string) => {
    if (email === 'admin@klencare.com' && pass === 'Admin@1234') {
      const newUser: User = { id: '1', name: 'Administrator', email: 'admin@klencare.com', role: Role.Admin };
      setUser(newUser);
      localStorage.setItem('klencare_session', JSON.stringify(newUser));
      auditService.log(newUser, 'LOGIN', 'USER', newUser.id, 'Successful login');
      navigate('/');
      return true;
    }
    return false;
  };

  const logout = () => {
    if (user) auditService.log(user, 'UPDATE', 'USER', user.id, 'Logged out');
    setUser(null);
    localStorage.removeItem('klencare_session');
    navigate('/login');
  };

  const can = (permission: Permission) => {
    if (!user) return false;
    return hasPermission(user.role, permission);
  };

  if (location.pathname === '/login') {
    return <Login onLogin={login} />;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, can }}>
      <div className="flex h-screen bg-slate-50">
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 border-r border-slate-800`}>
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#f97316] rounded-lg flex items-center justify-center font-bold text-white shadow-lg">K</div>
              <span className="text-xl font-bold text-white tracking-tight">KlenCare <span className="text-[#2563eb]">CRM</span></span>
            </div>
            <button className="lg:hidden text-slate-400" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
          </div>

          <nav className="mt-6 sidebar-scroll overflow-y-auto h-[calc(100vh-120px)] pb-20">
            {SIDEBAR_GROUPS.map((item, idx) => (
              <SidebarItem key={idx} item={item} />
            ))}
          </nav>

          <div className="absolute bottom-0 w-full p-4 border-t border-slate-800 bg-slate-900">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-8 h-8 rounded-full bg-[#2563eb] flex items-center justify-center text-[10px] font-bold text-white">
                {user?.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-[#f97316] uppercase tracking-wider font-bold">{user?.role}</p>
              </div>
              <button onClick={logout} className="text-slate-400 hover:text-white transition-colors"><LogOut size={18} /></button>
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 custom-shadow z-40">
            <div className="flex items-center gap-4">
              <button className="lg:hidden text-slate-500" onClick={() => setSidebarOpen(true)}><Menu size={24} /></button>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2563eb]" size={18} />
                <input type="text" placeholder="Search records..." className="bg-slate-100 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-[#2563eb] rounded-full py-2 pl-10 pr-4 w-64 lg:w-96 outline-none text-sm transition-all" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-blue-50 text-[#2563eb] rounded-full text-[10px] font-bold border border-blue-100">
                <ShieldCheck size={14} /> {user?.role.toUpperCase()} ACCESS
              </div>
              <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#f97316] rounded-full border-2 border-white"></span>
              </button>
              <button onClick={() => navigate('/items/new')} className="flex items-center gap-2 px-4 py-2 bg-[#f97316] text-white rounded-xl hover:bg-orange-700 transition-all shadow-lg active:scale-95">
                <Plus size={18} /> <span className="text-sm font-bold hidden sm:inline">Quick Create</span>
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/items" element={<ItemsList />} />
              <Route path="/items/new" element={<ItemForm />} />
              <Route path="/items/edit/:id" element={<ItemForm />} />
              <Route path="/items/:id" element={<ItemDetail />} />
              <Route path="/items/import" element={<ImportItems />} />
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
              <Route path="/sales/credit-notes" element={<CreditNotes />} />
              <Route path="/sales/credit-notes/new" element={<CreditNoteForm />} />
              <Route path="/sales/delivery-challans" element={<DeliveryChallanList />} />
              <Route path="/sales/delivery-challans/new" element={<DeliveryChallanForm />} />
              <Route path="/sales/payments" element={<PaymentReceivedList />} />
              <Route path="/sales/payments/new" element={<PaymentReceivedForm />} />
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
              <Route path="/documents" element={<Documents />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin/backup" element={<Backup />} />
              <Route path="/health" element={<Health />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </div>
    </AuthContext.Provider>
  );
}
