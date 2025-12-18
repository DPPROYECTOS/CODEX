
import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { appwriteService } from '../services/appwriteService';
import { ConsultationMessage, Procedure, Folder } from '../types';
import { Send, FileText, MessageSquare, Clock, CheckCircle, Users, CornerDownRight, Lock, Layers, FolderIcon } from 'lucide-react';

export const Consultation: React.FC = () => {
  const { user } = useAuth();
  
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedProc, setSelectedProc] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [targetArea, setTargetArea] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  
  const [tickets, setTickets] = useState<ConsultationMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [replyText, setReplyText] = useState<{[key: string]: string}>({});
  const [sendingReply, setSendingReply] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setTargetArea(user.area);
      
      // Cargar procedimientos y carpetas en paralelo
      const loadMetadata = async () => {
          const [procsData, foldersData] = await Promise.all([
              appwriteService.getProcedures(user),
              appwriteService.getFolders() // Traer todas las carpetas publicadas
          ]);
          setProcedures(procsData);
          setFolders(foldersData);
      };
      
      loadMetadata();
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
      if (user) {
          setLoadingHistory(true);
          const msgs = await appwriteService.getCollaborativeMessages(user.allowedAreas);
          setTickets(msgs);
          setLoadingHistory(false);
      }
  };

  // --- LÓGICA DE AGRUPACIÓN POR CARPETA PARA EL ÁREA SELECCIONADA ---
  const groupedProcedures = useMemo(() => {
      // 1. Filtrar procs por el área de destino seleccionada
      const areaProcs = procedures.filter(p => 
          p.area.toString().toUpperCase() === targetArea.toUpperCase()
      );

      // 2. Agrupar por Folder ID
      const groups: { [key: string]: { name: string, items: Procedure[] } } = {
          'root': { name: 'Archivos Generales (Sin Carpeta)', items: [] }
      };

      areaProcs.forEach(proc => {
          if (proc.folder_id) {
              const folder = folders.find(f => f.id === proc.folder_id);
              const folderName = folder ? folder.name : 'Carpeta Desconocida';
              
              if (!groups[proc.folder_id]) {
                  groups[proc.folder_id] = { name: folderName.toUpperCase(), items: [] };
              }
              groups[proc.folder_id].items.push(proc);
          } else {
              groups['root'].items.push(proc);
          }
      });

      return groups;
  }, [targetArea, procedures, folders]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !message.trim() || !title.trim()) return;

    setIsSending(true);
    let procName = undefined;
    if (selectedProc) {
        procName = procedures.find(p => p.$id === selectedProc)?.name;
    }
    const finalTicketArea = targetArea || user.area;
    const success = await appwriteService.sendConsultationMessage(user.$id, message, finalTicketArea, selectedProc || undefined, procName, title);

    if (success) {
        setSendSuccess(true);
        setTitle('');
        setMessage('');
        setSelectedProc('');
        loadHistory(); 
        setTimeout(() => setSendSuccess(false), 3000);
    } else {
        alert("Error al enviar mensaje.");
    }
    setIsSending(false);
  };

  const handleReply = async (ticketId: string) => {
    const text = replyText[ticketId];
    if (!user || !text?.trim()) return;
    setSendingReply(ticketId);
    const success = await appwriteService.replyToMessage(ticketId, user.$id, text);
    if (success) {
        setReplyText(prev => ({ ...prev, [ticketId]: '' }));
        await loadHistory(); 
    }
    setSendingReply(null);
  };

  const isMultiArea = user && user.allowedAreas.length > 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto h-[calc(100vh-140px)]">
      
      <div className="lg:col-span-4 space-y-6 overflow-y-auto pr-2">
        <div className="bg-slate-900 rounded-xl shadow-sm border border-white/10 p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <MessageSquare className="mr-2 text-indigo-400" />
                Nuevo Ticket
            </h2>
            <p className="text-sm text-gray-400 mb-6">
                Inicie una consulta técnica u operativa.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* SELECTOR DE ÁREA DE DESTINO */}
                <div className="bg-slate-800 p-3 rounded-lg border border-white/10 mb-2">
                    <label className="block text-xs font-bold text-indigo-300 mb-1 flex items-center">
                        <Layers size={12} className="mr-1"/>
                        ÁREA DESTINATARIA
                    </label>
                    <select
                        value={targetArea}
                        onChange={(e) => {
                            setTargetArea(e.target.value);
                            setSelectedProc(''); // Resetear doc al cambiar área
                        }}
                        className="w-full px-3 py-2 bg-slate-900 border border-white/20 rounded-md text-sm font-semibold text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        {user?.allowedAreas.map(area => (
                            <option key={area} value={area}>{area.toUpperCase()}</option>
                        ))}
                    </select>
                </div>

                {/* SELECTOR DE DOCUMENTO AGRUPADO POR CARPETAS */}
                <div>
                    <label className="block text-sm font-bold text-gray-300 mb-1">Referenciar Documento</label>
                    <div className="relative">
                        <div className="absolute left-3 top-3 text-indigo-400 pointer-events-none">
                            <FileText size={18} />
                        </div>
                        <select
                            value={selectedProc}
                            onChange={(e) => setSelectedProc(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm text-white appearance-none"
                        >
                            <option value="">-- Consulta General (Sin documento) --</option>
                            
                            {/* Fix: Explicitly type entries to avoid 'unknown' type errors during Object.entries map */}
                            {(Object.entries(groupedProcedures) as [string, { name: string, items: Procedure[] }][]).map(([folderId, group]) => (
                                group.items.length > 0 && (
                                    <optgroup key={folderId} label={group.name}>
                                        {group.items.map(p => (
                                            <option key={p.$id} value={p.$id}>
                                                {p.code} - {p.name}
                                            </option>
                                        ))}
                                    </optgroup>
                                )
                            ))}
                        </select>
                        <div className="absolute right-3 top-3 pointer-events-none text-gray-500">
                             <Clock size={14} className="animate-pulse" />
                        </div>
                    </div>
                    {selectedProc === '' && (
                        <p className="text-[10px] text-gray-500 mt-1 italic">
                            Si el tema no es sobre un archivo específico, déjelo en blanco.
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-300 mb-1">Título / Asunto</label>
                    <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm text-white placeholder-gray-500"
                        placeholder="Ej. Error detectado en el paso 4"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-300 mb-1">Cuerpo del Mensaje</label>
                    <textarea
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full p-4 bg-slate-800 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all h-32 text-sm resize-none text-white placeholder-gray-500"
                        placeholder="Explique su observación o duda..."
                    />
                </div>

                <div className="pt-2">
                    {sendSuccess ? (
                        <div className="w-full bg-emerald-900/20 text-emerald-400 px-4 py-3 rounded-lg flex items-center justify-center font-bold text-sm border border-emerald-500/30">
                            <CheckCircle size={18} className="mr-2" />
                            Ticket Creado con Éxito
                        </div>
                    ) : (
                        <button
                            type="submit"
                            disabled={isSending || !message.trim() || !title.trim()}
                            className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-bold text-white transition-all shadow-md ${
                                isSending || !message.trim() || !title.trim()
                                ? 'bg-slate-700 cursor-not-allowed border border-white/5'
                                : 'bg-indigo-700 hover:bg-indigo-800 hover:shadow-lg'
                            }`}
                        >
                            {isSending ? 'Sincronizando...' : (
                                <>
                                    <Send size={18} className="mr-2" />
                                    Abrir Consulta Oficial
                                </>
                            )}
                        </button>
                    )}
                </div>
            </form>
        </div>
        
        <div className="bg-indigo-950/20 p-4 rounded-lg border border-indigo-500/20 text-xs text-gray-400">
            <strong className="flex items-center mb-1 text-indigo-300 uppercase tracking-tighter">
                <Users size={14} className="mr-1"/> Privacidad Colaborativa
            </strong>
            Al enviar este ticket, todos los colaboradores de <strong>{targetArea}</strong> podrán visualizarlo para evitar consultas duplicadas.
        </div>
      </div>

      <div className="lg:col-span-8 bg-slate-900 rounded-xl shadow-sm border border-white/10 flex flex-col overflow-hidden h-full">
         <div className="p-6 border-b border-white/10 bg-slate-950/30 flex justify-between items-center">
             <h3 className="font-bold text-white flex items-center uppercase tracking-widest text-sm">
                 <MessageSquare className="mr-2 text-gray-500" size={18} />
                 Historial Colaborativo de {targetArea}
             </h3>
             <button onClick={loadHistory} className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300">ACTUALIZAR</button>
         </div>
         
         <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950/20">
            {loadingHistory ? (
                <div className="text-center py-10 text-gray-500 font-mono text-xs animate-pulse">Sincronizando hilos de conversación...</div>
            ) : tickets.length === 0 ? (
                <div className="text-center py-20 text-gray-500 flex flex-col items-center">
                    <MessageSquare size={48} className="opacity-10 mb-4" />
                    <p className="font-bold text-sm uppercase tracking-widest">Buzón Vacío</p>
                    <p className="text-xs mt-1">No hay consultas registradas para esta área.</p>
                </div>
            ) : (
                tickets.map(ticket => (
                    <div key={ticket.id} className={`bg-slate-900 rounded-xl shadow-sm border overflow-hidden ${ticket.status === 'closed' ? 'border-white/5 opacity-60' : 'border-white/10'}`}>
                        <div className={`p-4 border-b ${ticket.status === 'closed' ? 'bg-slate-950 border-white/5' : 'bg-slate-900 border-white/5'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center space-x-2">
                                    <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-indigo-300 font-bold text-xs overflow-hidden border border-white/10">
                                        {ticket.user_avatar ? (
                                            <img src={ticket.user_avatar} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            ticket.user_name?.charAt(0)
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">{ticket.user_name}</p>
                                        <p className="text-xs text-gray-500 uppercase font-bold tracking-tighter">
                                            {ticket.user_role} • <span className="text-indigo-400">{ticket.area}</span>
                                        </p>
                                    </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border flex items-center ${
                                    ticket.status === 'reviewed' 
                                    ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30' 
                                    : ticket.status === 'closed'
                                    ? 'bg-slate-800 text-gray-500 border-gray-600'
                                    : 'bg-amber-900/30 text-amber-400 border-amber-500/30'
                                }`}>
                                    {ticket.status === 'closed' && <Lock size={10} className="mr-1" />}
                                    {ticket.status === 'reviewed' ? 'Resuelto' : ticket.status === 'closed' ? 'Archivado' : 'Pendiente'}
                                </span>
                            </div>

                            <div className="mb-2">
                                <h4 className="font-bold text-white text-base">{ticket.title || 'Consulta sin título'}</h4>
                            </div>
                            
                            {ticket.procedure_name && (
                                <div className="mb-3">
                                    <span className="text-[10px] font-bold text-indigo-300 bg-indigo-900/30 px-1.5 py-1 rounded border border-indigo-500/30 flex items-center w-fit uppercase">
                                        <FileText size={10} className="mr-1" />
                                        REF: {ticket.procedure_name}
                                    </span>
                                </div>
                            )}
                            
                            <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{ticket.message}</p>
                            <p className="text-[10px] text-gray-600 mt-2 flex items-center justify-end font-mono">
                                <Clock size={12} className="mr-1" />
                                {new Date(ticket.created_at).toLocaleString()}
                            </p>
                        </div>

                        <div className="bg-slate-950/50 p-4 space-y-3">
                            {ticket.replies && ticket.replies.length > 0 && (
                                <div className="space-y-3 mb-4 pl-4 border-l-2 border-indigo-500/30">
                                    {ticket.replies.map(reply => (
                                        <div key={reply.id} className="bg-slate-800 p-3 rounded-lg shadow-sm border border-white/5 text-sm">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={`font-bold text-[10px] uppercase tracking-wider ${reply.user_role === 'admin' ? 'text-red-400' : 'text-indigo-400'}`}>
                                                    {reply.user_role === 'admin' ? '✓ RESPUESTA OFICIAL' : reply.user_name}
                                                </span>
                                                <span className="text-[9px] text-gray-500 font-mono">{new Date(reply.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                            </div>
                                            <p className="text-gray-300 text-sm">{reply.message}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {ticket.status !== 'closed' ? (
                                <div className="flex gap-2 items-start mt-2">
                                    <CornerDownRight size={16} className="text-gray-500 mt-2 flex-shrink-0" />
                                    <div className="flex-1">
                                        <textarea
                                            value={replyText[ticket.id] || ''}
                                            onChange={(e) => setReplyText(prev => ({...prev, [ticket.id]: e.target.value}))}
                                            placeholder="Aportar a la consulta..."
                                            className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none resize-none h-16 text-white placeholder-gray-600"
                                        />
                                        <div className="flex justify-end mt-1">
                                            <button
                                                onClick={() => handleReply(ticket.id)}
                                                disabled={sendingReply === ticket.id || !replyText[ticket.id]?.trim()}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-md text-xs font-bold transition-colors disabled:opacity-50 shadow-lg"
                                            >
                                                {sendingReply === ticket.id ? 'Publicando...' : 'Responder'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-[10px] text-gray-600 italic py-2 font-bold uppercase tracking-widest">
                                    Hilo de conversación cerrado por la administración.
                                </div>
                            )}
                        </div>
                    </div>
                ))
            )}
         </div>
      </div>
    </div>
  );
};
