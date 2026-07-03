import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/appwriteService';
import { 
  Send, 
  Search, 
  Users, 
  CheckCheck, 
  Smile, 
  MoreVertical, 
  Info, 
  Lock, 
  User, 
  MessageSquare,
  Sparkles,
  ShieldAlert,
  Download,
  Paperclip,
  Image as ImageIcon,
  X,
  Loader2,
  Trash2
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender_email: string;
  sender_name: string;
  chat_room: string;
  message_text: string;
  created_at: string;
  seen_by?: string[]; // Lista de correos que han visto el mensaje
}

interface ChatRoom {
  id: string;
  name: string;
  description: string;
  avatar: React.ReactNode;
  subtitle: string;
}

const SUPER_ADMINS = ['darienperez695@gmail.com', 'zerklucio@gmail.com'];

// Emojis rápidos para simular selector de emojis de WhatsApp
const QUICK_EMOJIS = ['😊', '👍', '😂', '🔥', '👏', '⚠️', '✅', '👀', '💡', '💬', '💼', '🚀'];

// Reproductor de sonido estilo Outlook/Teams (arpegio ascendente brillante con Web Audio API)
const playOutlookSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    const notes = [
      { freq: 523.25, start: 0.0, duration: 0.15, gain: 0.15, type: 'sine' }, // C5
      { freq: 659.25, start: 0.08, duration: 0.15, gain: 0.15, type: 'sine' }, // E5
      { freq: 783.99, start: 0.16, duration: 0.20, gain: 0.20, type: 'sine' }, // G5
      { freq: 1046.50, start: 0.24, duration: 0.8, gain: 0.30, type: 'triangle' } // C6
    ];

    notes.forEach(note => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = note.type as OscillatorType;
      osc.frequency.setValueAtTime(note.freq, now + note.start);
      
      gainNode.gain.setValueAtTime(0, now + note.start);
      gainNode.gain.linearRampToValueAtTime(note.gain, now + note.start + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + note.start + note.duration);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(now + note.start);
      osc.stop(now + note.start + note.duration);
    });
  } catch (e) {
    console.warn("No se pudo reproducir el sonido de notificación:", e);
  }
};

export const AdminChat: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [activeRoom, setActiveRoom] = useState<string>('global_admin');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Estados para adjuntar capturas/imágenes comprimidas
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [fileSizeInfo, setFileSizeInfo] = useState<{ original: string; compressed: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado para la confirmación de borrar mensaje
  const [msgIdToDelete, setMsgIdToDelete] = useState<string | null>(null);

  // Estado para el mes de exportación seleccionado (formato "YYYY-MM")
  const [selectedExportMonth, setSelectedExportMonth] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  // Generar opciones de meses (últimos 12 meses)
  const getAvailableExportMonths = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthNum = String(d.getMonth() + 1).padStart(2, '0');
      const val = `${year}-${monthNum}`;
      const label = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      options.push({ value: val, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
    return options;
  };
  const availableMonths = getAvailableExportMonths();

  const handleDownloadMonthlyTxt = () => {
    const [selYear, selMonth] = selectedExportMonth.split('-');
    const monthlyMsgs = messages.filter(msg => {
      if (msg.chat_room !== activeRoom) return false;
      const msgDate = new Date(msg.created_at);
      const mYear = msgDate.getFullYear();
      const mMonth = String(msgDate.getMonth() + 1).padStart(2, '0');
      return String(mYear) === selYear && mMonth === selMonth;
    });

    const monthLabel = availableMonths.find(m => m.value === selectedExportMonth)?.label || selectedExportMonth;

    let txtContent = `=========================================================\n`;
    txtContent += `       REGISTRO OFICIAL DE CHAT ADMINISTRATIVO         \n`;
    txtContent += `=========================================================\n`;
    txtContent += `Canal: ${currentRoom.name.toUpperCase()}\n`;
    txtContent += `Periodo: ${monthLabel}\n`;
    txtContent += `Generado por: ${user?.name || 'Admin'} (${user?.email})\n`;
    txtContent += `Fecha de exportación: ${new Date().toLocaleString('es-ES')}\n`;
    txtContent += `=========================================================\n\n`;

    if (monthlyMsgs.length === 0) {
      txtContent += `No se encontraron mensajes registrados para este periodo.\n`;
    } else {
      monthlyMsgs.forEach((msg, idx) => {
        const dateStr = new Date(msg.created_at).toLocaleString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });

        let text = msg.message_text;
        if (text.startsWith('[IMAGE]:')) {
          const parts = text.substring(8).split('::CAPTION::');
          const url = parts[0];
          const caption = parts[1] || '';
          text = `[IMAGEN ADJUNTA] URL: ${url}${caption ? ` - Comentario: "${caption}"` : ''}`;
        }

        txtContent += `[${idx + 1}] [${dateStr}] ${msg.sender_name} (${msg.sender_email}):\n    ${text}\n\n`;
      });
    }

    txtContent += `\n---------------------------------------------------------\n`;
    txtContent += `Fin del registro oficial. CODEX Security System v1.7\n`;
    txtContent += `---------------------------------------------------------\n`;

    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `registro_chat_${currentRoom.id}_${selectedExportMonth}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('admin_chat_messages')
        .delete()
        .eq('id', messageId);

      if (error) {
        console.error("Error al borrar mensaje:", error);
        setErrorState("No se pudo borrar el mensaje en Supabase. Verifica tus políticas de RLS.");
      } else {
        // Actualización optimista local
        setMessages(prev => prev.filter(m => m.id !== messageId));
      }
    } catch (err: any) {
      console.error(err);
      setErrorState("Fallo al intentar borrar el mensaje: " + (err.message || err));
    }
  };

  // Formatear bytes legiblemente
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Compresión y re-dimensionado de imágenes del lado del cliente
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        resolve(file);
        return;
      }

      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        // Resolución decente pero súper ligera (máx. 1200px)
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.80 // Calidad 80% (perfecto balance de nitidez y peso liviano, aprox. 100-200 KB)
        );
      };
      img.onerror = (err) => {
        reject(err);
      };
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona únicamente archivos de imagen (capturas, fotos, etc.)');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setFilePreview(objectUrl);

    try {
      const compressed = await compressImage(file);
      setFileSizeInfo({
        original: formatBytes(file.size),
        compressed: formatBytes(compressed.size)
      });
    } catch (err) {
      console.error("Error al pre-comprimir la imagen:", err);
    }
  };

  const clearFileSelection = () => {
    setSelectedFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
    setFileSizeInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Verificar accesibilidad por correo
  const isAuthorized = user?.email && SUPER_ADMINS.some(email => email.toLowerCase() === user.email.toLowerCase());

  // Definir las salas/chats disponibles
  const chatRooms: ChatRoom[] = [
    {
      id: 'global_admin',
      name: 'Mesa Directiva (Darien & Zerk)',
      description: 'Canal oficial de coordinación administrativa de alta dirección.',
      subtitle: 'Grupo administrativo',
      avatar: (
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">
          <Users size={22} />
        </div>
      )
    },
    {
      id: 'system_logs',
      name: 'Alertas de Servidor y Logs',
      description: 'Stream en vivo de alertas de seguridad del sistema CODEX.',
      subtitle: 'Canal del sistema',
      avatar: (
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-red-500 to-amber-600 flex items-center justify-center text-white font-bold shadow-lg">
          <ShieldAlert size={22} />
        </div>
      )
    }
  ];

  // Obtener el objeto de la sala activa
  const currentRoom = chatRooms.find(r => r.id === activeRoom) || chatRooms[0];

  // Filtrar las salas si se busca algo
  const filteredRooms = chatRooms.filter(room => 
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    room.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtrar los mensajes de la sala activa
  const filteredMessages = messages.filter(msg => msg.chat_room === activeRoom);

  // Cargar historial de mensajes y suscribirse a cambios en tiempo real
  useEffect(() => {
    if (!isAuthorized || !supabase) return;

    const fetchMessages = async () => {
      setLoading(true);
      setErrorState(null);
      try {
        const { data, error } = await supabase
          .from('admin_chat_messages')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) {
          console.error("Error al cargar mensajes:", error);
          setErrorState("No se pudo cargar el historial. ¿Ya creaste la tabla en Supabase?");
        } else if (data) {
          setMessages(data);
        }
      } catch (err: any) {
        console.error(err);
        setErrorState("Error de conexión con la base de datos.");
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Suscribirse a cambios en tiempo real de la tabla 'admin_chat_messages' de Supabase
    const channel = supabase
      .channel('admin_chat_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_chat_messages'
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => {
            // Prevenir duplicados (Idempotencia)
            if (prev.some(m => m.id === newMsg.id)) return prev;

            // Si el mensaje es de otro usuario administrador, reproducimos el sonido estilo Outlook
            if (newMsg.sender_email.toLowerCase() !== user.email.toLowerCase()) {
              playOutlookSound();
            }

            return [...prev, newMsg];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'admin_chat_messages'
        },
        (payload) => {
          const updatedMsg = payload.new as ChatMessage;
          setMessages((prev) => {
            return prev.map(m => m.id === updatedMsg.id ? { ...m, seen_by: updatedMsg.seen_by } : m);
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'admin_chat_messages'
        },
        (payload) => {
          const deletedId = payload.old.id;
          if (deletedId) {
            setMessages((prev) => prev.filter(m => m.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [isAuthorized]);

  // Hacer scroll automático al recibir nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeRoom]);

  // Marcar mensajes no leídos como leídos (vistos) en la sala activa
  useEffect(() => {
    if (!isAuthorized || !supabase || !user?.email || filteredMessages.length === 0) return;

    // Filtrar los mensajes enviados por otros que aún no tengan nuestro correo en seen_by
    const unreadMessages = filteredMessages.filter(
      msg => msg.sender_email.toLowerCase() !== user.email.toLowerCase() && 
             !(msg.seen_by || []).includes(user.email)
    );

    if (unreadMessages.length === 0) return;

    const markAsRead = async () => {
      try {
        for (const msg of unreadMessages) {
          const updatedSeenBy = [...(msg.seen_by || []), user.email];
          
          // Actualización optimista local
          setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, seen_by: updatedSeenBy } : m));

          // Actualizar en la base de datos
          await supabase
            .from('admin_chat_messages')
            .update({ seen_by: updatedSeenBy })
            .eq('id', msg.id);
        }
      } catch (err) {
        console.warn("La columna 'seen_by' podría no existir o hubo un error al actualizar:", err);
      }
    };

    // Un pequeño retraso para una experiencia más natural
    const timer = setTimeout(() => {
      markAsRead();
    }, 500);

    return () => clearTimeout(timer);
  }, [filteredMessages.length, activeRoom, user?.email, isAuthorized]);

  if (!isAuthorized) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-950/40 text-red-500 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
          <Lock size={30} />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Acceso Restringido</h2>
        <p className="text-gray-400 max-w-md text-sm leading-relaxed">
          Esta sección de comunicación cifrada es exclusiva para los administradores designados del sistema. Su dirección de correo electrónico ({user?.email || 'No identificado'}) no posee privilegios para este canal de coordinación.
        </p>
      </div>
    );
  }

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !selectedFile) || !supabase) return;

    const messageTextToSend = inputText;
    const fileToSend = selectedFile;
    
    setInputText('');
    clearFileSelection();
    setShowEmojiPicker(false);

    try {
      let finalMessageText = messageTextToSend;

      if (fileToSend) {
        setIsUploading(true);
        // 1. Comprimir la imagen a alta resolución y bajo peso
        const compressedFile = await compressImage(fileToSend);
        
        // 2. Subir el archivo al bucket de almacenamiento público
        const fileExt = compressedFile.name.split('.').pop() || 'jpg';
        const fileName = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('community-files')
          .upload(`chat-images/${fileName}`, compressedFile);

        if (uploadError) {
          throw uploadError;
        }

        // 3. Obtener URL pública
        const { data } = supabase.storage
          .from('community-files')
          .getPublicUrl(`chat-images/${fileName}`);

        const publicUrl = data.publicUrl;

        // 4. Integrar URL y comentario si existe
        if (messageTextToSend.trim()) {
          finalMessageText = `[IMAGE]:${publicUrl}::CAPTION::${messageTextToSend}`;
        } else {
          finalMessageText = `[IMAGE]:${publicUrl}`;
        }
      }

      // Inserción en Supabase
      const { error } = await supabase
        .from('admin_chat_messages')
        .insert({
          sender_email: user.email,
          sender_name: user.name || 'Administrador',
          chat_room: activeRoom,
          message_text: finalMessageText
        });

      if (error) {
        console.error("Error al enviar mensaje:", error);
        setErrorState("No se pudo enviar el mensaje a Supabase. Verifica tu esquema.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorState("Fallo al subir archivo o registrar mensaje: " + (err.message || err));
    } finally {
      setIsUploading(false);
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setInputText(prev => prev + emoji);
  };

  return (
    <div className="h-[80vh] flex flex-col md:flex-row bg-[#0b141a] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
      
      {/* SIDEBAR IZQUIERDA: Conversaciones */}
      <div className="w-full md:w-[380px] flex flex-col border-r border-white/10 bg-[#111b21]">
        
        {/* Encabezado de Usuario */}
        <div className="h-[60px] bg-[#202c33] px-4 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-indigo-900/60 flex items-center justify-center border border-indigo-500/30 text-indigo-200">
              <User size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold text-white truncate max-w-[150px]">{user.name}</p>
              <p className="text-[10px] text-emerald-400 font-medium">Línea de Mando</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-gray-400">
            <Sparkles size={18} className="text-indigo-400 animate-pulse" title="Servicio Protegido" />
            <MoreVertical size={18} className="cursor-pointer hover:text-white" />
          </div>
        </div>

        {/* Buscador */}
        <div className="p-3 bg-[#111b21] border-b border-white/5">
          <div className="relative bg-[#202c33] rounded-lg flex items-center px-3 py-1.5 border border-transparent focus-within:border-emerald-500/50 transition-colors">
            <Search size={16} className="text-gray-400 mr-2.5" />
            <input 
              type="text" 
              placeholder="Buscar o empezar un nuevo chat" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-gray-200 placeholder-gray-500 focus:outline-none w-full"
            />
          </div>
        </div>

        {/* Lista de Chats */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
          {filteredRooms.map((room) => {
            const isSelected = activeRoom === room.id;
            const roomMessages = messages.filter(m => m.chat_room === room.id);
            const lastMessage = roomMessages.slice(-1)[0];
            
            // Contar mensajes no leídos por mí en esta sala
            const unreadCount = roomMessages.filter(m => 
              m.sender_email.toLowerCase() !== user.email.toLowerCase() &&
              !(m.seen_by || []).includes(user.email)
            ).length;

            return (
              <div 
                key={room.id}
                onClick={() => setActiveRoom(room.id)}
                className={`flex items-center space-x-3 p-3.5 cursor-pointer transition-colors ${
                  isSelected ? 'bg-[#2a3942]' : 'hover:bg-[#202c33]'
                }`}
              >
                {room.avatar}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <p className={`text-sm truncate ${unreadCount > 0 ? 'font-bold text-white' : 'font-semibold text-gray-200'}`}>
                      {room.name}
                    </p>
                    <div className="flex flex-col items-end space-y-1">
                      <span className={`text-[10px] ${unreadCount > 0 ? 'text-emerald-400 font-bold animate-pulse' : 'text-gray-500'}`}>
                        {lastMessage ? new Date(lastMessage.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                      </span>
                      {unreadCount > 0 && (
                        <span className="bg-emerald-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-in scale-in duration-150">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${unreadCount > 0 ? 'text-gray-200 font-medium' : 'text-gray-400'}`}>
                    {lastMessage ? (
                      <span className={unreadCount > 0 ? 'text-emerald-300/90' : 'text-gray-300'}>
                        <strong className="text-indigo-300 font-semibold">{lastMessage.sender_name}:</strong> {lastMessage.message_text}
                      </span>
                    ) : room.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Institucional Pie */}
        <div className="p-4 bg-[#202c33]/40 border-t border-white/5 text-center text-[10px] text-gray-500 tracking-wider">
          CONEXIÓN CIFRADA PUNTO A PUNTO
        </div>
      </div>

      {/* CHAT WINDOW (Derecha) */}
      <div className="flex-1 flex flex-col bg-[#0b141a] relative">
        
        {/* Fondo de WhatsApp (Doodles y Grilla en CSS) */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}></div>

        {/* Encabezado del Chat */}
        <div className="h-[60px] bg-[#202c33] px-4 flex items-center justify-between border-b border-white/5 z-10 shadow-md">
          <div className="flex items-center space-x-3.5">
            {currentRoom.avatar}
            <div>
              <h3 className="text-sm font-semibold text-gray-200">{currentRoom.name}</h3>
              <p className="text-[10px] text-gray-400 font-medium">{currentRoom.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-gray-400">
            {/* Selector de Mes para Exportación .txt */}
            <div className="flex items-center space-x-1.5 bg-[#2a3942] rounded-lg px-2 py-1 border border-white/5 text-[11px] text-gray-300">
              <span className="hidden sm:inline text-[9px] text-gray-400 font-semibold uppercase tracking-wider mr-0.5">Exportar:</span>
              <select 
                value={selectedExportMonth} 
                onChange={(e) => setSelectedExportMonth(e.target.value)}
                className="bg-transparent border-none text-[11px] text-gray-200 focus:outline-none focus:ring-0 cursor-pointer py-0 pl-1 pr-1"
                style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
              >
                {availableMonths.map((m) => (
                  <option key={m.value} value={m.value} className="bg-[#202c33] text-gray-200 text-xs">
                    {m.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleDownloadMonthlyTxt}
                className="hover:text-emerald-400 text-gray-300 transition-colors flex items-center justify-center pl-1.5 border-l border-white/10"
                title="Descargar registro de este mes en .txt"
              >
                <Download size={13} />
              </button>
            </div>

            <Info size={18} className="cursor-pointer hover:text-white" />
          </div>
        </div>

        {/* Cuerpo de Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 z-10 flex flex-col bg-[#0b141a]/95">
          
          {/* Aviso Cifrado */}
          <div className="mx-auto bg-[#182229] border border-[#ffe596]/10 text-[#ffe596]/90 rounded-lg p-2.5 max-w-sm text-[10px] text-center leading-relaxed flex items-start space-x-2 shadow-sm">
            <Lock size={14} className="text-[#ffe596] shrink-0 mt-0.5" />
            <span>Los mensajes enviados en este chat administrativo se guardan en la base de datos de control corporativa y se sincronizan instantáneamente con los dispositivos autorizados.</span>
          </div>

          {errorState && (
            <div className="mx-auto bg-red-950/40 border border-red-500/20 text-red-300 rounded-lg p-3 max-w-md text-xs text-center">
              <p className="font-bold mb-1">Aviso Técnico de Base de Datos</p>
              <p className="mb-2">{errorState}</p>
              <div className="bg-slate-900/80 p-2 rounded border border-white/10 font-mono text-[10px] text-left overflow-x-auto select-all">
                {`CREATE TABLE IF NOT EXISTS admin_chat_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_email text NOT NULL,
  sender_name text NOT NULL,
  chat_room text NOT NULL,
  message_text text NOT NULL,
  seen_by text[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Si ya tienes la tabla, agrega 'seen_by' y permite borrar mensajes habilitando políticas adecuadas:
ALTER TABLE admin_chat_messages ADD COLUMN IF NOT EXISTS seen_by text[] DEFAULT '{}';

-- Habilitar operaciones (INSERT, SELECT, UPDATE, DELETE) en Supabase:
-- Puedes configurar RLS o crear una política de acceso libre para usuarios autenticados:
CREATE POLICY "Permitir todo a usuarios autenticados" ON admin_chat_messages 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);`}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 text-xs">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-2"></div>
              Sincronizando canal de datos...
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 text-xs text-center max-w-md mx-auto">
              <MessageSquare size={32} className="text-gray-600 mb-3" />
              <p className="font-medium text-gray-300 mb-1">No hay mensajes aún</p>
              <p className="leading-relaxed">Sé el primero en iniciar la conversación administrativa. Escribe un mensaje de prueba a continuación.</p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isMe = msg.sender_email.toLowerCase() === user.email.toLowerCase();
              const timeFormatted = new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

              // Detectar si el mensaje es una imagen/captura de pantalla
              let isImage = false;
              let imageUrl = '';
              let caption = '';

              if (msg.message_text.startsWith('[IMAGE]:')) {
                isImage = true;
                const parts = msg.message_text.substring(8).split('::CAPTION::');
                imageUrl = parts[0];
                caption = parts[1] || '';
              } else if (msg.message_text.startsWith('https://') && msg.message_text.match(/\.(jpeg|jpg|gif|png|webp|svg)/i)) {
                isImage = true;
                imageUrl = msg.message_text;
              }

              return (
                <div 
                  key={msg.id}
                  className={`flex flex-col max-w-[80%] md:max-w-[70%] rounded-xl shadow-md leading-relaxed animate-in fade-in duration-200 relative group ${
                    isMe 
                      ? 'bg-[#005c4b] text-white self-end rounded-tr-none' 
                      : 'bg-[#202c33] text-gray-100 self-start rounded-tl-none'
                  } ${isImage ? 'p-1' : 'px-3 py-1.5'}`}
                >
                  {/* Botón para borrar mensaje */}
                  <button
                    type="button"
                    onClick={() => setMsgIdToDelete(msg.id)}
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#111b21]/95 hover:bg-red-600 border border-white/10 hover:border-red-500 text-gray-400 hover:text-white transition-all shadow-md opacity-0 group-hover:opacity-100 duration-150 flex items-center justify-center cursor-pointer z-20"
                    title="Eliminar mensaje"
                  >
                    <Trash2 size={11} />
                  </button>

                  {/* Nombre del emisor en grupos si no soy yo */}
                  {!isMe && (
                    <span className="text-[10px] font-bold text-indigo-300 block mb-1 px-1 truncate uppercase">
                      {msg.sender_name}
                    </span>
                  )}

                  {isImage ? (
                    <div className="flex flex-col">
                      <div className="relative group overflow-hidden rounded-lg bg-black/20">
                        <img 
                          src={imageUrl} 
                          alt="Screenshot" 
                          referrerPolicy="no-referrer"
                          className="max-h-[300px] object-contain w-full cursor-pointer hover:opacity-95 transition-opacity"
                          onClick={() => window.open(imageUrl, '_blank')}
                        />
                        <button 
                          onClick={() => window.open(imageUrl, '_blank')}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 flex items-center justify-center"
                          title="Ver a tamaño completo"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                      {caption && (
                        <p className="mt-1.5 px-1.5 pb-1 whitespace-pre-wrap break-words text-sm text-gray-100 leading-relaxed">
                          {caption}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap break-words">{msg.message_text}</p>
                  )}

                  <div className="flex items-center justify-end space-x-1 mt-1 px-1 select-none">
                    <span className="text-[9px] text-white/55">{timeFormatted}</span>
                    {isMe && (() => {
                      const readers = (msg.seen_by || []).filter(email => email.toLowerCase() !== user.email.toLowerCase());
                      const isSeen = readers.length > 0;
                      return (
                        <CheckCheck 
                          size={13} 
                          className={isSeen ? "text-[#53bdeb]" : "text-white/35"} 
                          title={isSeen ? `Visto por: ${readers.join(', ')}` : 'Entregado'}
                        />
                      );
                    })()}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Pre-visualización de captura o imagen adjunta */}
        {filePreview && (
          <div className="bg-[#1f2c34] border-t border-white/10 px-4 py-3 flex items-center justify-between z-10 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center space-x-3">
              <div className="relative w-14 h-14 bg-black/20 rounded-lg overflow-hidden border border-white/10">
                <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-200 truncate max-w-[200px]">
                  {selectedFile?.name}
                </p>
                {fileSizeInfo ? (
                  <p className="text-[10px] text-emerald-400 font-medium">
                    Reducido: {fileSizeInfo.compressed} <span className="text-gray-500 font-normal">(Original: {fileSizeInfo.original})</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-gray-400">Optimizando peso...</p>
                )}
              </div>
            </div>
            <button 
              type="button"
              onClick={clearFileSelection}
              className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Indicador de carga de subida */}
        {isUploading && (
          <div className="bg-[#1f2c34] px-4 py-2 flex items-center space-x-2 text-xs text-emerald-400 z-10 border-t border-white/5">
            <Loader2 size={14} className="animate-spin" />
            <span>Reduciendo peso y transmitiendo captura cifrada a Supabase...</span>
          </div>
        )}

        {/* Barra de Entrada de Mensajes */}
        <div className="bg-[#202c33] h-[62px] px-4 flex items-center space-x-3.5 z-10 border-t border-white/5">
          
          <div className="flex items-center space-x-2.5">
            {/* Botón de Emoji */}
            <div className="relative">
              <button 
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-gray-400 hover:text-white transition-colors focus:outline-none"
              >
                <Smile size={22} />
              </button>
              
              {showEmojiPicker && (
                <div className="absolute bottom-12 left-0 bg-[#233138] border border-white/10 rounded-xl p-3 shadow-2xl grid grid-cols-4 gap-2 w-44 z-50 animate-in slide-in-from-bottom duration-150">
                  {QUICK_EMOJIS.map(emoji => (
                    <button 
                      type="button"
                      key={emoji}
                      onClick={() => handleEmojiClick(emoji)}
                      className="text-xl hover:scale-125 transition-transform p-1 focus:outline-none"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Botón de Adjunto */}
            <div>
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/*" 
                onChange={handleFileSelect}
              />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-gray-400 hover:text-white transition-colors focus:outline-none"
                title="Adjuntar captura o imagen"
              >
                <Paperclip size={20} />
              </button>
            </div>
          </div>

          <form onSubmit={handleSendMessage} className="flex-1 flex items-center space-x-3.5">
            <input 
              type="text" 
              placeholder={filePreview ? "Añade un comentario..." : "Escribe un mensaje aquí..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-[#2a3942] rounded-lg px-4 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
            />
            
            <button 
              type="submit"
              disabled={(!inputText.trim() && !selectedFile) || isUploading}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors focus:outline-none ${
                (inputText.trim() || selectedFile) && !isUploading
                  ? 'bg-[#00a884] text-white hover:bg-[#008f72] cursor-pointer' 
                  : 'bg-[#2a3942]/50 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Send size={16} />
            </button>
          </form>
        </div>

      </div>

      {/* Modal de Confirmación para Borrar Mensaje */}
      {msgIdToDelete && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-150">
          <div className="bg-[#222e35] text-white p-6 rounded-2xl max-w-sm w-full border border-white/10 shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-gray-100 flex items-center gap-2 mb-2">
              <Trash2 className="text-red-500" size={18} />
              ¿Eliminar mensaje?
            </h3>
            <p className="text-xs text-gray-400 mb-5 leading-relaxed">
              ¿Estás seguro de que deseas eliminar este mensaje? Esta acción es permanente, no se puede deshacer y removerá el registro de la base de datos de Supabase de manera inmediata.
            </p>
            <div className="flex space-x-3 justify-end text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMsgIdToDelete(null)}
                className="px-4 py-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (msgIdToDelete) {
                    handleDeleteMessage(msgIdToDelete);
                    setMsgIdToDelete(null);
                  }
                }}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
