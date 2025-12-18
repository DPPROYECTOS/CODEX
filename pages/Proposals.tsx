import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { appwriteService } from '../services/appwriteService';
import { ImprovementProposal } from '../types';
import { Lightbulb, Plus, CheckCircle, Clock, XCircle, AlertCircle, TrendingUp, Target, Shield, RefreshCw } from 'lucide-react';

export const Proposals: React.FC = () => {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<ImprovementProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [area, setArea] = useState('');
  const [currentSituation, setCurrentSituation] = useState('');
  const [proposalDetails, setProposalDetails] = useState('');
  const [benefits, setBenefits] = useState('');

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    const data = await appwriteService.getUserProposals(user.$id);
    setProposals(data);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
        setArea(user.area);
        loadData();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;
      setSubmitting(true);
      const success = await appwriteService.createImprovementProposal({
          user_id: user.$id,
          title,
          area,
          current_situation: currentSituation,
          proposal_details: proposalDetails,
          benefits
      });

      if (success) {
          setSuccess(true);
          setTitle('');
          setCurrentSituation('');
          setProposalDetails('');
          setBenefits('');
          await loadData();
          setTimeout(() => setSuccess(false), 3000);
      }
      setSubmitting(false);
  };

  const getStatusBadge = (status: string) => {
      switch (status) {
          case 'approved': return <span className="bg-emerald-900/30 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded text-xs font-bold flex items-center"><CheckCircle size={12} className="mr-1"/> Aprobada</span>;
          case 'rejected': return <span className="bg-red-900/30 text-red-400 border border-red-500/30 px-2 py-1 rounded text-xs font-bold flex items-center"><XCircle size={12} className="mr-1"/> Rechazada</span>;
          case 'in_review': return <span className="bg-indigo-900/30 text-indigo-400 border border-indigo-500/30 px-2 py-1 rounded text-xs font-bold flex items-center"><Clock size={12} className="mr-1"/> En Revisión</span>;
          default: return <span className="bg-amber-900/30 text-amber-400 border border-amber-500/30 px-2 py-1 rounded text-xs font-bold flex items-center"><AlertCircle size={12} className="mr-1"/> Pendiente</span>;
      }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
        {/* FORM SECTION */}
        <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900 rounded-xl shadow-sm border border-white/10 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Lightbulb size={120} />
                </div>
                
                <h2 className="text-xl font-bold text-white mb-2 flex items-center relative z-10">
                    <Plus className="mr-2 text-cyan-400" />
                    Nueva Propuesta
                </h2>
                <p className="text-sm text-gray-400 mb-6 relative z-10">
                    Formaliza tu idea de mejora continua (Kaizen). Sé específico en el problema y la solución.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                    <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1 uppercase">Título de la Propuesta</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none text-sm text-white"
                            placeholder="Ej. Optimización de tiempos en empaque"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1 uppercase">Área de Impacto</label>
                        <select
                            value={area}
                            onChange={(e) => setArea(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white outline-none"
                        >
                            {user?.allowedAreas.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>

                    <div className="bg-slate-950/50 p-3 rounded-lg border border-white/5 space-y-3">
                        <div>
                            <label className="flex items-center text-xs font-bold text-red-400 mb-1 uppercase">
                                <AlertCircle size={12} className="mr-1" /> Situación Actual (Problema)
                            </label>
                            <textarea
                                required
                                value={currentSituation}
                                onChange={(e) => setCurrentSituation(e.target.value)}
                                className="w-full p-3 bg-slate-800 border border-white/10 rounded-lg text-sm text-white h-20 resize-none outline-none focus:border-red-500/50"
                                placeholder="Describe qué está mal o qué proceso es ineficiente..."
                            />
                        </div>

                        <div>
                            <label className="flex items-center text-xs font-bold text-cyan-400 mb-1 uppercase">
                                <Target size={12} className="mr-1" /> Propuesta Técnica (Solución)
                            </label>
                            <textarea
                                required
                                value={proposalDetails}
                                onChange={(e) => setProposalDetails(e.target.value)}
                                className="w-full p-3 bg-slate-800 border border-white/10 rounded-lg text-sm text-white h-24 resize-none outline-none focus:border-cyan-500/50"
                                placeholder="Describe detalladamente tu idea para resolverlo..."
                            />
                        </div>

                        <div>
                            <label className="flex items-center text-xs font-bold text-emerald-400 mb-1 uppercase">
                                <TrendingUp size={12} className="mr-1" /> Beneficios Esperados
                            </label>
                            <textarea
                                required
                                value={benefits}
                                onChange={(e) => setBenefits(e.target.value)}
                                className="w-full p-3 bg-slate-800 border border-white/10 rounded-lg text-sm text-white h-16 resize-none outline-none focus:border-emerald-500/50"
                                placeholder="Ahorro de costos, seguridad, tiempo..."
                            />
                        </div>
                    </div>

                    {success ? (
                        <div className="bg-emerald-900/20 text-emerald-400 p-3 rounded-lg text-center font-bold border border-emerald-500/30">
                            ¡Propuesta enviada correctamente!
                        </div>
                    ) : (
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-3 bg-cyan-700 hover:bg-cyan-600 text-white rounded-lg font-bold shadow-lg transition-all disabled:opacity-50"
                        >
                            {submitting ? 'Enviando...' : 'Registrar Propuesta'}
                        </button>
                    )}
                </form>
            </div>
        </div>

        {/* LIST SECTION */}
        <div className="lg:col-span-7 space-y-6 flex flex-col h-[calc(100vh-140px)]">
            <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl border border-white/10">
                <h3 className="font-bold text-white flex items-center">
                    <Shield size={18} className="mr-2 text-gray-400" />
                    Mis Propuestas
                </h3>
                <button onClick={loadData} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-gray-400 hover:text-white transition-colors">
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {loading ? (
                    <div className="text-center py-10 text-gray-500">Cargando historial...</div>
                ) : proposals.length === 0 ? (
                    <div className="text-center py-20 text-gray-600 border-2 border-dashed border-white/5 rounded-xl">
                        <Lightbulb size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No has registrado ninguna propuesta aún.</p>
                    </div>
                ) : (
                    proposals.map(p => (
                        <div key={p.id} className="bg-slate-900 rounded-xl border border-white/10 p-5 hover:border-cyan-500/30 transition-colors shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="font-bold text-white text-lg">{p.title}</h4>
                                    <span className="text-xs text-gray-500 bg-slate-950 px-2 py-0.5 rounded border border-white/5">{p.area}</span>
                                </div>
                                {getStatusBadge(p.status)}
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 mb-4 text-xs text-gray-400 bg-slate-950/30 p-3 rounded-lg border border-white/5">
                                <div>
                                    <span className="block font-bold text-red-400 mb-1">Problema</span>
                                    <p className="line-clamp-2">{p.current_situation}</p>
                                </div>
                                <div>
                                    <span className="block font-bold text-cyan-400 mb-1">Propuesta</span>
                                    <p className="line-clamp-2">{p.proposal_details}</p>
                                </div>
                                <div>
                                    <span className="block font-bold text-emerald-400 mb-1">Beneficio</span>
                                    <p className="line-clamp-2">{p.benefits}</p>
                                </div>
                            </div>

                            {p.admin_feedback && (
                                <div className="mt-3 bg-indigo-900/20 border-l-2 border-indigo-500 p-3 rounded-r-lg text-sm">
                                    <span className="block font-bold text-indigo-300 text-xs mb-1 uppercase">Respuesta de Gerencia</span>
                                    <p className="text-gray-300">{p.admin_feedback}</p>
                                </div>
                            )}

                            <div className="mt-2 text-right text-[10px] text-gray-600 font-mono">
                                REF: {p.id.split('-')[0]} • {new Date(p.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    </div>
  );
};