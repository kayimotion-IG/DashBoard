import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Trash2, ShieldCheck, Key, Copy, CheckCircle2, UserPlus, X, Loader2, ShieldAlert, Lock } from 'lucide-react';
import { apiRequest } from '../../services/api';

export default function TeamAccess() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [lastCreated, setLastCreated] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'Staff'
  });

  const fetchUsers = async () => {
    try {
      const data = await apiRequest('GET', '/api/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password || !formData.name) {
      alert("Please fill in Name, User ID, and Password.");
      return;
    }

    try {
      // POSTing to API - Mock layer updated to accept manual passwords
      const res = await apiRequest('POST', '/api/users', formData);
      setLastCreated({
        name: formData.name,
        username: formData.username,
        password: formData.password,
        role: formData.role
      });
      fetchUsers();
      setShowModal(false);
      setFormData({ name: '', username: '', password: '', role: 'Staff' });
    } catch (err: any) {
      alert(err.message || "Failed to create user. User ID might already exist.");
    }
  };

  const deleteUser = async (id: number, name: string) => {
    if (!confirm(`Revoke all access for ${name}? This action is permanent.`)) return;
    try {
      await apiRequest('DELETE', `/api/users/${id}`);
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <ShieldCheck className="text-[#fbaf0f]" size={32} />
            Organization Access
          </h1>
          <p className="text-slate-500 font-medium mt-1">Generate manual User IDs and Passwords for your team members.</p>
        </div>
        <button 
          onClick={() => { setLastCreated(null); setShowModal(true); }}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-[#fbaf0f] text-slate-900 rounded-[22px] font-black uppercase text-xs tracking-widest shadow-[0_15px_30px_-5px_rgba(251,175,15,0.3)] hover:bg-[#e59b00] transition-all active:scale-95 group"
        >
          <UserPlus size={20} className="group-hover:rotate-12 transition-transform" />
          Create New Login
        </button>
      </div>

      {lastCreated && (
        <div className="bg-slate-900 border-2 border-[#fbaf0f]/30 p-10 rounded-[40px] shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-[#fbaf0f] rounded-full blur-[120px] opacity-10"></div>
           
           <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-[#fbaf0f] text-slate-900 rounded-[24px] flex items-center justify-center shadow-xl">
                   <CheckCircle2 size={32} />
                 </div>
                 <div>
                   <h3 className="text-xl font-black text-white">Login Successfully Provisioned</h3>
                   <p className="text-slate-400 font-medium">Account for <span className="text-[#fbaf0f] font-bold">{lastCreated.name}</span> is now active.</p>
                 </div>
              </div>
              
              <div className="flex flex-wrap gap-4 w-full md:w-auto">
                 <div className="bg-slate-800/50 backdrop-blur px-6 py-4 rounded-2xl border border-white/5 flex-1 md:flex-none min-w-[180px]">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">User ID (Username)</p>
                    <div className="flex items-center justify-between gap-4">
                       <span className="text-white font-mono font-bold">{lastCreated.username}</span>
                       <button onClick={() => copyToClipboard(lastCreated.username)} className="text-slate-500 hover:text-[#fbaf0f] transition-colors"><Copy size={16}/></button>
                    </div>
                 </div>
                 <div className="bg-slate-800/50 backdrop-blur px-6 py-4 rounded-2xl border border-white/5 flex-1 md:flex-none min-w-[180px]">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Security Password</p>
                    <div className="flex items-center justify-between gap-4">
                       <span className="text-[#fbaf0f] font-mono font-black text-lg tracking-wider">{lastCreated.password}</span>
                       <button onClick={() => copyToClipboard(lastCreated.password)} className="text-slate-500 hover:text-[#fbaf0f] transition-colors"><Copy size={16}/></button>
                    </div>
                 </div>
              </div>
              
              <button onClick={() => setLastCreated(null)} className="p-2 text-slate-500 hover:text-white transition-colors absolute top-4 right-4"><X size={20} /></button>
           </div>
           
           <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-2">
              <ShieldAlert size={14} className="text-amber-500" />
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Share these credentials securely. For privacy, this record clears on refresh.</p>
           </div>
        </div>
      )}

      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Member Name</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">User ID</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Access Level</th>
                <th className="px-10 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="py-24 text-center"><Loader2 className="animate-spin mx-auto text-[#fbaf0f]" size={40}/></td></tr>
              ) : users.length === 0 ? (
                 <tr><td colSpan={4} className="py-24 text-center text-slate-400 italic font-medium text-sm">No team members registered.</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-white border-2 border-slate-100 rounded-[20px] flex items-center justify-center font-black text-slate-400 text-lg group-hover:border-[#fbaf0f]/30 group-hover:text-[#fbaf0f] transition-all shadow-sm">
                        {u.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-base font-bold text-slate-900">{u.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Created {new Date(u.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-7">
                    <span className="font-mono text-xs font-black text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">@{u.username}</span>
                  </td>
                  <td className="px-6 py-7">
                    <div className="flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${u.role === 'Admin' ? 'bg-[#fbaf0f]' : 'bg-blue-500'}`}></div>
                       <span className={`text-[10px] font-black uppercase tracking-widest ${u.role === 'Admin' ? 'text-slate-900' : 'text-slate-600'}`}>{u.role}</span>
                    </div>
                  </td>
                  <td className="px-10 py-7 text-right">
                    {u.username !== 'admin' && (
                      <button onClick={() => deleteUser(u.id, u.name)} className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all active:scale-90" title="Delete Account">
                        <Trash2 size={22} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
           <div className="bg-white w-full max-w-xl rounded-[48px] shadow-2xl overflow-hidden border border-white/10 animate-in zoom-in-95 duration-300">
              <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <div className="flex items-center gap-5">
                    <div className="p-4 bg-amber-50 text-[#fbaf0f] rounded-[24px] shadow-sm border border-amber-100"><UserPlus size={28}/></div>
                    <div>
                       <h3 className="font-black text-slate-900 uppercase tracking-[0.1em] text-lg">Define New Member</h3>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Manual Credential Provisioning</p>
                    </div>
                 </div>
                 <button onClick={() => setShowModal(false)} className="p-3 text-slate-400 hover:text-rose-500 bg-white rounded-2xl shadow-sm transition-colors"><X size={24} /></button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-10 space-y-8">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Full Member Name</label>
                    <input 
                      required 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-amber-50 focus:border-[#fbaf0f] text-sm font-bold transition-all" 
                      placeholder="e.g. Salim Al Hashimi" 
                    />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">User ID (Username)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">@</span>
                        <input 
                          required 
                          value={formData.username} 
                          onChange={e => setFormData({...formData, username: e.target.value.toLowerCase().replace(/\s/g, '')})} 
                          className="w-full pl-9 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-amber-50 focus:border-[#fbaf0f] text-sm font-bold font-mono" 
                          placeholder="salim2026" 
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Security Password</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#fbaf0f] transition-colors" size={18} />
                        <input 
                          required 
                          type="text"
                          value={formData.password} 
                          onChange={e => setFormData({...formData, password: e.target.value})} 
                          className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-amber-50 focus:border-[#fbaf0f] text-sm font-black tracking-widest font-mono" 
                          placeholder="KlenPass123" 
                        />
                      </div>
                    </div>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Organizational Role</label>
                    <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-amber-50 focus:border-[#fbaf0f] text-sm font-bold appearance-none">
                       <option value="Staff">Staff (Standard Access)</option>
                       <option value="SalesManager">Sales Manager</option>
                       <option value="PurchaseManager">Purchase Manager</option>
                       <option value="InventoryManager">Inventory Manager</option>
                       <option value="Finance">Finance / Accountant</option>
                    </select>
                 </div>

                 <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-3xl flex items-start gap-4">
                    <div className="p-2 bg-white rounded-xl shadow-sm text-blue-600"><Key size={20} /></div>
                    <p className="text-[10px] text-blue-700 leading-relaxed font-bold uppercase tracking-tight">
                      Credentials will be active immediately. You must manually share the password with the user as it is encrypted once saved.
                    </p>
                 </div>

                 <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:bg-slate-800 active:scale-95 transition-all">
                    Activate System Access
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}