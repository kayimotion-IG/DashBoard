import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, 
  BarChart3, FileText, LogOut, ChevronRight, UserCheck, 
  Settings as SettingsIcon, ShieldCheck, Sparkles, UserPlus
} from 'lucide-react';

import Dashboard from './views/Dashboard.tsx';
import ItemsList from './views/ItemsList.tsx';
import ItemForm from './views/items/ItemForm.tsx';
import Customers from './views/sales/Customers.tsx';
import SalesOrders from './views/sales/SalesOrders.tsx';
import Invoices from './views/sales/Invoices.tsx';
import Reports from './views/Reports.tsx';
import Settings from './views/Settings.tsx';
import Backup from './views/admin/Backup.tsx';
import Health from './views/Health.tsx';
import Login from './views/auth/Login.tsx';
import TeamAccess from './views/admin/TeamAccess.tsx';
import Unauthorized from './views/errors/Unauthorized.tsx';
import { User, AppSettings } from './types.ts';
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
    const session = localStorage.getItem('klencare_session');
    if (session) {
      try {
        setUser(JSON.parse(session));
      } catch (e) {
        localStorage.removeItem('klencare_session');
      }
    }
    setLoading(false);
  }, []);

  const refreshSettings = () => {
    setSettings(itemService.getSettings());
  };

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
      console.error('Login Failed:', e);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('klencare_token');
    localStorage.removeItem('klencare_session');
    setUser(null);
    navigate('/login');
  };

  const can = (role: string) => {
    if (!user) return false;
    if (user.role === 'Admin') return true;
    return false;
  };

  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-amber-500 font-black uppercase text-[10px] tracking-widest">KlenCare Engine Loading</p>
      </div>
    </div>
  );

  if (!user && location.pathname !== '/login') return <Navigate to="/login" replace />;
  if (location.pathname === '/login' && !user) return <Login onLogin={login} />;
  if (location.pathname === '/login' && user) return <Navigate to="/" replace />;

  const SIDEBAR_ITEMS = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
    { label: 'Items', icon: <Package size={20} />, path: '/items' },
    { label: 'Sales Orders', icon: <ShoppingCart size={20} />, path: '/sales/orders' },
    { label: 'Customers', icon: <Users size={20} />, path: '/sales/customers' },
    { label: 'Invoices', icon: <FileText size={20} />, path: '/sales/invoices' },
    { label: 'Reports', icon: <BarChart3 size={20} />, path: '/reports' },
    { label: 'Settings', icon: <SettingsIcon size={20} />, path: '/settings' },
  ];

  if (user?.role === 'Admin') {
    SIDEBAR_ITEMS.push({ label: 'Team Access', icon: <UserCheck size={20} />, path: '/admin/team' });
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, can, settings, refreshSettings }}>
      <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900">
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
              <div className="w-9 h-9 rounded-full bg-[#fbaf0f] flex items-center justify-center text-xs font-black text-slate-900 uppercase">
                {user?.name?.substring(0,2)}
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
            <Route path="/admin/team" element={can('Admin') ? <TeamAccess /> : <Unauthorized />} />
            <Route path="/admin/backup" element={<Backup />} />
            <Route path="/health" element={<Health />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </AuthContext.Provider>
  );
}