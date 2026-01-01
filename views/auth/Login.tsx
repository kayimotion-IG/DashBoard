
import React, { useState } from 'react';
import { Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { itemService } from '../../services/item.service';

interface LoginProps {
  onLogin: (email: string, pass: string) => Promise<boolean>;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('admin@klencare.com');
  const [password, setPassword] = useState('Admin@1234');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const settings = itemService.getSettings();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const success = await onLogin(email, password);
      if (!success) {
        setError('Invalid credentials. Please use Admin@1234');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          {settings.logoUrl ? (
            <img 
              src={settings.logoUrl} 
              alt="KlenCare Logo" 
              className="h-32 w-auto object-contain brightness-110 drop-shadow-[0_15px_25px_rgba(0,0,0,0.5)]" 
            />
          ) : (
            <div className="w-20 h-20 bg-[#fbaf0f] rounded-[28px] flex items-center justify-center font-black text-4xl text-slate-900 shadow-2xl shadow-amber-500/20">K</div>
          )}
        </div>
        {!settings.logoUrl && <h2 className="text-center text-3xl font-black text-white tracking-tight">KlenCare CRM</h2>}
        <p className="mt-2 text-center text-sm text-slate-400 font-medium uppercase tracking-widest">
          Professional Enterprise Resource Planning
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-4 shadow-2xl sm:rounded-[32px] sm:px-12 border border-slate-800/10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1">Email Access</label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-10 py-3.5 border border-slate-200 rounded-2xl shadow-sm placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-amber-50 focus:border-[#fbaf0f] text-sm font-medium"
                  placeholder="admin@klencare.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1">Passkey</label>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-10 py-3.5 border border-slate-200 rounded-2xl shadow-sm placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-amber-50 focus:border-[#fbaf0f] text-sm font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3 text-red-700 text-xs font-bold animate-in shake">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl text-xs font-black uppercase tracking-widest text-slate-900 bg-[#fbaf0f] hover:bg-[#e59b00] focus:outline-none focus:ring-4 focus:ring-amber-100 transition-all active:scale-95 disabled:opacity-70"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Authenticate System Access'}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                <span className="px-3 bg-white text-slate-400">Enterprise Standard</span>
              </div>
            </div>
          </div>
        </div>
        <p className="mt-8 text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-40">
          &copy; 2024 KlenCare Technologies UAE
        </p>
      </div>
    </div>
  );
}
