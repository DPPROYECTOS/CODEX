import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { appwriteService } from '../services/appwriteService';
import { ConsultationMessage } from '../types';
import { Mail, CheckCircle, Search, User, FileText, Clock, RefreshCw, Send, Lock, Trash2, AlertTriangle, X } from 'lucide-react';

export const AdminInbox: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const [messages, setMessages] = useState<ConsultationMessage[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed' | 'closed'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [replyText, setReplyText] = useState<{[key: string]: string}>({});
  const [sendingReply, setSendingReply] = useState<string | null>(null);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
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

  const filteredMessages = messages.filter(m => {
      const matchesFilter = filter === 'all' ? true : m.status === filter;
      const matchesSearch = 
        (m.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        m.message.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (m.user_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (m.procedure_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
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
                  <h3 className="text-lg font-bold">Buzón de Mensajes Colaborativos</h3>
                  <p className="text-xs text-indigo-400 font-medium">Gestiona consultas y soporte a usuarios.</p>
              </div>
          </div>
          <div>
              {messages.filter(m => m.status === 'pending').length > 0 && (
                  <span className="bg-red-600 text-white text-xs px-3 py-1 rounded-full font-bold shadow-sm">
                      {messages.filter(m => m.status === 'pending').length} Pendientes
                  </span>
              )}
          </div>
      </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900 p-4 rounded-lg border border-white/10">
            <div className="relative w-full md:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
                <input 
                    type="text" 
                    placeholder="Buscar ticket..." 
                    className="pl-9 pr-4 py-2 border border-white/10 bg-slate-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-500 w-full"
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
            
            <button onClick={loadData} className="p-2 text-gray-500 hover:bg-slate-800 hover:text-white rounded-lg transition-colors" title="Recargar">
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
        </div>

        {loading ? (
            <div className="text-center py-20 text-gray-400">Cargando buzón...</div>
        ) : filteredMessages.length === 0 ? (
            <div className="text-center py-20 bg-slate-900 rounded-xl border border-white/10">
                <Mail size={48} className="mx-auto text-gray-700 mb-4" />
                <p className="text-gray-500 font-medium">No hay mensajes.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 gap-6">
                {filteredMessages.map(msg => (
                    <div key={msg.id} className={`bg-slate-900 rounded-lg border shadow-sm transition-all hover:bg-slate-800/50 ${
                            msg.status === 'pending' ? 'border-l-4 border-l-amber-500 border-white/10' : 
                            msg.status === 'closed' ? 'border-l-4 border-l-gray-600 border-white/10 opacity-70' :
                            'border-l-4 border-l-emerald-500 border-white/10'
                        }`}>
                        <div className="p-5 flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                    <div className="flex items-center text-sm font-bold text-white">
                                        <User size={16} className="mr-1.5 text-indigo-400" />
                                        {msg.user_name}
                                    </div>
                                    <span className="text-xs px-2 py-0.5 bg-slate-800 text-gray-400 rounded-full font-medium border border-white/5">
                                        {msg.user_area}
                                    </span>
                                    <span className="text-xs text-gray-500 flex items-center ml-2">
                                        <Clock size={12} className="mr-1" />
                                        {new Date(msg.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                
                                <h3 className="text-lg font-bold text-gray-200 mb-2">{msg.title || 'Ticket sin título'}</h3>

                                {msg.procedure_name && (
                                    <div className="mb-3 inline-flex items-center px-2 py-1 bg-indigo-900/30 text-indigo-400 text-xs font-bold rounded border border-indigo-500/30">
                                        <FileText size={12} className="mr-1.5" />
                                        {msg.procedure_name}
                                    </div>
                                )}

                                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap bg-slate-950/50 p-3 rounded-lg border border-white/5">
                                    {msg.message}
                                </p>
                            </div>

                            <div className="flex flex-row md:flex-col gap-2 justify-center md:justify-start min-w-[140px]">
                                {msg.status !== 'closed' && (
                                    <button 
                                        onClick={() => handleStatusChange(msg.id, 'closed')}
                                        className="flex items-center justify-center px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors border border-white/10"
                                    >
                                        <Lock size={14} className="mr-2" />
                                        Cerrar Ticket
                                    </button>
                                )}
                                
                                {msg.status === 'pending' && (
                                    <button 
                                        onClick={() => handleStatusChange(msg.id, 'reviewed')}
                                        className="flex items-center justify-center px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors border border-emerald-500"
                                    >
                                        <CheckCircle size={14} className="mr-2" />
                                        Marcar Revisado
                                    </button>
                                )}
                                
                                <button 
                                    onClick={() => setTicketToDelete(msg.id)}
                                    className="flex items-center justify-center px-3 py-2 bg-red-900/20 border border-red-500/30 hover:bg-red-900/40 text-red-400 text-xs font-bold rounded-lg transition-colors"
                                >
                                    <Trash2 size={14} className="mr-2" />
                                    Eliminar
                                </button>
                            </div>
                        </div>

                        <div className="bg-slate-950/30 p-4 border-t border-white/5">
                            {msg.replies && msg.replies.length > 0 && (
                                <div className="space-y-3 mb-4 pl-4 border-l-2 border-indigo-500/30">
                                    {msg.replies.map(reply => (
                                        <div key={reply.id} className={`p-3 rounded-lg shadow-sm border text-sm ${reply.user_role === 'admin' ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-slate-800 border-white/10'}`}>
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={`font-bold text-xs ${reply.user_role === 'admin' ? 'text-indigo-400' : 'text-gray-400'}`}>
                                                    {reply.user_name}
                                                </span>
                                                <span className="text-[10px] text-gray-500">{new Date(reply.created_at).toLocaleTimeString()}</span>
                                            </div>
                                            <p className="text-gray-300">{reply.message}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {msg.status !== 'closed' && (
                                <div className="flex gap-2 items-start mt-2">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={replyText[msg.id] || ''}
                                            onChange={(e) => setReplyText(prev => ({...prev, [msg.id]: e.target.value}))}
                                            placeholder="Escribir respuesta oficial..."
                                            className="w-full px-3 py-2 border border-white/10 bg-slate-800 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none text-white"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleReply(msg.id);
                                                }
                                            }}
                                        />
                                    </div>
                                    <button
                                        onClick={() => handleReply(msg.id)}
                                        disabled={sendingReply === msg.id || !replyText[msg.id]?.trim()}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50"
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

      {ticketToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-xl shadow-2xl max-w-sm w-full p-6 relative border border-white/10">
                <button 
                    onClick={() => setTicketToDelete(null)} 
                    className="absolute top-4 right-4 text-gray-500 hover:text-white"
                >
                    <X size={20} />
                </button>
                <div className="flex justify-center mb-4">
                    <div className="bg-red-900/30 p-3 rounded-full text-red-500 border border-red-500/30">
                        <AlertTriangle size={32} />
                    </div>
                </div>
                <h3 className="text-lg font-bold text-center text-white mb-2">¿Eliminar Ticket?</h3>
                <p className="text-sm text-gray-400 text-center mb-6">Esta acción es irreversible.</p>
                <div className="flex space-x-3">
                    <button 
                        onClick={() => setTicketToDelete(null)}
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