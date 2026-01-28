
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { appwriteService, normalizeString } from '../services/appwriteService';
import { CommunityContribution, ADMIN_EMAILS } from '../types';
import { 
  Upload, FileText, Download, CheckCircle, Clock, XCircle, 
  Search, Shield, AlertTriangle, X, Loader, Plus, Filter,
  FileSpreadsheet, Image as ImageIcon, FileBox, ExternalLink,
  ChevronRight, Trash2, Eye, HardDrive, Info, Lock
} from 'lucide-react';

export const CommunityContributions: React.FC = () => {
  const { user } = useAuth();
  const [contributions, setContributions] = useState<CommunityContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [areaFilter, setAreaFilter] = useState('all');

  const isAdmin = user?.role === 'admin' || (user?.email && ADMIN_EMAILS.some(e => e.toLowerCase() === user.email.toLowerCase()));

  useEffect(() => {
    if (user) {
        setSelectedArea(user.area);
        loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    const data = await appwriteService.getCommunityContributions(user.allowedAreas, !!isAdmin);
    setContributions(data);
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const ext = file.name.split('.').pop()?.toLowerCase();
        const allowed = ['pdf', 'xlsx', 'xls', 'docx', 'doc', 'png', 'jpg', 'jpeg'];
        if (!allowed.includes(ext || '')) {
            alert("Extensión de archivo no permitida. Solo PDF, Excel, Word e Imágenes.");
            e.target.value = '';
            return;
        }
        setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFile || !title.trim()) return;

    setUploading(true);
    try {
        const fileUrl = await appwriteService.uploadCommunityFile(selectedFile);
        if (!fileUrl) throw new Error("Error subiendo archivo");

        const ext = selectedFile.name.split('.').pop()?.toLowerCase();
        let fileType: any = 'pdf';
        if (['xlsx', 'xls'].includes(ext || '')) fileType = 'excel';
        else if (['docx', 'doc'].includes(ext || '')) fileType = 'word';
        else if (['png', 'jpg', 'jpeg'].includes(ext || '')) fileType = 'image';

        const success = await appwriteService.createCommunityContribution({
            user_id: user.$id,
            user_name: user.name,
            title: title.trim(),
            description: description.trim(),
            file_url: fileUrl,
            file_type: fileType,
            area: selectedArea,
        });

        if (success) {
            setShowUploadModal(false);
            setTitle('');
            setDescription('');
            setSelectedFile(null);
            loadData();
        } else {
            alert("Error al registrar la aportación.");
        }
    } catch (e) {
        alert("Ocurrió un error inesperado.");
    } finally {
        setUploading(false);
    }
  };

  const handleModeration = async (id: string, status: 'approved' | 'rejected') => {
      const success = await appwriteService.adminUpdateContributionStatus(id, status);
      if (success) {
          loadData();
      }
  };

  const handleDelete = async (id: string) => {
      if (window.confirm("¿Estás seguro de eliminar este aporte permanentemente?")) {
          const success = await appwriteService.adminDeleteContribution(id);
          if (success) loadData();
      }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
        case 'excel': return <FileSpreadsheet className="text-emerald-500" size={32} />;
        case 'word': return <FileText className="text-blue-500" size={32} />;
        case 'image': return <ImageIcon className="text-purple-500" size={32} />;
        default: return <FileText className="text-red-500" size={32} />;
    }
  };

  const filtered = contributions.filter(c => {
      const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.user_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesArea = areaFilter === 'all' ? true : normalizeString(c.area) === normalizeString(areaFilter);
      return matchesSearch && matchesArea;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
          <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-900/30 rounded-2xl text-indigo-400 border border-indigo-500/20">
                  <HardDrive size={32} />
              </div>
              <div>
                  <h1 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">Repositorio Comunitario</h1>
                  <p className="text-gray-400 text-sm mt-1 uppercase tracking-widest font-bold">Aportaciones Operativas de Colaboradores</p>
              </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
              <button 
                onClick={() => setShowUploadModal(true)}
                className="flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-950/40"
              >
                  <Plus size={18} className="mr-2" />
                  Nueva Aportación
              </button>
          </div>
      </div>

      {/* PRIVACY INDICATOR BANNER */}
      {!isAdmin && (
        <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-2xl p-4 flex items-center gap-3 shadow-inner">
            <Lock size={18} className="text-indigo-400 shrink-0" />
            <p className="text-xs font-bold text-indigo-300 uppercase tracking-wide">
                Modo Privacidad Activo: Estás visualizando aportes exclusivos de tus áreas autorizadas ({user?.allowedAreas.join(', ')}).
            </p>
        </div>
      )}

      {/* FILTER BAR */}
      <div className="flex flex-col md:flex-row gap-4 bg-slate-900/50 p-4 rounded-2xl border border-white/5">
          <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="text" 
                placeholder="Buscar archivos, autores o descripciones..."
                className="w-full bg-slate-800 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
          <div className="flex gap-2">
              <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                  <select 
                    value={areaFilter}
                    onChange={(e) => setAreaFilter(e.target.value)}
                    className="bg-slate-800 border border-white/10 rounded-xl py-3 pl-10 pr-8 text-xs font-bold text-gray-300 uppercase outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                  >
                      <option value="all">TODAS MIS ÁREAS</option>
                      {user?.allowedAreas.map(a => <option key={a} value={a}>{a.toUpperCase()}</option>)}
                  </select>
              </div>
              <button onClick={loadData} className="p-3 bg-slate-800 text-gray-400 hover:text-white rounded-xl border border-white/10 transition-colors">
                  <Loader size={18} className={loading ? 'animate-spin' : ''} />
              </button>
          </div>
      </div>

      {/* CONTENT GRID */}
      {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
              <Loader className="animate-spin text-indigo-500 mb-4" size={48} />
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Sincronizando archivos del área...</p>
          </div>
      ) : filtered.length === 0 ? (
          <div className="text-center py-40 bg-slate-900 rounded-[2.5rem] border border-dashed border-white/10">
              <FileBox size={80} className="mx-auto text-slate-800 mb-6" />
              <p className="text-gray-400 font-bold text-lg uppercase tracking-tight">Sin archivos registrados</p>
              <p className="text-gray-600 text-sm mt-2 max-w-sm mx-auto uppercase tracking-tighter">Comparte formatos o documentos que ayuden a la operación de tu departamento.</p>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((item) => (
                  <div key={item.id} className="bg-slate-900 rounded-3xl border border-white/10 overflow-hidden shadow-xl hover:border-indigo-500/30 transition-all group flex flex-col h-full">
                      {/* Badge de Estado para Admin */}
                      {isAdmin && (
                          <div className={`px-4 py-1 text-[9px] font-black uppercase text-center border-b border-white/5 ${
                              item.status === 'pending' ? 'bg-amber-900/30 text-amber-400' : 
                              item.status === 'approved' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'
                          }`}>
                              {item.status === 'pending' ? 'En Revisión de Gerencia' : 
                               item.status === 'approved' ? '✓ Publicado en Repositorio' : '✘ Aporte Denegado'}
                          </div>
                      )}

                      <div className="p-6 flex-1">
                          <div className="flex justify-between items-start mb-4">
                              <div className="p-3 bg-slate-950 rounded-2xl border border-white/5 shadow-inner">
                                  {getFileIcon(item.file_type)}
                              </div>
                              <span className="text-[9px] font-black bg-indigo-900/20 text-indigo-400 px-2 py-1 rounded border border-indigo-500/20 uppercase tracking-tighter">
                                  {item.area}
                              </span>
                          </div>

                          <h3 className="text-lg font-bold text-white mb-2 leading-tight uppercase line-clamp-1">{item.title}</h3>
                          <p className="text-xs text-gray-400 mb-6 line-clamp-3 leading-relaxed italic">
                              "{item.description || 'Sin descripción adicional.'}"
                          </p>

                          <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[10px] text-indigo-300">
                                  {item.user_name.charAt(0)}
                              </div>
                              <div>
                                  <p className="text-[10px] font-black text-gray-200 uppercase">{item.user_name}</p>
                                  <p className="text-[9px] text-gray-600 font-mono uppercase">{new Date(item.created_at).toLocaleDateString()}</p>
                              </div>
                          </div>
                      </div>

                      {/* ACTIONS */}
                      <div className="p-4 bg-slate-950/50 border-t border-white/10 flex items-center justify-between gap-3">
                          <div className="flex gap-2">
                             <a 
                                href={item.file_url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-sm"
                             >
                                <Download size={14} className="mr-1.5" />
                                Descargar
                             </a>
                          </div>

                          {isAdmin && (
                              <div className="flex gap-2">
                                  {item.status === 'pending' && (
                                      <>
                                        <button 
                                            onClick={() => handleModeration(item.id, 'approved')}
                                            className="p-2 bg-emerald-900/20 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-xl border border-emerald-500/30 transition-all"
                                            title="Aprobar"
                                        >
                                            <CheckCircle size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleModeration(item.id, 'rejected')}
                                            className="p-2 bg-red-900/20 text-red-400 hover:bg-red-600 hover:text-white rounded-xl border border-red-500/30 transition-all"
                                            title="Rechazar"
                                        >
                                            <XCircle size={16} />
                                        </button>
                                      </>
                                  )}
                                  <button 
                                    onClick={() => handleDelete(item.id)}
                                    className="p-2 bg-slate-800 text-gray-500 hover:bg-red-600 hover:text-white rounded-xl border border-white/5 transition-all"
                                    title="Eliminar permanentemente"
                                  >
                                      <Trash2 size={16} />
                                  </button>
                              </div>
                          )}
                      </div>
                  </div>
              ))}
          </div>
      )}

      {/* UPLOAD MODAL */}
      {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
              <div className="bg-slate-900 w-full max-w-xl rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in duration-200">
                  
                  <div className="p-8 border-b border-white/5 flex justify-between items-center bg-indigo-950/10">
                      <div>
                          <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Nueva Aportación</h3>
                          <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest mt-1">Colaboración Operativa CODEX</p>
                      </div>
                      <button onClick={() => setShowUploadModal(false)} className="text-gray-500 hover:text-white p-2">
                          <X size={28} />
                      </button>
                  </div>

                  <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
                      
                      {/* AREA SELECT */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Área Propietaria</label>
                            <select 
                                value={selectedArea}
                                onChange={(e) => setSelectedArea(e.target.value)}
                                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {user?.allowedAreas.map(a => <option key={a} value={a}>{a.toUpperCase()}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Nombre del Archivo / Dato</label>
                            <input 
                                type="text"
                                required
                                placeholder="Ej. Formato de Inventario Semanal"
                                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>
                      </div>

                      <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Descripción y Comentarios</label>
                          <textarea 
                             required
                             placeholder="Explica por qué este documento es importante o cómo se debe utilizar..."
                             className="w-full bg-slate-800 border border-white/10 rounded-xl p-4 text-sm text-white h-28 resize-none outline-none focus:ring-1 focus:ring-indigo-500"
                             value={description}
                             onChange={(e) => setDescription(e.target.value)}
                          />
                      </div>

                      {/* FILE UPLOAD ZONE */}
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-[2rem] p-10 text-center cursor-pointer transition-all ${
                            selectedFile 
                            ? 'border-emerald-500/50 bg-emerald-950/10' 
                            : 'border-white/10 bg-slate-950/40 hover:border-indigo-500/50 hover:bg-indigo-950/10'
                        }`}
                      >
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            onChange={handleFileChange}
                            accept=".pdf,.xlsx,.xls,.docx,.doc,.png,.jpg,.jpeg"
                          />
                          
                          {selectedFile ? (
                              <div className="animate-in fade-in zoom-in duration-300">
                                  <div className="bg-emerald-900/30 p-4 rounded-full w-fit mx-auto mb-4 border border-emerald-500/20">
                                      <CheckCircle className="text-emerald-500" size={40} />
                                  </div>
                                  <p className="text-white font-bold text-sm uppercase">{selectedFile.name}</p>
                                  <p className="text-emerald-500 text-[10px] font-black mt-1 uppercase tracking-widest">Archivo Listo para Cargar</p>
                              </div>
                          ) : (
                              <>
                                  <div className="bg-indigo-900/20 p-4 rounded-full w-fit mx-auto mb-4 border border-indigo-500/20">
                                      <Upload className="text-indigo-500" size={40} />
                                  </div>
                                  <p className="text-gray-300 font-bold text-sm uppercase">Selecciona el Archivo</p>
                                  <p className="text-gray-600 text-[10px] mt-2 font-bold uppercase tracking-tighter">
                                      PDF, Excel, Word o Imágenes (Máx 20MB)
                                  </p>
                              </>
                          )}
                      </div>

                      <div className="bg-amber-900/10 border border-amber-500/20 p-4 rounded-2xl flex gap-3">
                          <Info size={20} className="text-amber-500 shrink-0" />
                          <p className="text-[10px] text-amber-200/60 uppercase font-bold tracking-tight leading-relaxed">
                              Al subir este archivo, declaras que su contenido es verídico y de naturaleza estrictamente laboral. 
                              El aporte pasará por una validación de gerencia antes de ser público.
                          </p>
                      </div>

                      <button 
                         type="submit"
                         disabled={uploading || !selectedFile || !title.trim()}
                         className={`w-full py-4 rounded-2xl text-sm font-black uppercase tracking-[0.2em] transition-all shadow-xl ${
                            uploading || !selectedFile || !title.trim() 
                            ? 'bg-slate-800 text-gray-500 cursor-not-allowed' 
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950/40'
                         }`}
                      >
                          {uploading ? (
                              <div className="flex items-center justify-center">
                                  <Loader className="animate-spin mr-3" size={18} />
                                  Procesando Cripto-Carga...
                              </div>
                          ) : 'Finalizar y Enviar Aporte'}
                      </button>
                  </form>
              </div>
          </div>
      )}

    </div>
  );
};
