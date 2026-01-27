
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { appwriteService } from '../services/appwriteService';
import { ConsultationMessage } from '../types';
import { Mail, CheckCircle, Search, User, FileText, Clock, RefreshCw, Send, Lock, Trash2, AlertTriangle, X, Layers, Image as ImageIcon, Maximize2, CornerDownRight, BarChart } from 'lucide-react';

export const AdminInbox: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const [messages, setMessages] = useState<ConsultationMessage[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed' | 'closed'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [replyText, setReplyText] = useState<{[key: string]: string}>({});
  const [sendingReply, setSendingReply] = useState<string | null>(null);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const msgs = await appwriteService.adminGetConsultationMessages();
    setMessages(msgs);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (id: string, newStatus: 'reviewed' | 'archived' | 'closed') => {
    const success = await appwriteService.adminUpdateMessageStatus(id, newStatus);
    if (success) {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m));
    }
  };

  const executeDelete = async () => {
      if (!ticketToDelete) return;
      setIsDeleting(true);
      const success = await appwriteService.adminDeleteMessage(ticketToDelete);
      if (success) {
          setMessages(prev => prev.filter(m => m.id !== ticketToDelete));
          setTicketToDelete(null);
      } else {
          alert("Error al eliminar el ticket.");
      }
      setIsDeleting(false);
  };

  const handleReply = async (ticketId: string) => {
      const text = replyText[ticketId];
      if (!user || !text?.trim()) return;
      setSendingReply(ticketId);
      const success = await appwriteService.replyToMessage(ticketId, user.$id, text);
      if (success) {
          setReplyText(prev => ({ ...prev, [ticketId]: '' }));
          await loadData();
      } else {
          alert("Error al enviar respuesta.");
      }
      setSendingReply(null);
  };

  const getPriorityBadge = (p?: string) => {
    switch(p) {
        case 'low': return <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-700 uppercase">Baja</span>;
        case 'high': return <span className="bg-orange-900/30 text-orange-400 px-2 py-0.5 rounded text-[10px] font-bold border border-orange-500/30 uppercase">Alta</span>;
        case 'urgent': return <span className="bg-red-900/40 text-red-500 px-2 py-0.5 rounded text-[10px] font-black border border-red-500/40 uppercase animate-pulse">Urgente</span>;
        default: return <span className="bg-indigo-900/20 text-indigo-400 px-2 py-0.5 rounded text-[10px] font-bold border border-indigo-500/20 uppercase">Normal</span>;
    }
  };

  const filteredMessages = messages.filter(m => {
      const matchesFilter = filter === 'all' ? true : m.status === filter;
      const matchesSearch = 
        (m.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        m.message.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (m.user_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (m.procedure_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (m.process_section?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (m.area?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 p-4 rounded-xl shadow-sm border border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3 text-white">
              <div className="p-2 bg-indigo-900/30 rounded-lg border border-indigo-500/30">
                  <Mail size={24} className="text-indigo-400" />
              </div>
              <div>
                  <h3 className="text-lg font-bold uppercase tracking-tight">Centro de Atención Colaborativa</h3>
                  <p className="text-xs text-indigo-400 font-medium">Soporte y triaje de consultas operativas.</p>
              </div>
          </div>
          <button onClick={loadData} className="p-2 text-gray-500 hover:text-white transition-colors">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
      </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900 p-4 rounded-lg border border-white/10">
            <div className="relative w-full md:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
                <input 
                    type="text" 
                    placeholder="Filtrar tickets..." 
                    className="pl-9 pr-4 py-2 border border-white/10 bg-slate-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-500 w-full md:min-w-[300px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="flex bg-slate-800 p-1 rounded-lg border border-white/10">
                {['pending', 'reviewed', 'closed', 'all'].map((f) => (
                    <button 
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all capitalize ${filter === f ? 'bg-indigo-700 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendientes' : f === 'reviewed' ? 'Revisados' : 'Cerrados'}
                    </button>
                ))}
            </div>
        </div>

        {loading ? (
            <div className="text-center py-20 text-gray-400">Cargando buzón...</div>
        ) : filteredMessages.length === 0 ? (
            <div className="text-center py-20 bg-slate-900 rounded-xl border border-white/10">
                <Mail size={48} className="mx-auto text-gray-700 mb-4 opacity-20" />
                <p className="text-gray-500 font-medium">Buzón vacío.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 gap-6">
                {filteredMessages.map(msg => (
                    <div key={msg.id} className={`bg-slate-900 rounded-lg border shadow-sm transition-all ${
                            msg.status === 'pending' ? 'border-l-4 border-l-amber-500 border-white/10' : 
                            msg.status === 'closed' ? 'border-l-4 border-l-gray-600 border-white/10 opacity-70' :
                            'border-l-4 border-l-emerald-500 border-white/10'
                        }`}>
                        <div className="p-5 flex flex-col md:flex-row justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-2">
                                        <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 overflow-hidden shadow-sm">
                                            {msg.user_avatar ? <img src={msg.user_avatar} className="w-full h-full object-cover" /> : <User size={16} className="text-indigo-400" />}
                                        </div>
                                        <div className="flex flex-col">
                                            <p className="text-xs font-black text-gray-200 uppercase tracking-tighter">{msg.user_name}</p>
                                            <p className="text-[10px] text-gray-500 font-mono leading-none">{msg.user_email}</p>
                                        </div>
                                    </div>
                                    {getPriorityBadge(msg.priority)}
                                </div>
                                
                                <h3 className="text-lg font-bold text-white mb-2">{msg.title || 'Ticket sin título'}</h3>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    {msg.procedure_name && (
                                        <div className="inline-flex items-center px-2 py-1 bg-slate-800 text-indigo-300 text-[10px] font-bold rounded border border-white/10">
                                            <FileText size={10} className="mr-1.5" />
                                            DOC: {msg.procedure_name}
                                        </div>
                                    )}
                                    {msg.process_section && (
                                        <div className="inline-flex items-center px-2 py-1 bg-amber-900/30 text-amber-500 text-[10px] font-bold rounded border border-amber-500/30">
                                            <Layers size={10} className="mr-1.5" />
                                            SECCIÓN: {msg.process_section}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4">
                                    <p className="flex-1 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap bg-slate-950/50 p-4 rounded-xl border border-white/5">
                                        {msg.message}
                                    </p>
                                    {msg.reference_image && (
                                        <div 
                                            className="shrink-0 w-40 h-32 rounded-xl border-2 border-white/10 bg-black overflow-hidden group/preview relative cursor-zoom-in shadow-xl"
                                            onClick={() => setExpandedImage(msg.reference_image!)}
                                        >
                                            <img src={msg.reference_image} className="w-full h-full object-cover opacity-80" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center">
                                                <Maximize2 size={20} className="text-white" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-row md:flex-col gap-2 justify-center md:justify-start min-w-[150px]">
                                {msg.status === 'pending' && (
                                    <button onClick={() => handleStatusChange(msg.id, 'reviewed')} className="flex-1 md:flex-none flex items-center justify-center px-3 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black rounded-lg transition-all border border-emerald-500 shadow-lg">
                                        <CheckCircle size={14} className="mr-2" />
                                        RESOLVER
                                    </button>
                                )}
                                {msg.status !== 'closed' && (
                                    <button onClick={() => handleStatusChange(msg.id, 'closed')} className="flex-1 md:flex-none flex items-center justify-center px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs font-bold rounded-lg transition-colors border border-white/10">
                                        <Lock size={14} className="mr-2" />
                                        ARCHIVAR
                                    </button>
                                )}
                                <button onClick={() => setTicketToDelete(msg.id)} className="p-2.5 bg-red-900/20 border border-red-500/30 hover:bg-red-600 text-red-500 hover:text-white rounded-lg transition-all">
                                    <Trash2 size={14} />
                                </button>
                                <div className="text-[9px] font-mono text-gray-600 text-center mt-2">
                                    {new Date(msg.created_at).toLocaleString()}
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-950/30 p-5 border-t border-white/5">
                            {msg.replies?.map(reply => (
                                <div key={reply.id} className={`p-4 rounded-xl border mb-3 text-sm ${reply.user_role === 'admin' ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-slate-900/80 border-white/5'}`}>
                                    <span className={`font-black text-[10px] uppercase tracking-wider block mb-1 ${reply.user_role === 'admin' ? 'text-indigo-400' : 'text-gray-400'}`}>
                                        {reply.user_role === 'admin' ? '✓ RESPUESTA OFICIAL' : reply.user_name}
                                    </span>
                                    <p className="text-gray-300">{reply.message}</p>
                                </div>
                            ))}
                            
                            {msg.status !== 'closed' && (
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="text"
                                        value={replyText[msg.id] || ''}
                                        onChange={(e) => setReplyText(prev => ({...prev, [msg.id]: e.target.value}))}
                                        className="flex-1 px-4 py-3 border border-white/10 bg-slate-900 rounded-xl text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-indigo-500"
                                        placeholder="Escribe una respuesta..."
                                    />
                                    <button
                                        onClick={() => handleReply(msg.id)}
                                        disabled={sendingReply === msg.id || !replyText[msg.id]?.trim()}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl disabled:opacity-50"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )}

      {expandedImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4" onClick={() => setExpandedImage(null)}>
              <div className="relative max-w-5xl w-full" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setExpandedImage(null)} className="absolute -top-10 right-0 text-white/50 hover:text-white"><X size={32} /></button>
                  <img src={expandedImage} className="w-full rounded border border-white/10" alt="Full" />
              </div>
          </div>
      )}

      {ticketToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-xl shadow-2xl max-sm w-full p-6 border border-white/10 animate-in zoom-in duration-200">
                <div className="flex justify-center mb-4"><div className="bg-red-900/30 p-3 rounded-full text-red-500"><Trash2 size={32} /></div></div>
                <h3 className="text-lg font-bold text-center text-white mb-2 uppercase">¿Eliminar Ticket?</h3>
                <p className="text-sm text-gray-400 text-center mb-6">Esta acción es irreversible.</p>
                <div className="flex space-x-3">
                    <button onClick={() => setTicketToDelete(null)} className="flex-1 py-2 border border-white/20 rounded text-gray-300 font-bold" disabled={isDeleting}>Cancelar</button>
                    <button onClick={executeDelete} disabled={isDeleting} className="flex-1 py-2 bg-red-600 rounded text-white font-black">{isDeleting ? 'Borrando...' : 'ELIMINAR'}</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
