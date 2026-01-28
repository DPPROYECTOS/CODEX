
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { appwriteService } from '../services/appwriteService';
import { Procedure, ADMIN_EMAILS } from '../types';
import { 
  FileText, Clock, AlertTriangle, Search, MessageSquare, Key, 
  ArrowRight, ShieldCheck, Monitor, Cpu, 
  Lightbulb, Grid, History, Radio, UserCheck, Shield
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentDocs, setRecentDocs] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        const docs = await appwriteService.getProcedures(user); 
        setRecentDocs(docs.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5));
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
        navigate('/catalog'); 
    }
  };

  if (loading || !user) return (
    <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center">
            <Radio className="animate-pulse text-indigo-500 mb-4" size={48} />
            <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-xs">Sincronizando Terminal...</p>
        </div>
    </div>
  );

  const isAdminByEmail = user.email && ADMIN_EMAILS.some(email => email.toLowerCase() === user.email.toLowerCase());
  const isFullAdmin = isAdminByEmail || user.role === 'admin' || user.isImpersonating;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 relative">
      
      {/* SECCIÓN SUPERIOR: BÚSQUEDA */}
      <div className="relative group">
        <form onSubmit={handleSearchSubmit} className="relative max-w-3xl mx-auto">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-400 group-focus-within:text-indigo-300 transition-colors" size={24} />
            <input 
                type="text"
                placeholder="¿Qué proceso necesitas consultar hoy? (Escribe nombre o código...)"
                className="w-full bg-slate-900/50 backdrop-blur-xl border-2 border-white/10 rounded-2xl py-6 pl-16 pr-8 text-xl text-white outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-2xl placeholder-gray-600 font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-2 pointer-events-none">
                <span className="text-[10px] font-black text-gray-500 border border-white/10 px-2 py-1 rounded bg-black/20 tracking-tighter">ENTER PARA BUSCAR</span>
            </div>
        </form>
      </div>

      {/* BENTO GRID LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* BLOQUE 1: RESUMEN DE IDENTIDAD (IZQUIERDA) */}
        <div className="md:col-span-4 space-y-6">
            
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 relative overflow-hidden group shadow-xl">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    {isFullAdmin ? <Cpu size={80} className="text-indigo-400" /> : <UserCheck size={80} className="text-indigo-400" />}
                </div>
                
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center overflow-hidden border-2 border-indigo-400/30 shadow-lg shadow-indigo-900/40">
                        {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : <span className="text-2xl font-black text-white">{user.name.charAt(0)}</span>}
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white leading-tight uppercase">{user.name.split(' ')[0]} {user.name.split(' ')[1] || ''}</h3>
                        <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest">{user.area}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {isFullAdmin ? (
                        <div className="bg-black/40 rounded-2xl p-4 border border-white/5 animate-in slide-in-from-left">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.1em] mb-2 flex items-center">
                                <Monitor size={12} className="mr-2" /> ID Hardware Autorizado
                            </p>
                            <p className="text-sm font-mono text-indigo-300 truncate tracking-tighter">{user.lastDeviceId}</p>
                        </div>
                    ) : (
                        <div className="bg-emerald-950/20 rounded-2xl p-4 border border-emerald-500/10">
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.1em] mb-1 flex items-center">
                                <Shield size={12} className="mr-2" /> Acceso Validado
                            </p>
                            <p className="text-xs text-emerald-200/60 leading-tight">Tu identidad digital y firma de privacidad están vigentes en el sistema.</p>
                        </div>
                    )}
                    
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={16} className="text-emerald-500" />
                            <span className="text-[10px] font-black text-gray-300 uppercase">Estatus: Perfil Operativo</span>
                        </div>
                        <Link to="/profile" className="text-indigo-400 hover:text-white transition-colors">
                            <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Accesos de Área */}
            <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-3xl p-6 shadow-xl">
                <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center">
                    <Grid size={16} className="mr-2" /> Canales de Visibilidad
                </h4>
                <div className="flex flex-wrap gap-2">
                    {user.allowedAreas.map((area, idx) => (
                        <span key={idx} className="bg-slate-900 text-gray-300 px-3 py-1.5 rounded-xl text-[10px] font-bold border border-white/5 uppercase shadow-sm">
                            {area}
                        </span>
                    ))}
                </div>
                <p className="text-[10px] text-gray-500 mt-4 leading-relaxed italic">
                    Acceso configurado por el administrador según tu perfil.
                </p>
            </div>
        </div>

        {/* BLOQUE 2: ATAJOS Y ACCIONES (CENTRO) */}
        <div className="md:col-span-4 space-y-6">
            <h4 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] pl-2">Centro de Operaciones</h4>
            
            <Link to="/catalog" className="flex items-center justify-between p-6 bg-slate-900 border border-white/10 rounded-3xl hover:border-indigo-500/50 hover:bg-white/5 transition-all group shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-900/30 text-indigo-400 rounded-2xl group-hover:scale-110 transition-transform">
                        <Grid size={24} />
                    </div>
                    <div>
                        <h5 className="font-bold text-white uppercase">Catálogo</h5>
                        <p className="text-xs text-gray-500">Manuales y procesos oficiales.</p>
                    </div>
                </div>
                <ChevronRightIcon />
            </Link>

            <Link to="/consultation" className="flex items-center justify-between p-6 bg-slate-900 border border-white/10 rounded-3xl hover:border-amber-500/50 hover:bg-white/5 transition-all group shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-900/30 text-amber-500 rounded-2xl group-hover:scale-110 transition-transform">
                        <MessageSquare size={24} />
                    </div>
                    <div>
                        <h5 className="font-bold text-white uppercase">Soporte Operativo</h5>
                        <p className="text-xs text-gray-500">Mesa de dudas y consultas.</p>
                    </div>
                </div>
                <ChevronRightIcon />
            </Link>

            <Link to="/proposals" className="flex items-center justify-between p-6 bg-slate-900 border border-white/10 rounded-3xl hover:border-cyan-500/50 hover:bg-white/5 transition-all group shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-cyan-900/30 text-cyan-400 rounded-2xl group-hover:scale-110 transition-transform">
                        <Lightbulb size={24} />
                    </div>
                    <div>
                        <h5 className="font-bold text-white uppercase">Mejora Continua</h5>
                        <p className="text-xs text-gray-500">Ideas para optimizar tu área.</p>
                    </div>
                </div>
                <ChevronRightIcon />
            </Link>

            {isFullAdmin && (
                <Link to="/admin" className="flex items-center justify-between p-6 bg-red-950/10 border border-red-500/20 rounded-3xl hover:border-red-500/50 hover:bg-red-900/10 transition-all group shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-900/30 text-red-500 rounded-2xl">
                            <Key size={24} />
                        </div>
                        <div>
                            <h5 className="font-bold text-white uppercase">Administración</h5>
                            <p className="text-xs text-gray-500">Gestión global del sistema.</p>
                        </div>
                    </div>
                    <ChevronRightIcon />
                </Link>
            )}
        </div>

        {/* BLOQUE 3: FEED DE ACTIVIDAD (DERECHA) */}
        <div className="md:col-span-4 bg-slate-900 border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-xl">
            <div className="p-6 border-b border-white/5 bg-slate-950/30 flex justify-between items-center">
                <h4 className="text-xs font-black text-gray-200 uppercase tracking-widest flex items-center">
                    <History size={16} className="mr-2 text-indigo-400" /> Novedades del Área
                </h4>
                <div className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {recentDocs.length === 0 ? (
                    <div className="py-20 text-center">
                        <FileText className="mx-auto text-slate-800 mb-4" size={40} />
                        <p className="text-gray-600 text-xs font-bold uppercase">Sin actividad reciente</p>
                    </div>
                ) : (
                    recentDocs.map(doc => (
                        <Link 
                            key={doc.$id} 
                            to={`/procedure/${doc.$id}`}
                            className="flex items-start gap-3 p-3 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 group"
                        >
                            <div className="shrink-0 p-2 bg-slate-800 rounded-xl text-gray-500 group-hover:text-indigo-400 transition-colors">
                                <FileText size={18} />
                            </div>
                            <div className="min-w-0">
                                <h6 className="text-sm font-bold text-gray-300 truncate group-hover:text-white transition-colors">{doc.name}</h6>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-tighter">{doc.area}</span>
                                    <span className="text-[9px] text-gray-600 font-mono">v{doc.version}</span>
                                </div>
                                <p className="text-[10px] text-gray-600 mt-1 flex items-center">
                                    <Clock size={10} className="mr-1" /> {new Date(doc.updatedAt).toLocaleDateString()}
                                </p>
                            </div>
                        </Link>
                    ))
                )}
            </div>
            
            <Link to="/catalog" className="p-4 bg-slate-950/50 text-center text-[10px] font-black text-indigo-400 hover:text-white uppercase tracking-[0.2em] border-t border-white/5 transition-colors">
                Explorar Catálogo Completo
            </Link>
        </div>

      </div>

      {/* ADVERTENCIA OPERACIONAL */}
      <div className="bg-amber-900/10 border border-amber-700/30 rounded-3xl p-6 flex items-start shadow-sm backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
        <AlertTriangle className="text-amber-500 mr-4 mt-0.5 flex-shrink-0" size={24} />
        <div>
           <h4 className="font-black text-amber-400 text-xs uppercase tracking-widest mb-1">Protección de la Información Operacional</h4>
           <p className="text-amber-200/60 text-sm leading-relaxed max-w-4xl">
               De acuerdo al <strong>ACUR CODEX</strong>, la información consultada en esta plataforma es propiedad exclusiva de la Corporación. 
               Cualquier intento de extracción, impresión no autorizada o compartición de credenciales será registrado y escalado al Departamento Legal.
           </p>
        </div>
      </div>

      {/* MARCA DE AGUA TÉCNICA DE VERSIÓN */}
      <div className="flex justify-end pt-4 pb-2 opacity-20 pointer-events-none select-none">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">System Build v1.6</span>
      </div>
    </div>
  );
};

const ChevronRightIcon = () => (
    <ArrowRight className="text-gray-700 group-hover:text-white group-hover:translate-x-1 transition-all" size={20} />
);
