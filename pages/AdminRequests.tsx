import React, { useEffect, useState } from 'react';
import { appwriteService } from '../services/appwriteService';
import { DownloadRequest } from '../types';
import { Key, RefreshCw, CheckCircle, Download, FileText, CheckCheck, Clock, AlertCircle, Trash2, X, AlertTriangle } from 'lucide-react';

export const AdminRequests: React.FC = () => {
  const [downloadRequests, setDownloadRequests] = useState<DownloadRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const dls = await appwriteService.adminGetDownloadRequests();
    setDownloadRequests(dls);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDownloadResponse = async (id: string, status: 'approved' | 'rejected') => {
      const success = await appwriteService.adminRespondToDownloadRequest(id, status);
      if (success) {
          setDownloadRequests(prev => prev.map(r => 
              r.id === id ? { ...r, status: status } : r
          ));
      }
  };

  const executeDelete = async () => {
      if (!requestToDelete) return;
      setIsDeleting(true);
      const success = await appwriteService.adminDeleteDownloadRequest(requestToDelete);
      if (success) {
          setDownloadRequests(prev => prev.filter(r => r.id !== requestToDelete));
          setRequestToDelete(null);
      } else {
          alert("Error al eliminar la solicitud.");
      }
      setIsDeleting(false);
  };

  return (
    <div className="space-y-6">
       <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-white/10 flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <div className="p-3 bg-indigo-900/30 rounded-lg border border-indigo-500/30">
                    <Key size={24} className="text-indigo-400" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">Solicitudes de Acceso a Archivos</h3>
                    <p className="text-sm text-gray-400">Autoriza, deniega y monitorea el estado de descargas.</p>
                </div>
            </div>
            <button 
                onClick={loadData} 
                className="p-2 text-gray-500 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
                title="Actualizar lista"
            >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
       </div>
       
       {loading ? (
           <div className="text-center py-20 text-gray-400">Cargando solicitudes...</div>
       ) : downloadRequests.length === 0 ? (
           <div className="text-center py-20 bg-slate-900 rounded-xl border border-white/10 shadow-sm">
               <CheckCircle size={64} className="mx-auto text-emerald-900/50 mb-4" />
               <p className="text-lg font-bold text-gray-300">¡Todo al día!</p>
               <p className="text-gray-500">No hay historial de solicitudes recientes.</p>
           </div>
       ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {downloadRequests.map(req => {
                  const isPending = req.status === 'pending';
                  const isConsumed = req.status === 'consumed';
                  const isApproved = req.status === 'approved';

                  return (
                    <div key={req.id} className={`bg-slate-900 p-6 rounded-xl shadow-md border relative overflow-hidden group transition-colors ${isPending ? 'border-amber-500/30' : isConsumed ? 'border-white/5 opacity-60' : 'border-emerald-500/30'}`}>
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-white">
                            {isConsumed ? <CheckCheck size={80} /> : <Download size={80} />}
                        </div>
                        
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-2">
                                    <span className="bg-indigo-900/30 text-indigo-300 text-xs font-bold px-2.5 py-1 rounded border border-indigo-500/30">
                                        {req.user_area}
                                    </span>
                                    {isPending && (
                                        <span className="bg-amber-900/30 text-amber-400 text-xs font-bold px-2 py-1 rounded border border-amber-500/30 flex items-center">
                                            <Clock size={12} className="mr-1" /> Pendiente
                                        </span>
                                    )}
                                    {isApproved && (
                                        <span className="bg-emerald-900/30 text-emerald-400 text-xs font-bold px-2 py-1 rounded border border-emerald-500/30 flex items-center">
                                            <AlertCircle size={12} className="mr-1" /> Esperando Descarga
                                        </span>
                                    )}
                                    {isConsumed && (
                                        <span className="bg-slate-800 text-gray-400 text-xs font-bold px-2 py-1 rounded border border-white/10 flex items-center">
                                            <CheckCheck size={12} className="mr-1" /> Ya Descargado
                                        </span>
                                    )}
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs font-mono text-gray-500 bg-slate-950 px-2 py-1 rounded border border-white/5">
                                        {new Date(req.requested_at).toLocaleDateString()}
                                    </span>
                                    
                                    <button
                                        onClick={() => setRequestToDelete(req.id)}
                                        className="p-1 text-gray-500 hover:text-red-500 hover:bg-red-900/20 rounded transition-colors"
                                        title="Eliminar registro"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="mb-4">
                                <h4 className="font-bold text-lg text-white leading-tight">{req.user_name}</h4>
                                <p className="text-sm text-gray-400">{req.user_email}</p>
                            </div>
                            
                            <div className="bg-slate-950 p-4 rounded-lg border border-white/10 mb-6 flex items-start">
                                <FileText size={20} className="text-indigo-400 mr-3 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Solicita archivo:</p>
                                    <p className="text-sm font-bold text-indigo-200 leading-snug">
                                        {req.procedure_name}
                                    </p>
                                </div>
                            </div>
                            
                            {isPending ? (
                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => handleDownloadResponse(req.id, 'rejected')}
                                        className="flex-1 py-3 border border-red-500/50 text-red-500 font-bold text-sm rounded-lg hover:bg-red-900/20 transition-colors"
                                    >
                                        Denegar
                                    </button>
                                    <button 
                                        onClick={() => handleDownloadResponse(req.id, 'approved')}
                                        className="flex-1 py-3 bg-emerald-700 text-white font-bold text-sm rounded-lg hover:bg-emerald-600 shadow-sm transition-colors flex items-center justify-center border border-emerald-500"
                                    >
                                        <CheckCircle size={16} className="mr-2" />
                                        Autorizar
                                    </button>
                                </div>
                            ) : (
                                <div className={`text-center py-2 text-sm font-bold rounded-lg border ${
                                    isConsumed ? 'bg-slate-800 text-gray-500 border-white/5' : 
                                    isApproved ? 'bg-emerald-900/20 text-emerald-400 border-emerald-500/20' : 'bg-red-900/20 text-red-400 border-red-500/20'
                                }`}>
                                    {isConsumed ? "El usuario ya descargó este archivo." : 
                                     isApproved ? "Autorizado. Usuario aún no descarga." : "Solicitud Denegada."}
                                </div>
                            )}
                        </div>
                    </div>
                  );
              })}
           </div>
       )}

      {requestToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-xl shadow-2xl max-w-sm w-full p-6 relative border border-white/10 animate-in fade-in zoom-in duration-200">
                <button 
                    onClick={() => setRequestToDelete(null)} 
                    className="absolute top-4 right-4 text-gray-500 hover:text-white"
                >
                    <X size={20} />
                </button>
                <div className="flex justify-center mb-4">
                    <div className="bg-red-900/30 p-3 rounded-full text-red-500 border border-red-500/30">
                        <AlertTriangle size={32} />
                    </div>
                </div>
                <h3 className="text-lg font-bold text-center text-white mb-2">¿Eliminar Registro?</h3>
                <p className="text-sm text-gray-400 text-center mb-6">Esta acción borrará el historial de esta solicitud.</p>
                <div className="flex space-x-3">
                    <button 
                        onClick={() => setRequestToDelete(null)}
                        className="flex-1 py-2.5 border border-white/20 rounded-lg text-gray-300 font-medium hover:bg-white/5"
                        disabled={isDeleting}
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={executeDelete}
                        disabled={isDeleting}
                        className="flex-1 py-2.5 bg-red-600 rounded-lg text-white font-bold hover:bg-red-700"
                    >
                        {isDeleting ? 'Eliminando...' : 'Eliminar'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};