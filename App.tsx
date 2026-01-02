import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, ShoppingCart, Truck, Users, 
  BarChart3, FileText, LogOut, Search, Bell, 
  ChevronDown, ChevronRight, Plus, Menu, X, 
  Boxes, ShieldCheck, Settings as SettingsIcon, Database, Activity,
  ArrowRight
} from 'lucide-react';

import Dashboard from './views/Dashboard';
import ItemsList from './views/ItemsList';
import ItemForm from './views/items/ItemForm';
import Customers from './views/sales/Customers';
import SalesOrders from './views/sales/SalesOrders';
import Invoices from './views/sales/Invoices';
import Reports from './views/Reports';
import Settings from './views/Settings';
import Backup from './views/admin/Backup';
import Health from './views/Health';
import Login from './views/auth/Login';
import Unauthorized from './views/errors/Unauthorized';
import { User, Role, Permission, AppSettings } from './types';
import { itemService } from './services/item.service';
import { apiRequest } from './services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, pass: string) => Promise<boolean>;
  logout: () => void;
  can: (action: string) => boolean;
  settings: AppSettings;
}

const AuthContext = createContext<AuthContextType | null>(null);
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth error");
  return context;
};

const SIDEBAR_ITEMS = [
  { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
  { label: 'Items', icon: <Package size={20} />, path: '/items' },
  { label: 'Sales Orders', icon: <ShoppingCart size={20} />, path: '/sales/orders' },
  { label: 'Customers', icon: <Users size={20} />, path: '/sales/customers' },
  { label: 'Invoices', icon: <FileText size={20} />, path: '/sales/invoices' },
  { label: 'Reports', icon: <BarChart3 size={20} />, path: '/reports' },
  { label: 'System Settings', icon: <SettingsIcon size={20} />, path: '/settings' },
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const session = localStorage.getItem('klencare_session');
    if (session) setUser(JSON.parse(session));
    setLoading(false);
  }, []);

  const login = async (username: string, pass: string) => {
    try {
      const res = await apiRequest('POST', '/api/auth/login', { username, password: pass });
      if (res.token) {
        localStorage.setItem('klencare_token', res.token);
        localStorage.setItem('klencare_session', JSON.stringify(res.user));
        setUser(res.user);
        navigate('/');
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    navigate('/login');
  };

  const can = (action: string) => {
    if (!user) return false;
    if (user.role === 'Admin') return true;
    if (user.role === 'readonly' && action === 'view') return true;
    return false;
  };

  if (loading) return null;

  if (!user && location.pathname !== '/login') return <Navigate to="/login" replace />;
  if (location.pathname === '/login') return <Login onLogin={login} />;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, can, settings: itemService.getSettings() }}>
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        <aside className="w-64 bg-slate-900 flex flex-col border-r border-slate-800">
          <div className="p-8 border-b border-slate-800/50 flex justify-center">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#fbaf0f] rounded-xl flex items-center justify-center font-black text-slate-900 shadow-lg text-xl">K</div>
                <span className="text-xl font-bold text-white tracking-tight">KlenCare <span className="text-[#fbaf0f]">Cloud</span></span>
             </div>
          </div>
          <nav className="flex-1 mt-6 overflow-y-auto px-4 space-y-1">
            {SIDEBAR_ITEMS.map(item => (
              <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${location.pathname === item.path ? 'bg-[#fbaf0f] text-slate-900 shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                {item.icon} {item.label}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-9 h-9 rounded-full bg-[#fbaf0f] flex items-center justify-center text-xs font-black text-slate-900">
                {user?.name?.substring(0,2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-[#fbaf0f] font-black uppercase tracking-wider">{user?.role}</p>
              </div>
              <button onClick={logout} className="text-slate-500 hover:text-white transition-colors"><LogOut size={18} /></button>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-8 relative">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/items" element={<ItemsList />} />
            <Route path="/items/new" element={can('edit') ? <ItemForm /> : <Unauthorized />} />
            <Route path="/sales/customers" element={<Customers />} />
            <Route path="/sales/orders" element={<SalesOrders />} />
            <Route path="/sales/invoices" element={<Invoices />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={can('Admin') ? <Settings /> : <Unauthorized />} />
            <Route path="/admin/backup" element={<Backup />} />
            <Route path="/health" element={<Health />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </AuthContext.Provider>
  );
}