
import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Unauthorized() {
  const navigate = useNavigate();
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-6">
      <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-6 border-4 border-white shadow-xl">
        <ShieldAlert size={48} />
      </div>
      <h1 className="text-4xl font-black text-slate-900 mb-2">Access Denied</h1>
      <p className="text-slate-500 max-w-md mb-8">
        Your account doesn't have the necessary permissions to access this module. 
        Please contact your administrator if you believe this is an error.
      </p>
      <button 
        onClick={() => navigate('/')}
        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
      >
        <ArrowLeft size={18} />
        Back to Dashboard
      </button>
    </div>
  );
}
