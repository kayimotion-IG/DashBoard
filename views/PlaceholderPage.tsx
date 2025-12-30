
import React from 'react';
import { Construction, LayoutGrid, FileUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PlaceholderPage = ({ title }: { title: string }) => {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 max-w-2xl mx-auto py-20">
      <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center text-blue-600 mb-4 animate-pulse">
        <LayoutGrid size={40} />
      </div>
      <h1 className="text-3xl font-extrabold text-gray-900">{title}</h1>
      <p className="text-gray-500 text-lg">
        This section is currently being architected as part of the KlenCare Part 1 scaffold.
        The full CRUD logic, business services, and Prisma integrations will be active in Part 2.
      </p>

      {title.includes('Receives') && (
        <button 
          onClick={() => navigate('/purchases/receives/import')}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-sm shadow-xl active:scale-95 transition-all mt-4"
        >
          <FileUp size={18} />
          Import GRN (Bulk)
        </button>
      )}

      <div className="flex gap-4 pt-6">
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-sm font-bold border border-amber-100">
          <Construction size={18} />
          <span>Status: Under Construction</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 w-full mt-10">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-white rounded-xl border border-dashed border-gray-300 animate-pulse"></div>
        ))}
      </div>
    </div>
  );
};

export default PlaceholderPage;
