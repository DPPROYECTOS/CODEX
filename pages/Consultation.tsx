
import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { appwriteService, normalizeString } from '../services/appwriteService';
import { ConsultationMessage, Procedure, Folder, ADMIN_EMAILS } from '../types';
import { 
    Send, FileText, MessageSquare, Clock, CheckCircle, Users, CornerDownRight, 
    Lock, Layers, FolderIcon, Camera, X, Image as ImageIcon, ShieldCheck, 
    CheckSquare, Archive, Loader, AlertCircle, BarChart
} from 'lucide-react';
import { useLocation } from 'react-router-dom';

export const Consultation: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedProc, setSelectedProc] = useState<string>('');
  const [processSection, setProcessSection] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [pastedImage, setPastedImage] = useState<string | null>(null);
  const [targetArea, setTargetArea] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  
  const [tickets, setTickets] = useState<ConsultationMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [replyText, setReplyText] = useState<{[key: string]: string}>({});
  const [sendingReply, setSendingReply] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const isAdmin = useMemo(() => user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase()), [user]);

  useEffect(() => {
    if (user) {
      setTargetArea(user.area);
      
      const loadMetadata = async () => {
          const [procsData, foldersData] = await Promise.all([
              appwriteService.getProcedures(user),
              appwriteService.getFolders()
          ]);
          setProcedures(procsData);
          setFolders(foldersData);

          if (location.state?.procedureId) {
              setSelectedProc(location.state.procedureId);
              const doc = procsData.find(p => p.$id === location.state.procedureId);
              if (doc) setTargetArea(doc.area as string);
          }
      };
      
      loadMetadata();
      loadHistory();
    }
  }, [user, location.state]);

  const loadHistory = async () => {
      if (user) {
          setLoadingHistory(true);
          const msgs = await appwriteService.getCollaborativeMessages(user.allowedAreas);
          setTickets(msgs);
          setLoadingHistory(false);
      }
  };

  const isAuthorityForTicket = (ticket: ConsultationMessage) => {
    if (!user) return false;
    if (isAdmin) return true;
    
    const userArea = normalizeString(user.area);
    const ticketArea = normalizeString(ticket.area || '');
    
    if (userArea !== ticketArea) return false;
    
    const nameUpper = user.name.toUpperCase();
    return (
        nameUpper.includes('GERENTE') || 
        nameUpper.includes('COORDINADOR') || 
        nameUpper.includes('JEFE') || 
        nameUpper.includes('LIDER') ||
        user.role === 'admin'
    );
  };

  const handlePaste = (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
              const blob = items[i].getAsFile();
              if (blob) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                      setPastedImage(event.target?.result as string);
                  };
                  reader.readAsDataURL(blob);
              }
          }
      }
  };

  const groupedProcedures = useMemo(() => {
      const areaProcs = procedures.filter(p => 
          p.area.toString().toUpperCase() === targetArea.toUpperCase()
      );
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
    const success = await appwriteService.sendConsultationMessage(
        user.$id, 
        message, 
        finalTicketArea, 
        selectedProc || undefined, 
        procName, 
        title,
        processSection,
        pastedImage || undefined,
        priority
    );

    if (success) {
        setSendSuccess(true);
        setTitle('');
        setMessage('');
        setSelectedProc('');
        setProcessSection('');
        setPriority('normal');
        setPastedImage(null);
        loadHistory(); 
        setTimeout(() => setSendSuccess(false), 3000);
    } else {
        alert("Error al enviar mensaje. Verifica tu conexión.");
    }
    setIsSending(false);
  };

  const handleReply = async (ticketId: string) => {
    const text = replyText[ticketId];
    if (!user || !text?.trim()) return;
    setSendingReply(ticketId);
    try {
        const success = await appwriteService.replyToMessage(ticketId, user.$id, text);
        if (success) {
            setReplyText(prev => ({ ...prev, [ticketId]: '' }));
            await loadHistory(); 
        } else {
            alert("No tienes permisos suficientes para responder a este ticket o hubo un error de red.");
        }
    } catch (e) {
        alert("Error crítico al intentar publicar la respuesta.");
    } finally {
        setSendingReply(null);
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: 'reviewed' | 'closed') => {
      setUpdatingStatus(ticketId);
      const success = await appwriteService.adminUpdateMessageStatus(ticketId, newStatus);
      if (success) {
          await loadHistory();
      } else {
          alert("Error al actualizar el estado del ticket.");
      }
      setUpdatingStatus(null);
  };

  const getPriorityBadge = (p?: string) => {
      switch(p) {
          case 'low': return <span className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[9px] font-bold border border-slate-700 uppercase">Baja</span>;
          case 'high': return <span className="bg-orange-900/30 text-orange-400 px-1.5 py-0.5 rounded text-[9px] font-bold border border-orange-500/30 uppercase">Alta</span>;
          case 'urgent': return <span className="bg-red-900/40 text-red-500 px-1.5 py-0.5 rounded text-[9px] font-black border border-red-500/40 uppercase animate-pulse">Urgente</span>;
          default: return <span className="bg-indigo-900/20 text-indigo-400 px-1.5 py-0.5 rounded text-[9px] font-bold border border-indigo-500/20 uppercase">Normal</span>;
      }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto h-[calc(100vh-140px)]">
      
      <div className="lg:col-span-4 space-y-6 overflow-y-auto pr-2">
        <div className="bg-slate-900 rounded-xl shadow-sm border border-white/10 p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <MessageSquare className="mr-2 text-indigo-400" />
                Nuevo Ticket
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                
                <div className="bg-slate-800 p-3 rounded-lg border border-white/10">
                    <label className="block text-xs font-bold text-indigo-300 mb-2 flex items-center">
                        <BarChart size={12} className="mr-1"/>
                        PRIORIDAD DE CONSULTA
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                        {([
                            {v:'low', l:'Baja', c:'hover:bg-slate-700', a:'bg-slate-700 text-white'},
                            {v:'normal', l:'Normal', c:'hover:bg-indigo-700', a:'bg-indigo-700 text-white'},
                            {v:'high', l:'Alta', c:'hover:bg-orange-700', a:'bg-orange-700 text-white'},
                            {v:'urgent', l:'Urgente', c:'hover:bg-red-700', a:'bg-red-700 text-white'}
                        ] as const).map(p => (
                            <button
                                key={p.v}
                                type="button"
                                onClick={() => setPriority(p.v)}
                                className={`py-1.5 rounded text-[10px] font-black uppercase transition-all border border-white/5 ${priority === p.v ? p.a : 'bg-slate-900 text-gray-500 ' + p.c}`}
                            >
                                {p.l}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-800 p-3 rounded-lg border border-white/10 mb-2">
                    <label className="block text-xs font-bold text-indigo-300 mb-1 flex items-center uppercase">
                        <Layers size={12} className="mr-1"/>
                        Área Destinataria
                    </label>
                    <select
                        value={targetArea}
                        onChange={(e) => {
                            setTargetArea(e.target.value);
                            setSelectedProc('');
                        }}
                        className="w-full px-3 py-2 bg-slate-900 border border-white/20 rounded-md text-sm font-semibold text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        {user?.allowedAreas.map(area => (
                            <option key={area} value={area}>{area.toUpperCase()}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Vincular Procedimiento</label>
                    <div className="relative">
                        <div className="absolute left-3 top-3 text-indigo-400 pointer-events-none">
                            <FileText size={18} />
                        </div>
                        <select
                            value={selectedProc}
                            onChange={(e) => setSelectedProc(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm text-white appearance-none"
                        >
                            <option value="">-- Consulta General --</option>
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
                    </div>
                </div>

                {selectedProc && (
                    <div className="animate-in slide-in-from-top duration-300">
                        <label className="block text-xs font-bold text-amber-500 mb-1 uppercase tracking-tighter">Paso / Sección Específica</label>
                        <input
                            type="text"
                            value={processSection}
                            onChange={(e) => setProcessSection(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-800 border border-amber-500/20 rounded-lg text-sm text-white placeholder-gray-600 outline-none focus:border-amber-500/50 transition-colors"
                            placeholder="Ej. Paso 2.3, Tabla de empaque..."
                        />
                    </div>
                )}

                <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Título / Asunto</label>
                    <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm text-white placeholder-gray-500"
                        placeholder="Ej. Duda en validación de SKU"
                    />
                </div>

                <div className="relative">
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Mensaje y Captura</label>
                    <div className="relative group">
                        <textarea
                            required
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onPaste={handlePaste}
                            className="w-full p-4 bg-slate-800 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-32 text-sm resize-none text-white placeholder-gray-500"
                            placeholder="Describa su duda... Use Ctrl+V para pegar capturas."
                        />
                        <div className="absolute bottom-2 right-2 flex items-center bg-slate-900 px-2 py-1 rounded border border-white/5 opacity-40">
                            <Camera size={14} className="text-gray-500 mr-1.5" />
                            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Ctrl+V</span>
                        </div>
                    </div>
                </div>

                {pastedImage && (
                    <div className="relative mt-2 rounded-lg border-2 border-dashed border-indigo-500/30 p-2 bg-indigo-950/20 group animate-in zoom-in duration-200">
                        <div className="flex items-center justify-between mb-2">
                             <span className="text-[10px] font-bold text-indigo-400 uppercase flex items-center">
                                 <ImageIcon size={12} className="mr-1" /> Referencia Capturada
                             </span>
                             <button type="button" onClick={() => setPastedImage(null)} className="p-1 hover:bg-red-900/20 text-red-500 rounded"><X size={14} /></button>
                        </div>
                        <img src={pastedImage} alt="Pasted" className="w-full h-32 object-contain rounded-md bg-black/40" />
                    </div>
                )}

                <div className="pt-2">
                    {sendSuccess ? (
                        <div className="w-full bg-emerald-900/20 text-emerald-400 px-4 py-3 rounded-lg flex items-center justify-center font-bold text-sm border border-emerald-500/30">
                            <CheckCircle size={18} className="mr-2" /> Ticket Enviado
                        </div>
                    ) : (
                        <button
                            type="submit"
                            disabled={isSending || !message.trim() || !title.trim()}
                            className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-bold text-white transition-all shadow-md ${
                                isSending || !message.trim() || !title.trim() ? 'bg-slate-700 cursor-not-allowed' : 'bg-indigo-700 hover:bg-indigo-800'
                            }`}
                        >
                            {isSending ? 'Sincronizando...' : <><Send size={18} className="mr-2" /> Abrir Consulta</>}
                        </button>
                    )}
                </div>
            </form>
        </div>
      </div>

      <div className="lg:col-span-8 bg-slate-900 rounded-xl shadow-sm border border-white/10 flex flex-col overflow-hidden h-full">
         <div className="p-6 border-b border-white/10 bg-slate-950/30 flex justify-between items-center">
             <h3 className="font-bold text-white flex items-center uppercase tracking-widest text-sm">
                 <MessageSquare className="mr-2 text-gray-500" size={18} />
                 Historial de {targetArea}
             </h3>
             <button onClick={loadHistory} className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300">ACTUALIZAR</button>
         </div>
         
         <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950/20">
            {loadingHistory ? (
                <div className="text-center py-10 text-gray-500 font-mono text-xs animate-pulse">Cargando hilos...</div>
            ) : (
                tickets.map(ticket => {
                    const hasAuthority = isAuthorityForTicket(ticket);
                    return (
                        <div key={ticket.id} className={`bg-slate-900 rounded-xl shadow-sm border overflow-hidden transition-all ${ticket.status === 'closed' ? 'opacity-60' : hasAuthority ? 'border-indigo-500/20' : 'border-white/10'}`}>
                            <div className={`p-4 border-b border-white/5 ${ticket.status === 'closed' ? 'bg-slate-950' : 'bg-slate-900'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center space-x-2">
                                        <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-indigo-300 font-bold text-xs overflow-hidden border border-white/10">
                                            {ticket.user_avatar ? <img src={ticket.user_avatar} alt="Avatar" className="w-full h-full object-cover" /> : ticket.user_name?.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold text-white">{ticket.user_name}</p>
                                                {getPriorityBadge(ticket.priority)}
                                            </div>
                                            <p className="text-xs text-gray-500 uppercase font-bold tracking-tighter">
                                                {ticket.user_role} • <span className="text-indigo-400">{ticket.area}</span>
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
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
                                        {isAdmin && ticket.status !== 'closed' && (
                                            <div className="flex items-center bg-slate-800 rounded-md p-0.5 border border-white/10">
                                                {ticket.status === 'pending' && (
                                                    <button onClick={() => handleStatusChange(ticket.id, 'reviewed')} className="p-1 text-emerald-400 hover:bg-emerald-400/10 rounded" title="Resolver"><CheckSquare size={14} /></button>
                                                )}
                                                <button onClick={() => handleStatusChange(ticket.id, 'closed')} className="p-1 text-gray-400 hover:bg-gray-400/10 rounded" title="Archivar"><Archive size={14} /></button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <h4 className="font-bold text-white text-base mb-2">{ticket.title}</h4>
                                
                                <div className="flex flex-wrap gap-2 mb-3 text-[9px] font-black uppercase">
                                    {ticket.procedure_name && <span className="text-indigo-300 bg-indigo-900/30 px-1.5 py-1 rounded border border-indigo-500/30">DOC: {ticket.procedure_name}</span>}
                                    {ticket.process_section && <span className="text-amber-300 bg-amber-900/30 px-1.5 py-1 rounded border border-amber-500/30">SECCIÓN: {ticket.process_section}</span>}
                                </div>
                                
                                <div className="flex flex-col md:flex-row gap-4">
                                    <p className="flex-1 text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{ticket.message}</p>
                                    {ticket.reference_image && (
                                        <div className="shrink-0 w-24 h-24 rounded-lg border border-white/10 overflow-hidden shadow-md">
                                            <img src={ticket.reference_image} className="w-full h-full object-cover" alt="Ref" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-[10px] text-gray-600 mt-2 flex items-center justify-end font-mono"><Clock size={12} className="mr-1" /> {new Date(ticket.created_at).toLocaleString()}</p>
                            </div>

                            <div className="bg-slate-950/50 p-4 space-y-3">
                                {ticket.replies?.map(reply => {
                                    const isOfficial = reply.user_role === 'admin' || (reply.user_name?.toUpperCase().includes('GERENTE') || reply.user_name?.toUpperCase().includes('COORDINADOR'));
                                    return (
                                        <div key={reply.id} className={`p-3 rounded-lg border text-sm ${isOfficial ? 'bg-indigo-900/20 border-indigo-500/20' : 'bg-slate-800 border-white/5'}`}>
                                            <span className={`font-bold text-[10px] uppercase block mb-1 ${isOfficial ? 'text-cyan-400' : 'text-indigo-400'}`}>
                                                {isOfficial && <ShieldCheck size={10} className="inline mr-1" />}
                                                {isOfficial ? `RESPUESTA OFICIAL: ${reply.user_name}` : reply.user_name}
                                            </span>
                                            <p className="text-gray-300">{reply.message}</p>
                                        </div>
                                    );
                                })}

                                {ticket.status !== 'closed' && (
                                    <div className="flex gap-2 items-start mt-2">
                                        <CornerDownRight size={16} className="text-gray-500 mt-2 flex-shrink-0" />
                                        <div className="flex-1">
                                            <textarea
                                                value={replyText[ticket.id] || ''}
                                                onChange={(e) => setReplyText(prev => ({...prev, [ticket.id]: e.target.value}))}
                                                placeholder="Aportar a la consulta..."
                                                className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-sm outline-none resize-none h-16 text-white placeholder-gray-600"
                                            />
                                            <div className="flex justify-end mt-1">
                                                <button onClick={() => handleReply(ticket.id)} disabled={sendingReply === ticket.id || !replyText[ticket.id]?.trim()} className="px-4 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold disabled:opacity-50">Publicar</button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })
            )}
         </div>
      </div>
    </div>
  );
};
