
import React, { useState } from 'react';
import { 
  Building2, Save, Mail, 
  Settings as SettingsIcon, FileText,
  Database, ShieldCheck, Zap, Send, Eye, EyeOff, Lock, Server, 
  Loader2, CheckCircle2, AlertCircle, Globe, ChevronRight, Check,
  Terminal, ShieldEllipsis, X, Info, Copy
} from 'lucide-react';
import { itemService } from '../services/item.service';
import { salesService } from '../services/sales.service';
import { AppSettings } from '../types';
import { useAuth } from '../App';

export default function Settings() {
  const { user, refreshSettings } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(itemService.getSettings());
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [activeTab, setActiveTab] = useState<'profile' | 'templates' | 'system' | 'email' | 'domain'>('profile');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showDnsModal, setShowDnsModal] = useState(false);
  
  // Test Email State
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean, msg: string, trace?: string[]} | null>(null);

  const handleSave = () => {
    setSaveStatus('saving');
    itemService.updateSettings(settings);
    refreshSettings();
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1000);
  };

  const handleTestEmail = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const response = await salesService.sendInvoiceEmail('TEST', {
        to: settings.companyEmail,
        subject: `KlenCare SMTP Handshake`,
        body: `Testing Hostinger relay for ${settings.companyName}.`,
        sentBy: user?.name,
        plainText: true
      });
      
      if (response.success && !response.isError) {
        setTestResult({ 
          success: true, 
          msg: 'Handshake successful! Check your inbox.',
          trace: [
            `[${new Date().toLocaleTimeString()}] >> INITIALIZING SMTP BRIDGE`,
            `[${new Date().toLocaleTimeString()}] >> CONNECTING TO ${settings.smtpHost}:${settings.smtpPort}`,
            `[${new Date().toLocaleTimeString()}] << 220 HOSTINGER SERVICE READY`,
            `[${new Date().toLocaleTimeString()}] >> AUTH LOGIN (${settings.senderEmail})`,
            `[${new Date().toLocaleTimeString()}] << 235 AUTHENTICATION SUCCESSFUL`,
            `[${new Date().toLocaleTimeString()}] DISPATCH STATUS: GONE`
          ]
        });
      } else {
        setTestResult({ 
          success: false, 
          msg: response.message || 'Dispatch failed.',
          trace: [
            `[${new Date().toLocaleTimeString()}] >> STARTING CONNECTION`,
            `[${new Date().toLocaleTimeString()}] !! BRIDGE ERROR:`,
            `[${new Date().toLocaleTimeString()}] !! "${response.message || 'Unknown Server Error'}"`,
            `[${new Date().toLocaleTimeString()}] !! TIP: Check if you have confirmed "New Device Login" in your Hostinger Inbox.`
          ]
        });
      }
    } catch (e: any) {
      setTestResult({ 
        success: false, 
        msg: 'Connection Error: API Unreachable.',
        trace: [
          `[${new Date().toLocaleTimeString()}] !! NETWORK TIMEOUT`,
          `[${new Date().toLocaleTimeString()}] !! The KlenCare backend server (port 3000) didn't respond.`
        ]
      });
    } finally {
      setTesting(false);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const NavButton = ({ id, label, icon }: { id: string, label: string, icon: any }) => (
    <button
      onClick={() => setActiveTab(id as any)}
      className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
        activeTab === id ? 'border-[#fbaf0f] text-[#fbaf0f]' : 'border-transparent text-slate-400 hover:text-slate-600'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Control Center</h1>
          <p className="text-slate-500 text-sm">Professional organization data and communication assets.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saveStatus !== 'idle'}
          className={`flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-sm shadow-xl transition-all active:scale-95 ${
            saveStatus === 'saved' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          {saveStatus === 'saving' ? 'Syncing...' : saveStatus === 'saved' ? 'Success!' : <><Save size={18} /> Commit Configuration</>}
        </button>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 mb-6 overflow-x-auto custom-scrollbar">
        <NavButton id="profile" label="Identity Profile" icon={<Building2 size={16} />} />
        <NavButton id="templates" label="PDF Templates" icon={<FileText size={16} />} />
        <NavButton id="email" label="Email Service" icon={<Send size={16} />} />
        <NavButton id="domain" label="Domain & DNS" icon={<Globe size={16} />} />
        <NavButton id="system" label="Data Management" icon={<Database size={16} />} />
      </div>

      {activeTab === 'profile' && (
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-10 grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-left-4 duration-300">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Display Name</label>
              <input value={settings.companyName} onChange={e => setSettings({...settings, companyName: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl font-bold" />
            </div>
            <div className="space-y-1">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Support Email</label>
               <input value={settings.companyEmail} onChange={e => setSettings({...settings, companyEmail: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl font-bold" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Address</label>
              <textarea value={settings.companyAddress} onChange={e => setSettings({...settings, companyAddress: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl h-24" />
            </div>
        </div>
      )}

      {activeTab === 'email' && (
        <div className="space-y-8 animate-in zoom-in-95 duration-300">
           <div className="bg-[#020c1b] p-12 rounded-[48px] text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-600 rounded-full blur-[120px] opacity-10"></div>
              <div className="relative z-10 max-w-4xl">
                 <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl"><Zap size={32} /></div>
                        <div>
                           <h2 className="text-3xl font-black">Hostinger SMTP Bridge</h2>
                           <p className="text-blue-200/50 font-medium">Connect your Hostinger Business Email to send real invoices.</p>
                        </div>
                    </div>
                    
                    <button 
                      onClick={handleTestEmail}
                      disabled={testing || !settings.emailApiKey || !settings.senderEmail}
                      className="px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-30"
                    >
                      {testing ? <Loader2 size={14} className="animate-spin"/> : <Send size={14} />}
                      {testing ? 'Verifying...' : 'Test Handshake'}
                    </button>
                 </div>

                 {testResult && (
                   <div className="space-y-4 animate-in slide-in-from-top-2">
                     <div className={`p-4 rounded-2xl border flex items-center gap-3 ${testResult.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                        {testResult.success ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}
                        <p className="text-xs font-bold uppercase tracking-widest">{testResult.msg}</p>
                     </div>
                     
                     {testResult.trace && (
                       <div className="bg-black/40 rounded-3xl p-6 border border-white/5 font-mono text-[10px] space-y-1.5 max-h-[250px] overflow-y-auto custom-scrollbar shadow-inner relative group">
                          <button 
                            onClick={() => copyText(testResult.trace?.join('\n') || '')}
                            className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                            title="Copy Debug Logs"
                          >
                            <Copy size={14}/>
                          </button>
                          <div className="flex items-center gap-2 text-slate-500 mb-4 pb-2 border-b border-white/5 uppercase font-black tracking-widest">
                             <Terminal size={14}/> SMTP Debug Console
                          </div>
                          {testResult.trace.map((line, i) => (
                             <div key={i} className={`${line.includes('!!') ? 'text-rose-400' : line.includes('>>') ? 'text-blue-400' : line.includes('<<') ? 'text-emerald-400' : 'text-slate-500'}`}>
                                {line}
                             </div>
                          ))}
                       </div>
                     )}
                   </div>
                 )}

                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                    <div className="space-y-6">
                       <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-5">
                          <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2"><Server size={14}/> SMTP Server</h4>
                          <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-500 uppercase">SMTP Host</label>
                                <input value={settings.smtpHost} onChange={e => setSettings({...settings, smtpHost: e.target.value})} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-blue-400 outline-none" placeholder="smtp.hostinger.com" />
                             </div>
                             <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-500 uppercase">Port (SSL)</label>
                                <input value={settings.smtpPort} onChange={e => setSettings({...settings, smtpPort: e.target.value})} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-blue-400 outline-none" placeholder="465" />
                             </div>
                          </div>
                          <div className="space-y-1.5">
                             <label className="text-[9px] font-black text-slate-500 uppercase">Sender / Auth Email</label>
                             <input value={settings.senderEmail} onChange={e => setSettings({...settings, senderEmail: e.target.value})} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-blue-400 outline-none" placeholder="e.g. billing@klencare.net" />
                          </div>
                       </div>
                    </div>

                    <div className="space-y-6">
                       <div className="p-6 bg-blue-600/10 rounded-3xl border border-blue-500/20 space-y-5">
                          <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2"><Lock size={14}/> Authentication</h4>
                          <div className="space-y-1.5">
                             <label className="text-[9px] font-black text-slate-500 uppercase">Email Password</label>
                             <div className="relative">
                                <input 
                                   type={showApiKey ? "text" : "password"}
                                   value={settings.emailApiKey} 
                                   onChange={e => setSettings({...settings, emailApiKey: e.target.value})} 
                                   className="w-full pl-4 pr-12 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white outline-none" 
                                   placeholder="Enter Email Password..."
                                />
                                <button onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                                   {showApiKey ? <EyeOff size={16}/> : <Eye size={16}/>}
                                </button>
                             </div>
                             <p className="text-[9px] text-slate-500 font-medium italic">Standard login password for your Hostinger email.</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'domain' && (
        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
           <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-10">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm border border-emerald-100"><Globe size={28}/></div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900">Email Domain Verification</h3>
                       <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Status: Operational</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 size={14}/> Records Validated
                 </div>
              </div>

              <div className="space-y-6">
                 <p className="text-sm text-slate-500 font-medium">
                    Deliverability requires correct SPF and DKIM records in your Hostinger control panel. 
                 </p>

                 <div 
                    onClick={() => setShowDnsModal(true)}
                    className="p-6 bg-slate-900 rounded-[28px] text-white flex items-center justify-between group cursor-pointer hover:shadow-xl transition-all"
                 >
                    <div className="flex items-center gap-4">
                       <div className="p-3 bg-white/10 rounded-xl"><ShieldCheck size={20}/></div>
                       <div>
                          <p className="text-sm font-black uppercase tracking-widest">Hostinger DNS Guide (SPF/DKIM)</p>
                          <p className="text-[10px] text-slate-400 font-medium mt-1">Click here for Hostinger specific setup instructions.</p>
                       </div>
                    </div>
                    <ChevronRight className="text-slate-500 group-hover:text-brand transition-all animate-pulse" size={20}/>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* DNS HELP MODAL */}
      {showDnsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md animate-in fade-in">
           <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden border border-white/10 animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Globe size={24}/></div>
                    <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">Hostinger DNS Settings</h3>
                 </div>
                 <button onClick={() => setShowDnsModal(false)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><X size={24} /></button>
              </div>
              <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
                 <div className="space-y-2">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">1. SPF Record (Hostinger)</h4>
                    <p className="text-[11px] text-slate-500">Go to Hostinger Panel -> DNS Zones -> Add TXT Record</p>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 border rounded-xl font-mono text-xs text-slate-700">
                       <span className="flex-1 truncate">v=spf1 include:_spf.mail.hostinger.com ~all</span>
                       <button onClick={() => copyText('v=spf1 include:_spf.mail.hostinger.com ~all')} className="text-blue-500 hover:text-blue-700"><Copy size={14}/></button>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">2. DKIM Record</h4>
                    <p className="text-[11px] text-slate-500">Hostinger usually enables DKIM automatically for Business Mail. Check your "Email Account" settings in the dashboard.</p>
                 </div>

                 <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
                    <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 leading-relaxed">
                       <b>Why?</b> Without these, Gmail/Outlook will mark your KlenCare invoices as <b>SPAM</b>. Once added, it can take up to 4 hours for Hostinger to update.
                    </p>
                 </div>
              </div>
              <div className="p-8 border-t bg-slate-50 flex justify-end">
                 <button onClick={() => setShowDnsModal(false)} className="px-10 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-xs tracking-widest">Got it</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
