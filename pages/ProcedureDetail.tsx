
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { appwriteService } from '../services/appwriteService';
import { Procedure, DownloadRequest } from '../types';
import { 
  ArrowLeft, Video, Info, Calendar, User, History, 
  ExternalLink, FileText, Loader, Eye, Key, Clock, CheckCircle, Lock, XCircle, Edit3, Save, X
} from 'lucide-react';
import { FileViewerModal } from '../components/FileViewerModal';
import { useAuth } from '../context/AuthContext';

export const ProcedureDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [proc, setProc] = useState<Procedure | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'video'>('info');
  const [loading, setLoading] = useState(true);
  const [viewFile, setViewFile] = useState<{url: string, name: string} | null>(null);
  
  const [downloadReq, setDownloadReq] = useState<DownloadRequest | null>(null);
  const [requesting, setRequesting] = useState(false);

  // Edit Responsible State
  const [isEditingResp, setIsEditingResp] = useState(false);
  const [editedResp, setEditedResp] = useState('');
  const [updatingResp, setUpdatingResp] = useState(false);

  const isAdmin = user?.role === 'admin';

  // --- LOGGING SYSTEM (PROMISE REF PATTERN) ---
  const logPromiseRef = useRef<Promise<string | null>>(Promise.resolve(null));
  const startTimeRef = useRef<number>(Date.now());
  const hasLoggedRef = useRef<boolean>(false); 

  useEffect(() => {
    startTimeRef.current = Date.now();
    hasLoggedRef.current = false;
    logPromiseRef.current = Promise.resolve(null);
    
    let isMounted = true;

    if (id && user) {
      setLoading(true);
      
      Promise.all([
        appwriteService.getProcedureById(id),
        appwriteService.getDownloadStatus(user.$id, id)
      ]).then(([data, status]) => {
        if (!isMounted) return;
        setProc(data || null);
        setDownloadReq(status);
        if (data) setEditedResp(data.responsible || 'UAD');
        setLoading(false);

        if (data && !hasLoggedRef.current) {
            hasLoggedRef.current = true;
            logPromiseRef.current = appwriteService.logProcedureAccess(
                user.$id, 
                data.$id, 
                data.name, 
                data.area as string
            );
        }
      });
    }

    return () => {
        isMounted = false;
        const endTime = Date.now();
        const duration = Math.floor((endTime - startTimeRef.current) / 1000);

        logPromiseRef.current.then(logId => {
            if (logId && duration > 0) {
                appwriteService.updateAccessDuration(logId, duration);
            }
        });
    };
  }, [id, user]);

  const handleRequestDownload = async () => {
    if (!proc || !user) return;
    setRequesting(true);
    const success = await appwriteService.requestDownload(user.$id, proc.$id, proc.name);
    if (success) {
      const status = await appwriteService.getDownloadStatus(user.$id, proc.$id);
      setDownloadReq(status);
    } else {
      alert("No se pudo procesar la solicitud. Intente más tarde.");
    }
    setRequesting(false);
  };

  const handleSaveResponsible = async () => {
      if (!proc || !editedResp.trim()) return;
      setUpdatingResp(true);
      const success = await appwriteService.updateProcedureResponsible(proc.$id, editedResp.trim());
      if (success) {
          setProc(prev => prev ? { ...prev, responsible: editedResp.trim() } : null);
          setIsEditingResp(false);
      } else {
          alert("Error al actualizar el responsable. Verifica permisos.");
      }
      setUpdatingResp(false);
  };

  const handleDownloadClick = async () => {
    if (!downloadReq || !proc?.attachmentUrl) return;
    try {
      const cleanUrl = proc.attachmentUrl.split('?')[0]; 
      const urlParts = cleanUrl.split('/');
      let fileName = decodeURIComponent(urlParts[urlParts.length - 1]);
      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}-/;
      fileName = fileName.replace(uuidRegex, '');

      const response = await fetch(proc.attachmentUrl);
      if (!response.ok) throw new Error(`Error red: ${response.status}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName; 
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      window.open(proc.attachmentUrl, '_blank', 'noopener,noreferrer');
    }
    await appwriteService.consumeDownloadToken(downloadReq.id);
    setDownloadReq(null); 
  };

  const renderDownloadButton = () => {
    if (!downloadReq) {
      return (
        <button 
          onClick={handleRequestDownload}
          disabled={requesting}
          className="flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-500 rounded-lg font-bold text-sm transition-colors shadow-sm disabled:opacity-50 border border-amber-500/20"
          title="Solicitar permiso para descargar original"
        >
          {requesting ? <Loader size={16} className="animate-spin mr-2" /> : <Key size={16} className="mr-2" />}
          Solicitar Original
        </button>
      );
    }

    if (downloadReq.status === 'pending') {
      return (
        <button 
          disabled
          className="flex items-center px-4 py-2 bg-amber-900/20 text-amber-500 border border-amber-500/30 rounded-lg font-bold text-sm cursor-not-allowed"
          title="Esperando autorización de un administrador"
        >
          <Clock size={16} className="mr-2" />
          En Revisión...
        </button>
      );
    }

    if (downloadReq.status === 'approved') {
      return (
        <button 
          onClick={handleDownloadClick}
          className="flex items-center px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold text-sm transition-all shadow-md animate-pulse border border-emerald-500"
          title="Autorizado: Clic para descargar (1 solo uso)"
        >
          <CheckCircle size={16} className="mr-2" />
          Descargar (1 uso)
        </button>
      );
    }

    if (downloadReq.status === 'rejected') {
       return (
        <div className="flex items-center space-x-2">
           <span className="text-xs text-red-400 font-bold flex items-center px-2 py-1 bg-red-900/20 rounded border border-red-500/30">
              <XCircle size={12} className="mr-1"/> Denegado
           </span>
           <button 
             onClick={handleRequestDownload} 
             disabled={requesting}
             className="text-xs text-indigo-400 underline hover:text-indigo-300"
           >
             Reintentar
           </button>
        </div>
       );
    }
    return null;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#020617] text-gray-400"><Loader className="animate-spin text-indigo-500 mr-2" /> Cargando procedimiento...</div>;
  if (!proc) return <div className="p-8 text-center text-white">Procedimiento no encontrado o sin acceso.</div>;

  return (
    <div className="space-y-6">
      <Link to="/catalog" className="inline-flex items-center text-gray-400 hover:text-indigo-400 transition-colors font-medium">
        <ArrowLeft size={16} className="mr-2" />
        Volver al Catálogo
      </Link>

      <div className="bg-slate-900 rounded-xl shadow-sm border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-white/10 bg-slate-950/30">
          <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className="font-mono text-xs font-bold text-indigo-300 bg-indigo-900/30 px-2 py-1 rounded border border-indigo-500/30">{proc.code}</span>
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Versión {proc.version}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">{proc.name}</h1>
              <p className="text-sm font-bold text-indigo-400 mt-2 uppercase flex items-center">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></span>
                  {proc.area}
              </p>
            </div>
            
            <div className="flex flex-col items-end gap-2">
                <div className={`px-4 py-1.5 rounded-full text-sm font-bold border ${proc.status === 'Vigente' ? 'bg-emerald-900/30 border-emerald-500/30 text-emerald-400' : 'bg-amber-900/30 border-amber-500/30 text-amber-400'}`}>
                  {proc.status}
                </div>
                
                {proc.attachmentUrl && proc.attachmentUrl !== '#' && (
                  <div className="flex space-x-2 mt-2 items-center">
                     <button
                        onClick={() => setViewFile({ url: proc.attachmentUrl!, name: proc.name })}
                        className="flex items-center px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg font-bold text-sm transition-colors shadow-sm border border-indigo-500"
                     >
                        <Eye size={16} className="mr-2" />
                        Previsualizar
                     </button>
                     {renderDownloadButton()}
                  </div>
                )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-6 mt-6 text-sm text-gray-500 items-center">
            <div className="flex items-center">
              <Calendar size={16} className="mr-2 text-indigo-400" />
              Actualizado: {new Date(proc.updatedAt).toLocaleDateString()}
            </div>
            
            {/* Responsible Section with Edit capability for Admins */}
            <div className="flex items-center group/resp">
              <User size={16} className="mr-2 text-indigo-400" />
              <span className="mr-2">Responsable:</span>
              
              {isEditingResp ? (
                  <div className="flex items-center space-x-2 animate-in fade-in duration-200">
                      <input 
                        type="text" 
                        value={editedResp} 
                        onChange={e => setEditedResp(e.target.value)}
                        className="bg-slate-800 border border-indigo-500/50 rounded px-2 py-1 text-white text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                        autoFocus
                      />
                      <button 
                        onClick={handleSaveResponsible} 
                        disabled={updatingResp}
                        className="p-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-500 transition-colors"
                        title="Guardar"
                      >
                          {updatingResp ? <Loader size={12} className="animate-spin" /> : <Save size={12} />}
                      </button>
                      <button 
                        onClick={() => { setIsEditingResp(false); setEditedResp(proc.responsible || 'UAD'); }} 
                        className="p-1.5 bg-slate-700 text-gray-300 rounded hover:bg-slate-600 transition-colors"
                        title="Cancelar"
                      >
                          <X size={12} />
                      </button>
                  </div>
              ) : (
                  <div className="flex items-center">
                    <span className="font-bold text-gray-200 uppercase">{proc.responsible || 'UAD'}</span>
                    {isAdmin && (
                        <button 
                          onClick={() => setIsEditingResp(true)}
                          className="ml-2 p-1 text-gray-600 hover:text-indigo-400 opacity-0 group-hover/resp:opacity-100 transition-all"
                          title="Editar responsable"
                        >
                            <Edit3 size={14} />
                        </button>
                    )}
                  </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 bg-slate-900 sticky top-0 z-10 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('info')}
            className={`flex items-center px-6 py-4 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'info' ? 'border-indigo-500 text-indigo-300 bg-white/5' : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
          >
            <Info size={18} className="mr-2" />
            Detalles Generales
          </button>
          
          {proc.urlVideo && (
            <button 
              onClick={() => setActiveTab('video')}
              className={`flex items-center px-6 py-4 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'video' ? 'border-indigo-500 text-indigo-300 bg-white/5' : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
            >
              <Video size={18} className="mr-2" />
              Video Tutorial
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 min-h-[400px]">
          {activeTab === 'info' && (
            <div className="max-w-4xl animate-in fade-in duration-300">
              <div 
                className="prose prose-invert prose-sm md:prose-base text-gray-300"
                dangerouslySetInnerHTML={{ __html: proc.description }}
              />
              
              <div className="mt-12 pt-8 border-t border-white/10">
                <h3 className="flex items-center font-bold text-gray-200 mb-4">
                  <History size={18} className="mr-2 text-indigo-400" /> Historial de Cambios
                </h3>
                {proc.history.length > 0 ? (
                  <ul className="space-y-4">
                    {proc.history.map((h, i) => (
                      <li key={i} className="flex gap-4 text-sm group">
                        <div className="font-mono text-indigo-400 font-bold w-16 group-hover:text-indigo-300">v{h.version}</div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-300">{h.changeLog}</p>
                          <p className="text-gray-500 text-xs mt-0.5">{h.date} - por {h.author}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic text-sm">No hay historial previo registrado.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'video' && proc.urlVideo && (
            <div className="aspect-video w-full max-w-4xl mx-auto bg-black rounded-lg overflow-hidden shadow-2xl border-4 border-slate-800 animate-in fade-in duration-300">
              <iframe 
                src={proc.urlVideo} 
                className="w-full h-full" 
                title="Video Tutorial"
                allowFullScreen
              />
            </div>
          )}
        </div>
      </div>

      {viewFile && <FileViewerModal fileUrl={viewFile.url} fileName={viewFile.name} onClose={() => setViewFile(null)} />}
    </div>
  );
};
