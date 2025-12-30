
import React, { useState } from 'react';
import { 
  FileText, Search, Plus, Filter, 
  Trash2, Download, MoreVertical, Grid, List as ListIcon,
  Folder, Tag, Share2, File
} from 'lucide-react';
import { documentService } from '../services/document.service';
import { useAuth } from '../App';
import { AppDocument } from '../types';

export default function Documents() {
  const { user, can } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [docs, setDocs] = useState<AppDocument[]>(documentService.getDocuments());

  const filteredDocs = docs.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  const handleDelete = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    documentService.deleteDocument(id, user!);
    setDocs(documentService.getDocuments());
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      await documentService.uploadDocument(e.target.files[0], [], user!);
      setDocs(documentService.getDocuments());
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Document Management</h1>
          <p className="text-slate-500 text-sm">Securely store and link files across the organization.</p>
        </div>
        <label className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-sm shadow-xl active:scale-95 transition-all cursor-pointer">
          <Plus size={18} />
          Upload New File
          <input type="file" className="hidden" onChange={handleUpload} />
        </label>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search documents by name or tag..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl w-full outline-none text-sm bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-200 p-1 rounded-lg mr-2">
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}><Grid size={16} /></button>
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}><ListIcon size={16} /></button>
            </div>
            <button className="flex items-center gap-2 px-3 py-1.5 text-slate-600 border border-slate-200 rounded-lg text-xs font-bold bg-white"><Filter size={14} /> Filter</button>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredDocs.map(doc => (
              <div key={doc.id} className="group relative bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-lg hover:border-blue-200 transition-all">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${doc.type.includes('pdf') ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                    {doc.type.includes('pdf') ? <FileText size={32} /> : <File size={32} />}
                  </div>
                  <div className="w-full">
                    <p className="text-xs font-bold text-slate-900 truncate" title={doc.name}>{doc.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase mt-1">{(doc.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-center gap-1 mt-4 pt-4 border-t border-slate-50">
                  <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Download size={14} /></button>
                  <button className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"><Share2 size={14} /></button>
                  {can('documents.manage') && (
                    <button onClick={() => handleDelete(doc.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
                  )}
                </div>

                {doc.links.length > 0 && (
                  <div className="absolute top-2 right-2 flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500" title="Linked Record"></span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">File Name</th>
                  <th className="px-6 py-4">Size</th>
                  <th className="px-6 py-4">Uploaded At</th>
                  <th className="px-6 py-4">Linked To</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText size={18} className="text-slate-400" />
                        <span className="text-sm font-bold text-slate-800">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">{(doc.size / 1024).toFixed(1)} KB</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{new Date(doc.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      {doc.links.map((l, i) => (
                        <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold mr-1">{l.entityType}: {l.entityId}</span>
                      ))}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button onClick={() => handleDelete(doc.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
