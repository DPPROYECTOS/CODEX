import React, { useEffect, useState } from 'react';
import { appwriteService } from '../services/appwriteService';
import { ImprovementProposal } from '../types';
import { Lightbulb, CheckCircle, XCircle, Clock, RefreshCw, Eye, X, MessageSquare, AlertTriangle, Trash2 } from 'lucide-react';

export const AdminProposals: React.FC = () => {
  const [proposals, setProposals] = useState<ImprovementProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState<ImprovementProposal | null>(null);
  const [feedback, setFeedback] = useState('');
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState('all');
  
  // State for deletion
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const data = await appwriteService.adminGetProposals();
    setProposals(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleUpdateStatus = async (status: string) => {
      if (!selectedProposal) return;
      setProcessing(true);
      const success = await appwriteService.adminUpdateProposalStatus(selectedProposal.id, status, feedback);
      if (success) {
          await loadData();
          setSelectedProposal(null);
          setFeedback('');
      } else {
          alert("Error al actualizar.");
      }
      setProcessing(false);
  };

  const handleDeleteProposal = async () => {
      if (!selectedProposal) return;
      setIsDeleting(true);
      const success = await appwriteService.adminDeleteProposal(selectedProposal.id);
      if (success) {
          await loadData();
          setShowDeleteConfirm(false);
          setSelectedProposal(null);
      } else {
          alert("Error al eliminar la propuesta.");
      }
      setIsDeleting(false);
  };

  const filtered = proposals.filter(p => filter === 'all' ? true : p.status === filter);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
              <div className="p-3 bg-cyan-900/30 rounded-lg border border-cyan-500/30">
                  <Lightbulb size={24} className="text-cyan-400" />
              </div>
              <div>
                  <h3 className="text-xl font-bold text-white">Gestión de Mejora Continua</h3>
                  <p className="text-sm text-gray-400">Evalúa y aprueba propuestas Kaizen de los colaboradores.</p>
              </div>
          </div>
          <div className="flex gap-2">
            <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                className="bg-slate-800 border border-white/10 text-white text-sm rounded-lg px-3 outline-none"
            >
                <option value="all">Todas</option>
                <option value="pending">Pendientes</option>
                <option value="in_review">En Revisión</option>
                <option value="approved">Aprobadas</option>
                <option value="rejected">Rechazadas</option>
            </select>
            <button onClick={loadData} className="p-2 bg-slate-800 text-gray-400 hover:text-white rounded-lg transition-colors border border-white/10">
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.length === 0 ? (
              <div className="col-span-3 text-center py-20 text-gray-500">No hay propuestas en esta categoría.</div>
          ) : (
              filtered.map(p => (
                  <div key={p.id} className={`bg-slate-900 rounded-xl border p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all ${p.status === 'pending' ? 'border-amber-500/40' : 'border-white/10'}`}>
                      <div>
                          <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center space-x-2">
                                    <div className="h-6 w-6 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden text-[10px] text-white font-bold">
                                        {p.user_avatar ? <img src={p.user_avatar} className="w-full h-full object-cover"/> : p.user_name?.charAt(0)}
                                    </div>
                                    <span className="text-xs font-bold text-gray-300 truncate max-w-[120px]">{p.user_name}</span>
                                </div>
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                                    p.status === 'approved' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30' :
                                    p.status === 'rejected' ? 'bg-red-900/30 text-red-400 border-red-500/30' :
                                    p.status === 'in_review' ? 'bg-indigo-900/30 text-indigo-400 border-indigo-500/30' :
                                    'bg-amber-900/30 text-amber-400 border-amber-500/30'
                                }`}>
                                    {p.status.replace('_', ' ')}
                                </span>
                          </div>
                          <h4 className="font-bold text-white mb-1 line-clamp-1">{p.title}</h4>
                          <span className="text-xs bg-slate-950 px-2 py-0.5 rounded text-gray-500 border border-white/5">{p.area}</span>
                          
                          <p className="text-xs text-gray-400 mt-3 line-clamp-3 italic">"{p.proposal_details}"</p>
                      </div>
                      
                      <button 
                        onClick={() => { setSelectedProposal(p); setFeedback(p.admin_feedback || ''); }}
                        className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold rounded-lg border border-white/10 transition-colors flex items-center justify-center"
                      >
                          <Eye size={14} className="mr-2" /> Revisar Detalles
                      </button>
                  </div>
              ))
          )}
      </div>

      {selectedProposal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
              <div className="bg-slate-900 w-full max-w-2xl rounded-xl shadow-2xl border border-white/10 flex flex-col max-h-[90vh] relative">
                  
                  {/* Modal Header */}
                  <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-950/50 rounded-t-xl">
                      <div>
                          <h3 className="text-xl font-bold text-white">Evaluación de Propuesta</h3>
                          <p className="text-sm text-gray-400">ID: {selectedProposal.id}</p>
                      </div>
                      <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setShowDeleteConfirm(true)} 
                            className="p-2 hover:bg-red-900/20 text-red-400 rounded-lg transition-colors border border-transparent hover:border-red-500/30"
                            title="Eliminar propuesta"
                          >
                              <Trash2 size={20} />
                          </button>
                          <button onClick={() => setSelectedProposal(null)} className="text-gray-500 hover:text-white p-2 hover:bg-white/5 rounded-lg"><X size={24} /></button>
                      </div>
                  </div>

                  {/* Modal Content */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      <div className="flex items-center space-x-4 bg-slate-800 p-3 rounded-lg border border-white/5">
                          <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white border border-white/10">
                             {selectedProposal.user_name?.charAt(0)}
                          </div>
                          <div>
                              <p className="font-bold text-white">{selectedProposal.user_name}</p>
                              <p className="text-xs text-gray-400">{selectedProposal.user_email} • {selectedProposal.area}</p>
                          </div>
                      </div>

                      <div className="space-y-4">
                          <div className="bg-red-900/10 p-4 rounded-lg border border-red-500/20">
                              <h4 className="text-xs font-bold text-red-400 uppercase mb-2 flex items-center"><AlertTriangle size={12} className="mr-2"/> Situación Actual</h4>
                              <p className="text-sm text-gray-300">{selectedProposal.current_situation}</p>
                          </div>
                          <div className="bg-cyan-900/10 p-4 rounded-lg border border-cyan-500/20">
                              <h4 className="text-xs font-bold text-cyan-400 uppercase mb-2 flex items-center"><Lightbulb size={12} className="mr-2"/> Propuesta</h4>
                              <p className="text-sm text-gray-300">{selectedProposal.proposal_details}</p>
                          </div>
                          <div className="bg-emerald-900/10 p-4 rounded-lg border border-emerald-500/20">
                              <h4 className="text-xs font-bold text-emerald-400 uppercase mb-2 flex items-center"><CheckCircle size={12} className="mr-2"/> Beneficios</h4>
                              <p className="text-sm text-gray-300">{selectedProposal.benefits}</p>
                          </div>
                      </div>

                      <div>
                          <label className="block text-sm font-bold text-white mb-2 flex items-center">
                              <MessageSquare size={16} className="mr-2 text-indigo-400"/>
                              Feedback / Resolución Gerencial
                          </label>
                          <textarea 
                             value={feedback}
                             onChange={(e) => setFeedback(e.target.value)}
                             className="w-full h-24 bg-slate-800 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-indigo-500 outline-none"
                             placeholder="Escribe un comentario para el usuario..."
                          />
                      </div>
                  </div>

                  <div className="p-6 border-t border-white/10 bg-slate-950/50 rounded-b-xl flex gap-3">
                      <button onClick={() => handleUpdateStatus('rejected')} disabled={processing} className="flex-1 py-3 bg-red-900/20 border border-red-500/30 text-red-400 font-bold rounded-lg hover:bg-red-900/40 transition-colors">
                          Rechazar
                      </button>
                      <button onClick={() => handleUpdateStatus('in_review')} disabled={processing} className="flex-1 py-3 bg-indigo-900/20 border border-indigo-500/30 text-indigo-400 font-bold rounded-lg hover:bg-indigo-900/40 transition-colors">
                          En Revisión
                      </button>
                      <button onClick={() => handleUpdateStatus('approved')} disabled={processing} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-lg border border-emerald-400 transition-colors">
                          Aprobar
                      </button>
                  </div>

                  {/* DELETE CONFIRMATION OVERLAY */}
                  {showDeleteConfirm && (
                      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-[60] flex items-center justify-center p-6 rounded-xl">
                          <div className="bg-slate-900 border border-white/10 rounded-xl p-6 max-w-sm w-full shadow-2xl text-center animate-in fade-in zoom-in duration-200">
                              <div className="mx-auto w-12 h-12 bg-red-900/30 rounded-full flex items-center justify-center mb-4 border border-red-500/30">
                                  <Trash2 size={24} className="text-red-500" />
                              </div>
                              <h3 className="text-lg font-bold text-white mb-2">¿Eliminar Propuesta?</h3>
                              <p className="text-sm text-gray-400 mb-6">
                                  Esta acción es irreversible y eliminará todo el registro de esta idea de mejora.
                              </p>
                              <div className="flex gap-3">
                                  <button 
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 py-2 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 font-bold text-sm"
                                    disabled={isDeleting}
                                  >
                                      Cancelar
                                  </button>
                                  <button 
                                    onClick={handleDeleteProposal}
                                    className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-lg"
                                    disabled={isDeleting}
                                  >
                                      {isDeleting ? 'Eliminando...' : 'Sí, Eliminar'}
                                  </button>
                              </div>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};