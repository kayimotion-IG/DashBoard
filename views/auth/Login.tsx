import React, { useState } from 'react';
import { Lock, Mail, AlertCircle, Loader2, ShieldCheck, User as UserIcon } from 'lucide-react';
import { itemService } from '../../services/item.service';

interface LoginProps {
  onLogin: (username: string, pass: string) => Promise<boolean>;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('testadmin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const settings = itemService.getSettings();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const success = await onLogin(username, password);
      if (!success) {
        setError('Invalid system credentials. Please verify your identity.');
      }
    } catch (err) {
      setError('An unexpected server error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Abstract Background Orbs */}
      <div className="absolute top-0 left-0 -ml-20 -mt-20 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 -mr-20 -mb-20 w-[600px] h-[600px] bg-amber-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-8">
          {settings.logoUrl ? (
            <div className="relative group">
               <img 
                src={settings.logoUrl} 
                alt="KlenCare Logo" 
                className="h-24 w-auto object-contain brightness-110 drop-shadow-[0_15px_35px_rgba(251,175,15,0.3)] transition-transform group-hover:scale-105 duration-500" 
              />
              <div className="absolute -bottom-2 right-0 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-lg">
                <ShieldCheck size={10} className="text-emerald-500" />
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Encrypted</span>
              </div>
            </div>
          ) : (
            <div className="w-20 h-20 bg-[#fbaf0f] rounded-[28px] flex items-center justify-center font-black text-4xl text-slate-900 shadow-2xl shadow-amber-500/20">K</div>
          )}
        </div>
        <h2 className="text-center text-2xl font-black text-white tracking-tight">System Integrity Vault</h2>
        <p className="mt-2 text-center text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">
          KlenCare Enterprise CRM Gateway
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/50 backdrop-blur-2xl py-12 px-4 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] sm:rounded-[40px] sm:px-12 border border-white/5">
          <form className="space-y-8" onSubmit={handleSubmit}>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 mb-2">Access Username</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#fbaf0f] transition-colors">
                  <UserIcon size={20} />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none block w-full pl-12 pr-4 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-[#fbaf0f] text-sm font-bold transition-all"
                  placeholder="testadmin"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 mb-2">Security Passkey</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#fbaf0f] transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-12 pr-4 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-[#fbaf0f] text-sm font-bold transition-all"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3 text-red-400 text-xs font-bold animate-in shake duration-300">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-[0_20px_50px_rgba(251,175,15,0.2)] text-xs font-black uppercase tracking-[0.2em] text-slate-900 bg-[#fbaf0f] hover:bg-[#e59b00] focus:outline-none focus:ring-4 focus:ring-amber-500/20 transition-all active:scale-95 disabled:opacity-70 disabled:grayscale"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Authenticate Logic Gate'}
              </button>
            </div>
          </form>

          <div className="mt-10">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em]">
                <span className="px-4 bg-slate-900 text-slate-600">Secure Audit Active</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 flex flex-col items-center gap-2">
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
            &copy; 2024 KlenCare Technologies UAE
          </p>
          <div className="flex items-center gap-4">
             <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
             <span className="text-[8px] text-slate-700 font-black uppercase tracking-tighter">Production Environment 4.2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}