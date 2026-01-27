
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  UserCircle, Shield, Camera, Loader, Mail, Briefcase, 
  ShieldCheck, Diamond, MonitorCheck, Laptop, Cpu, 
  Fingerprint, Lock, Server, Radio, CircleDot, 
  Users, Search, ChevronRight, AlertCircle, X, CheckCircle2
} from 'lucide-react';
import { appwriteService } from '../services/appwriteService';
import { User, ADMIN_EMAILS } from '../types';

export const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Admin states
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  const isAdminByEmail = user?.email && ADMIN_EMAILS.some(e => e.toLowerCase() === user.email.toLowerCase());
  const isAdminByRole = user?.role === 'admin';
  const isRealAdmin = isAdminByEmail || isAdminByRole;
  
  // Solo los administradores o quienes estén auditando (impersonating) ven la sección técnica
  const canSeeSecurityData = isRealAdmin || user?.isImpersonating;

  useEffect(() => {
    if (isRealAdmin) {
        fetchGlobalUsers();
    }
  }, [isRealAdmin]);

  const fetchGlobalUsers = async () => {
      setLoadingUsers(true);
      try {
          const data = await appwriteService.adminGetAllUsers();
          setAllUsers(data);
      } catch (e) {
          console.error("Error cargando usuarios globales", e);
      }
      setLoadingUsers(false);
  };

  if (!user) return null;

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && user) {
        setUploading(true);
        const publicUrl = await appwriteService.uploadUserAvatar(user.$id, file);
        if (publicUrl) {
            setLocalAvatar(publicUrl);
            updateUser({ avatarUrl: publicUrl });
        } else {
            alert("Error al subir la imagen. Verifica tu conexión o formato.");
        }
        setUploading(false);
    }
  };

  const filteredUsers = allUsers.filter(u => 
    u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    u.area.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const displayAvatar = localAvatar || user.avatarUrl;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* SECCIÓN 1: IDENTIDAD PURA (VISIBLE PARA TODOS) */}
      <div className="bg-slate-900 rounded-3xl shadow-2xl border border-white/10 p-8 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
        
        {/* Avatar Section */}
        <div className="relative shrink-0">
            <div 
                className="w-44 h-44 rounded-full bg-slate-950 flex items-center justify-center text-indigo-300 overflow-hidden border-4 border-indigo-500/20 cursor-pointer shadow-[0_0_40px_rgba(79,70,229,0.1)] transition-all hover:border-indigo-500/50 duration-500"
                onClick={handleAvatarClick}
            >
                {displayAvatar ? (
                    <img src={displayAvatar} alt="Perfil" className="w-full h-full object-cover" />
                ) : (
                    <UserCircle size={120} className="text-slate-800" />
                )}
            </div>

            <div 
                className="absolute inset-2 bg-black/70 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm"
                onClick={handleAvatarClick}
            >
                {uploading ? (
                    <Loader size={32} className="text-indigo-400 animate-spin" />
                ) : (
                    <>
                      <Camera size={32} className="text-white mb-2" />
                      <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">ACTUALIZAR</span>
                    </>
                )}
            </div>

            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
            />
        </div>

        <div className="flex-1 text-center md:text-left z-10">
          <p className="text-indigo-400 text-xs font-black uppercase tracking-[0.3em] mb-2">Identidad Digital Nexus</p>
          <h2 className="text-4xl font-black text-white tracking-tight uppercase leading-none mb-6">{user.name}</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
              <div className="flex items-center p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                <Briefcase size={20} className="mr-3 text-indigo-400" />
                <div>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Departamento</p>
                    <p className="text-sm font-bold text-gray-200 uppercase">{user.area}</p>
                </div>
              </div>
              <div className="flex items-center p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                <ShieldCheck size={20} className="mr-3 text-emerald-500" />
                <div>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Rol de Sistema</p>
                    <p className="text-sm font-bold text-gray-200 uppercase">{user.role}</p>
                </div>
              </div>
              <div className="flex items-center p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors sm:col-span-2">
                <Mail size={20} className="mr-3 text-indigo-400" />
                <div>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Correo Corporativo</p>
                    <p className="text-sm font-medium text-indigo-300 font-mono">{user.email}</p>
                </div>
              </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: DATOS TÉCNICOS (SOLO ADMINISTRADORES) */}
      {canSeeSecurityData ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-top duration-700">
            
            <div className="space-y-6">
                {/* Seguridad Forense */}
                <div className="bg-slate-900 rounded-3xl border border-indigo-500/20 overflow-hidden shadow-xl">
                  <div className="p-6 border-b border-white/10 font-black text-white flex items-center bg-indigo-950/20 uppercase tracking-widest text-xs">
                    <Shield size={16} className="mr-3 text-indigo-500" />
                    Auditoría de Seguridad de Cuenta
                  </div>
                  <div className="p-8 space-y-6">
                     <div className="flex justify-between items-center">
                       <div>
                         <p className="font-bold text-gray-200 text-sm">Autenticación Corporativa</p>
                         <p className="text-[10px] text-gray-500 mt-0.5">Sincronizado con Directorio Maestro.</p>
                       </div>
                       <ShieldCheck size={20} className="text-emerald-500" />
                     </div>
                     
                     <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                       <div>
                         <p className="font-bold text-gray-200 text-sm">Doble Factor (2FA)</p>
                         <p className="text-[10px] text-gray-500 mt-0.5">Gestión vía App corporativa.</p>
                       </div>
                       <span className="text-[10px] bg-slate-800 text-gray-500 px-2 py-1 rounded-lg font-black uppercase border border-white/5">INACTIVO</span>
                     </div>
                  </div>
                </div>

                {/* Ecosistema de Terminales */}
                <div className="bg-slate-900 rounded-3xl border border-white/10 overflow-hidden shadow-xl">
                  <div className="p-6 border-b border-white/10 font-black text-white flex items-center bg-slate-950/30 uppercase tracking-widest text-xs">
                    <Server size={16} className="mr-3 text-cyan-500" />
                    Terminales Vinculadas
                  </div>
                  <div className="p-6 space-y-3">
                      {user.authorizedDevices && user.authorizedDevices.length > 0 ? (
                          user.authorizedDevices.map((dev, idx) => {
                              const isCurrent = dev === user.lastDeviceId;
                              return (
                                  <div key={idx} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                                      isCurrent ? 'bg-indigo-900/10 border-indigo-500/40' : 'bg-slate-950/50 border-white/5'
                                  }`}>
                                      <div className="flex items-center">
                                          <div className={`p-2 rounded-xl mr-4 ${isCurrent ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-gray-600'}`}>
                                              <Laptop size={18} />
                                          </div>
                                          <div>
                                              <p className={`text-[10px] font-black uppercase ${isCurrent ? 'text-indigo-400' : 'text-gray-500'}`}>Terminal {idx + 1}</p>
                                              <p className={`text-xs font-mono ${isCurrent ? 'text-white' : 'text-gray-500'}`}>{dev}</p>
                                          </div>
                                      </div>
                                      {isCurrent && <Radio size={14} className="text-emerald-500 animate-pulse" />}
                                  </div>
                              );
                          })
                      ) : (
                          <p className="text-xs text-gray-600 italic p-4 text-center">Sin registros de hardware.</p>
                      )}
                  </div>
                </div>
            </div>

            <div className="space-y-6">
                {/* Estado de Conexión */}
                <div className="bg-slate-900 rounded-3xl border border-white/10 overflow-hidden shadow-xl h-fit">
                  <div className="p-6 border-b border-white/10 font-black text-white flex items-center bg-slate-950/30 uppercase tracking-widest text-xs">
                    <MonitorCheck size={16} className="mr-3 text-amber-500" />
                    Métricas de Conexión
                  </div>
                  <div className="p-8 space-y-4">
                     <div className="flex justify-between text-xs">
                        <span className="text-gray-500 font-bold uppercase">Última IP:</span>
                        <span className="text-white font-mono">{user.lastIp || 'N/A'}</span>
                     </div>
                     <div className="flex justify-between text-xs py-2 border-y border-white/5">
                        <span className="text-gray-500 font-bold uppercase">Tipo de Firma:</span>
                        {user.isAdminHardware ? (
                            <span className="text-indigo-400 font-black flex items-center">
                              <Diamond size={12} className="mr-1.5 fill-indigo-500" /> MAESTRA
                            </span>
                        ) : (
                            <span className="text-gray-400 font-bold">ESTÁNDAR</span>
                        )}
                     </div>
                     <div className="flex justify-between text-xs">
                        <span className="text-gray-500 font-bold uppercase">Límite Equipos:</span>
                        <span className="text-white font-bold">{user.maxDevices || 2}</span>
                     </div>
                  </div>
                </div>

                {user.isAdminHardware && (
                    <div className="bg-indigo-950/20 rounded-3xl border border-indigo-500/20 p-8 shadow-inner">
                        <h4 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] mb-4 flex items-center">
                          <Fingerprint size={16} className="mr-2" /> Certificado de Terminal
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Hardware Identifier [HWID]</p>
                                <p className="text-xs font-mono text-indigo-300 mt-1 break-all">{user.lastDeviceId}</p>
                            </div>
                            <p className="text-[10px] text-indigo-400/60 leading-relaxed italic">
                                Esta terminal está certificada para operaciones de raíz (Root). Cada movimiento está blindado criptográficamente.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
      ) : (
          /* SECCIÓN 3: VISTA PARA USUARIOS (LIMPIA) */
          <div className="bg-slate-900 rounded-[2.5rem] p-12 border border-white/10 text-center animate-in slide-in-from-bottom duration-1000 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-30"></div>
              <div className="max-w-xl mx-auto">
                  <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-500/20">
                    <CheckCircle2 size={48} className="text-emerald-500" />
                  </div>
                  <h3 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">Estado de Integridad: Óptimo</h3>
                  <p className="text-gray-400 text-lg mb-10 leading-relaxed">
                      Tu perfil operativo ha sido validado exitosamente. Cumples con todos los estándares de seguridad y confidencialidad del <strong>ACUR CODEX</strong>.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="bg-slate-950/80 p-6 rounded-3xl border border-white/5 flex flex-col items-center">
                          <ShieldCheck size={24} className="text-indigo-400 mb-3" />
                          <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Firma Digital</span>
                          <span className="text-sm font-bold text-emerald-400 uppercase">VÁLIDA Y VIGENTE</span>
                      </div>
                      <div className="bg-slate-950/80 p-6 rounded-3xl border border-white/5 flex flex-col items-center">
                          <CircleDot size={24} className="text-indigo-400 mb-3" />
                          <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Acceso Nexus</span>
                          <span className="text-sm font-bold text-emerald-400 uppercase">SIN RESTRICCIONES</span>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* SECCIÓN 4: GESTIÓN DE USUARIOS (SOLO ADMINISTRADORES REALES) */}
      {isRealAdmin && (
        <div className="bg-slate-900 rounded-3xl shadow-xl border border-indigo-500/20 overflow-hidden mt-12">
            <div className="p-8 border-b border-white/10 bg-slate-950/50 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h3 className="text-2xl font-black text-white flex items-center uppercase tracking-tighter">
                        <Users className="mr-3 text-indigo-400" size={28} />
                        Control Maestro de Usuarios
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 uppercase tracking-widest font-bold">Base de Datos Global de Colaboradores</p>
                </div>

                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                    <input 
                        type="text" 
                        placeholder="Filtrar colaboradores..."
                        className="w-full pl-12 pr-6 py-4 bg-slate-800 border border-white/10 rounded-2xl text-sm text-white focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all shadow-inner"
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-950 text-gray-400 uppercase font-black text-[10px] tracking-[0.2em] border-b border-white/5">
                        <tr>
                            <th className="px-8 py-6">Colaborador</th>
                            <th className="px-8 py-6">Departamento</th>
                            <th className="px-8 py-6">Estado Legal</th>
                            <th className="px-8 py-6 text-center">Equipos</th>
                            <th className="px-8 py-6 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loadingUsers ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-20 text-center">
                                    <Loader className="animate-spin text-indigo-500 mx-auto mb-4" size={32} />
                                    <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">Sincronizando Base de Datos...</p>
                                </td>
                            </tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr><td colSpan={5} className="px-8 py-20 text-center text-gray-600 italic uppercase font-bold text-xs">Sin resultados</td></tr>
                        ) : (
                            filteredUsers.map((u) => (
                                <tr key={u.$id} className="hover:bg-indigo-500/5 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-indigo-500/30 transition-colors shadow-sm">
                                                {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover"/> : <UserCircle className="text-gray-700" size={32}/>}
                                            </div>
                                            <div>
                                                <p className="font-black text-gray-200 group-hover:text-indigo-400 transition-colors uppercase text-sm">{u.name}</p>
                                                <p className="text-[10px] text-gray-500 font-mono mt-0.5">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-[10px] font-black bg-slate-800 px-3 py-1.5 rounded-xl border border-white/5 text-gray-400 uppercase tracking-tighter">
                                            {u.area}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        {u.privacyAccepted ? (
                                            <div className="flex items-center text-emerald-500 font-black text-[10px] uppercase tracking-widest bg-emerald-950/20 px-2 py-1 rounded-lg border border-emerald-500/20 w-fit">
                                                <ShieldCheck size={12} className="mr-1.5" /> FIRMADO
                                            </div>
                                        ) : (
                                            <div className="flex items-center text-amber-500/50 font-bold text-[10px] uppercase tracking-widest bg-amber-950/20 px-2 py-1 rounded-lg border border-amber-500/20 w-fit">
                                                <AlertCircle size={12} className="mr-1.5" /> PENDIENTE
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-950 rounded-2xl border border-white/5 shadow-inner">
                                            <Laptop size={14} className="text-indigo-400" />
                                            <span className="text-xs font-bold text-gray-300">{(u.authorizedDevices?.length || 0)}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button className="p-3 bg-white/5 hover:bg-indigo-600 hover:text-white text-gray-500 rounded-2xl transition-all opacity-0 group-hover:opacity-100 shadow-sm border border-white/5">
                                            <ChevronRight size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      )}
    </div>
  );
};
