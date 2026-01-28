
import React, { useEffect, useState } from 'react';
import { 
    Shield, Users, Activity, RefreshCw, FileCheck, CheckCircle, Eye, Trash2, 
    AlertTriangle, X, FileEdit, Radio, Clock, Network, Lock, Monitor, Laptop, 
    Power, UserSearch, ShieldEllipsis, Layers, Key, CheckSquare, Square, Save, Loader
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { appwriteService, normalizeString } from '../services/appwriteService';
import { User } from '../types';
import { PrivacyCertificateModal } from '../components/PrivacyCertificateModal';
import { Link } from 'react-router-dom';

export const AdminPanel: React.FC = () => {
  const { user, onlineUsers, forceLogoutUser, impersonateUser } = useAuth();
  const [usersList, setUsersList] = useState<User[]>([]);
  const [availableAreas, setAvailableAreas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [viewCertificateUser, setViewCertificateUser] = useState<User | null>(null);
  const [privacyPolicyText, setPrivacyPolicyText] = useState('');
  const [deleteConfirmationUser, setDeleteConfirmationUser] = useState<User | null>(null);
  
  // Multi-Area Management State
  const [areaManagerUser, setAreaManagerUser] = useState<User | null>(null);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [isSavingAreas, setIsSavingAreas] = useState(false);

  const [deviceToDelete, setDeviceToDelete] = useState<{userId: string, deviceId: string} | null>(null);
  const [userToDisconnect, setUserToDisconnect] = useState<{userId: string, name: string} | null>(null);
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  
  const loadData = async () => {
    setLoading(true);
    const [usersData, policyData, areasData] = await Promise.all([
        appwriteService.adminGetAllUsers(),
        appwriteService.getSystemConfig('privacy_policy'),
        appwriteService.getAllAreas()
    ]);
    setUsersList(usersData);
    setPrivacyPolicyText(policyData || 'Texto de política no disponible.');
    setAvailableAreas(areasData);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleDeleteSignature = async () => {
    if (!deleteConfirmationUser) return;
    setIsDeleting(true);
    const success = await appwriteService.deleteUserPrivacySignature(deleteConfirmationUser.$id);
    if (success) {
        setActionMessage(`Firma revocada para ${deleteConfirmationUser.name}.`);
        await loadData();
        setDeleteConfirmationUser(null);
        setTimeout(() => setActionMessage(null), 4000);
    }
    setIsDeleting(false);
  };

  const handleExecuteDeviceRemoval = async () => {
      if (!deviceToDelete) return;
      setIsDeleting(true);
      const success = await appwriteService.adminDeleteAuthorizedDevice(deviceToDelete.userId, deviceToDelete.deviceId);
      if (success) {
          setActionMessage("ID de Hardware eliminado correctamente.");
          await loadData();
          setDeviceToDelete(null);
          setTimeout(() => setActionMessage(null), 4000);
      }
      setIsDeleting(false);
  };

  const handleExecuteForceLogout = async () => {
      if (!userToDisconnect) return;
      setIsDeleting(true);
      await forceLogoutUser(userToDisconnect.userId);
      setActionMessage(`Se ha enviado la señal de desconexión a ${userToDisconnect.name}.`);
      setUserToDisconnect(null);
      setIsDeleting(false);
      setTimeout(() => setActionMessage(null), 4000);
  };

  const openAreaManager = (u: User) => {
      setAreaManagerUser(u);
      setSelectedAreas(u.allowedAreas.map(a => normalizeString(a)));
  };

  const toggleArea = (area: string) => {
      const norm = normalizeString(area);
      setSelectedAreas(prev => 
        prev.includes(norm) ? prev.filter(a => a !== norm) : [...prev, norm]
      );
  };

  const handleSaveAreas = async () => {
      if (!areaManagerUser) return;
      setIsSavingAreas(true);
      const success = await appwriteService.adminUpdateUserAreas(areaManagerUser.$id, selectedAreas);
      if (success) {
          setActionMessage(`Autorizaciones actualizadas para ${areaManagerUser.name}.`);
          await loadData();
          setAreaManagerUser(null);
          setTimeout(() => setActionMessage(null), 4000);
      } else {
          alert("Error al guardar cambios de área.");
      }
      setIsSavingAreas(false);
  };

  const signedUsers = usersList.filter(u => u.privacyAccepted);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-950 to-slate-900 rounded-2xl p-8 text-white shadow-xl flex items-center justify-between border-b-4 border-indigo-900 relative overflow-hidden">
        {actionMessage && (
            <div className="absolute top-0 left-0 right-0 bg-emerald-600 text-white text-center py-2 text-sm font-bold animate-in slide-in-from-top duration-300 z-10">
                {actionMessage}
            </div>
        )}
        
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-white/10 rounded-lg">
                <Shield className="text-indigo-300" size={32} />
            </div>
            <h1 className="text-3xl font-bold">Panel de Administrador</h1>
          </div>
          <p className="text-indigo-200">
            Acceso restringido. Bienvenido, <span className="font-bold text-white">{user?.name}</span>.
          </p>
        </div>
        <div className="text-right">
            <span className="block px-4 py-1 rounded-full bg-red-900/50 border border-red-500/50 text-red-200 text-xs font-mono uppercase tracking-widest mb-2 shadow-sm">
                Root Access
            </span>
            <p className="text-xs text-indigo-400 font-mono">v1.6 System</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-white/10 relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-900/20 text-indigo-400 rounded-lg group-hover:bg-indigo-900/40 transition-colors">
              <Users size={24} />
            </div>
            <span className="text-2xl font-bold text-white">{usersList.length}</span>
          </div>
          <h3 className="font-semibold text-gray-200">Usuarios Registrados</h3>
          <p className="text-sm text-gray-500 mt-1">Total de cuentas en plataforma.</p>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-white/10 relative overflow-hidden flex flex-col justify-between group hover:border-purple-500/30 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-900/20 text-purple-400 rounded-lg group-hover:bg-purple-900/40 transition-colors">
                <FileCheck size={24} />
                </div>
                <span className="text-2xl font-bold text-white">{signedUsers.length}</span>
            </div>
            <h3 className="font-semibold text-gray-200">Consentimientos</h3>
            <p className="text-sm text-gray-500 mt-1">Avisos de privacidad firmados.</p>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5">
            <Link to="/admin/privacy-editor" className="flex items-center justify-center w-full py-2 px-4 bg-purple-900/20 text-purple-300 rounded-lg text-sm font-bold hover:bg-purple-900/40 transition-colors uppercase tracking-wide border border-purple-500/20">
                <FileEdit size={16} className="mr-2" />
                Editar Aviso
            </Link>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-blue-500/30 transition-colors group">
          <div className="flex items-center justify-between mb-4">
             <div className="p-3 bg-blue-900/20 text-blue-400 rounded-lg group-hover:bg-blue-900/40 transition-colors relative">
              <Radio size={24} />
              <span className="absolute top-2 right-2 flex h-2 w-2">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
            </div>
            <span className="text-3xl font-bold text-blue-400">{onlineUsers.length}</span>
          </div>
          <h3 className="font-semibold text-gray-200">Conexiones Activas</h3>
          <p className="text-sm text-gray-500 mt-1">Sockets abiertos actualmente.</p>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-white/10 hover:border-emerald-500/30 transition-colors group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-900/20 text-emerald-400 rounded-lg group-hover:bg-emerald-900/40 transition-colors">
                    <Activity size={24} />
                </div>
                <span className="text-emerald-400 text-xs font-bold bg-emerald-900/20 px-2 py-1 rounded border border-emerald-500/20">Online</span>
            </div>
            <h3 className="font-semibold text-gray-200">Sistema</h3>
            <p className="text-sm text-gray-500 mt-1">Servicios operando.</p>
          </div>
          
          <div className="mt-4 pt-4 border-t border-white/5">
            <Link to="/admin/lock-preview" className="flex items-center justify-center w-full py-2 px-4 bg-slate-800 text-gray-300 rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors">
                <Lock size={14} className="mr-2" />
                Ver Pantalla Bloqueo
            </Link>
          </div>
        </div>
      </div>
      
      <div className="bg-slate-900 rounded-xl shadow-sm border border-blue-500/20 overflow-hidden mt-8 ring-1 ring-blue-900/20">
         <div className="p-6 border-b border-blue-900/30 bg-blue-900/10 flex justify-between items-center">
             <h3 className="font-bold text-blue-300 flex items-center">
                 <Monitor size={18} className="mr-2 text-blue-500" />
                 Monitor de Sesiones (Realtime Activity)
             </h3>
             <span className="text-xs font-mono text-blue-500 animate-pulse uppercase">● Transmisión de Sockets Activa</span>
         </div>
         <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
                 <thead className="bg-slate-950 text-gray-400 font-medium border-b border-white/10">
                     <tr>
                         <th className="px-6 py-4">Usuario Conectado</th>
                         <th className="px-6 py-4">Área</th>
                         <th className="px-6 py-4">Firma de Hardware (Device ID)</th>
                         <th className="px-6 py-4 text-right">Acciones</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                     {onlineUsers.length === 0 ? (
                         <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No hay otros usuarios conectados en este momento.</td></tr>
                     ) : (
                         onlineUsers.map((u, index) => (
                             <tr key={`${u.userId}-${index}`} className="hover:bg-blue-900/10 transition-colors group">
                                 <td className="px-6 py-4 font-medium text-white flex items-center">
                                     <div className="w-2 h-2 rounded-full bg-emerald-500 mr-3 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                     <div>
                                         {u.name}
                                         <span className="block text-xs text-gray-500 font-normal">{u.email}</span>
                                     </div>
                                 </td>
                                 <td className="px-6 py-4 text-gray-300">
                                     <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-800 text-gray-300 border border-white/5">
                                        {u.area}
                                     </span>
                                 </td>
                                 <td className="px-6 py-4">
                                     <div className="flex items-center space-x-2 text-blue-400 font-mono text-xs">
                                         <Network size={12} className="opacity-50" />
                                         <span className="bg-blue-900/20 px-2 py-0.5 rounded border border-blue-500/20 group-hover:bg-blue-900/40 transition-colors">
                                            {u.ip}
                                         </span>
                                     </div>
                                 </td>
                                 <td className="px-6 py-4 text-right">
                                     <div className="flex items-center justify-end space-x-2">
                                        <div className="text-xs font-mono text-gray-500 mr-2 flex items-center">
                                            <Clock size={12} className="mr-1 opacity-50"/>
                                            {new Date(u.onlineAt).toLocaleTimeString()}
                                        </div>
                                        <button 
                                            onClick={() => setUserToDisconnect({ userId: u.userId, name: u.name })}
                                            className="p-1.5 bg-red-900/20 text-red-500 rounded border border-red-500/30 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                            title="Finalizar sesión forzosamente"
                                        >
                                            <Power size={14} />
                                        </button>
                                     </div>
                                 </td>
                             </tr>
                         ))
                     )}
                 </tbody>
             </table>
         </div>
      </div>

      <div className="bg-slate-900 rounded-xl shadow-sm border border-white/10 overflow-hidden mt-8">
        <div className="p-6 border-b border-white/10 bg-slate-950/30 flex justify-between items-center">
            <h3 className="font-bold text-gray-200 flex items-center">
                <Users size={18} className="mr-2 text-indigo-400" />
                Directorio General (Identidad de Hardware Guardada)
            </h3>
            <button 
                onClick={loadData} 
                className="p-2 text-gray-500 hover:text-white transition-colors rounded-full hover:bg-white/10"
                title="Recargar lista"
            >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
        </div>
        
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-950 text-gray-400 font-medium border-b border-white/10">
                    <tr>
                        <th className="px-6 py-4">Nombre / Firma Legal</th>
                        <th className="px-6 py-4">Autorización de Acceso</th>
                        <th className="px-6 py-4">IDs de Hardware Autorizados</th>
                        <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {loading ? (
                        <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">Cargando datos...</td></tr>
                    ) : usersList.length === 0 ? (
                        <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No se encontraron usuarios.</td></tr>
                    ) : (
                        usersList.map((u) => (
                            <tr key={u.$id} className="hover:bg-white/5 transition-colors group/row">
                                <td className="px-6 py-4">
                                    <div className="font-semibold text-white uppercase text-xs mb-0.5">
                                        {u.signedName || u.name}
                                    </div>
                                    <div className="text-[10px] text-gray-500 font-mono">{u.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1.5 items-center">
                                        {u.allowedAreas.slice(0, 2).map((area, idx) => (
                                            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black bg-indigo-900/30 text-indigo-300 border border-indigo-500/20 uppercase tracking-tighter">
                                                {area}
                                            </span>
                                        ))}
                                        {u.allowedAreas.length > 2 && (
                                            <span className="text-[9px] font-bold text-gray-500">+{u.allowedAreas.length - 2} más</span>
                                        )}
                                        <button 
                                            onClick={() => openAreaManager(u)}
                                            className="ml-1 p-1 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded transition-colors"
                                            title="Gestionar áreas autorizadas"
                                        >
                                            <ShieldEllipsis size={14} />
                                        </button>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className={`flex flex-col py-1 ${u.authorizedDevices && u.authorizedDevices.length > 1 ? 'gap-4 mb-2' : 'gap-1.5'}`}>
                                        {(!u.authorizedDevices || u.authorizedDevices.length === 0) ? (
                                             <div className="flex items-center text-[10px] font-mono text-gray-600 bg-slate-950/40 px-2 py-1 rounded border border-white/5 w-fit">
                                                <Laptop size={12} className="mr-2 opacity-50" />
                                                Pendiente Registro
                                             </div>
                                        ) : (
                                            u.authorizedDevices.map((devId, dIdx) => (
                                                <div key={dIdx} className="flex items-center group/device">
                                                    <div className="flex items-center text-[10px] font-mono text-indigo-400 bg-indigo-950/40 px-2 py-1 rounded border border-indigo-500/20 w-fit">
                                                        <Laptop size={12} className="mr-2 opacity-50" />
                                                        {devId}
                                                    </div>
                                                    <button 
                                                        onClick={() => setDeviceToDelete({ userId: u.$id, deviceId: devId })}
                                                        className="ml-2 p-1 text-red-500/40 hover:text-red-500 hover:bg-red-900/20 rounded-full transition-all opacity-0 group-hover/device:opacity-100"
                                                        title="Eliminar este ID de hardware"
                                                    >
                                                        <X size={14} strokeWidth={3} />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end space-x-2">
                                        <button 
                                            onClick={() => impersonateUser(u)}
                                            className="p-2 bg-indigo-900/20 text-indigo-400 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm opacity-0 group-hover/row:opacity-100 border border-indigo-500/20"
                                            title="Modo Auditoría (Ingresar como este usuario)"
                                        >
                                            <UserSearch size={16} />
                                        </button>
                                        <span className="inline-flex items-center px-2 py-1 rounded border border-white/10 bg-slate-950 text-[10px] font-mono text-gray-500">
                                            {u.lastIp || 'N/A'}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl shadow-sm border border-white/10 overflow-hidden mt-8">
         <div className="p-6 border-b border-white/10 bg-slate-950/30 flex justify-between items-center">
             <h3 className="font-bold text-gray-200 flex items-center">
                 <CheckCircle size={18} className="mr-2 text-indigo-400" />
                 Bitácora de Cumplimiento Normativo
             </h3>
         </div>
         <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
                 <thead className="bg-slate-950 text-gray-400 font-medium border-b border-white/10">
                     <tr>
                         <th className="px-6 py-4">Usuario Firmante</th>
                         <th className="px-6 py-4">Departamento</th>
                         <th className="px-6 py-4">Estado Legal</th>
                         <th className="px-6 py-4 text-center">Acciones</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                     {signedUsers.length === 0 ? (
                         <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No hay registros de aceptación aún.</td></tr>
                     ) : (
                         signedUsers.map(u => (
                             <tr key={u.$id} className="hover:bg-white/5 transition-colors">
                                 <td className="px-6 py-4 font-medium text-white">
                                     {u.name}
                                     <span className="block text-xs text-gray-500 font-normal">{u.email}</span>
                                 </td>
                                 <td className="px-6 py-4 text-gray-300">{u.area}</td>
                                 <td className="px-6 py-4">
                                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-900/30 text-emerald-400 border border-emerald-500/30">
                                         <CheckCircle size={12} className="mr-1" />
                                         Firmado
                                     </span>
                                 </td>
                                 <td className="px-6 py-4 text-center flex justify-center space-x-2">
                                    <button 
                                        onClick={() => setViewCertificateUser(u)}
                                        className="inline-flex items-center px-3 py-1.5 bg-slate-800 border border-white/10 shadow-sm text-xs font-bold rounded text-gray-300 hover:bg-indigo-900/30 hover:text-indigo-300 hover:border-indigo-500/30 transition-all"
                                        title="Ver Documento"
                                    >
                                        <Eye size={14} className="mr-1.5" />
                                        Ver
                                    </button>
                                    <button 
                                        onClick={() => setDeleteConfirmationUser(u)}
                                        className="inline-flex items-center px-3 py-1.5 bg-slate-800 border border-white/10 shadow-sm text-xs font-bold rounded text-red-400 hover:bg-red-900/20 hover:border-red-500/30 transition-all"
                                        title="Revocar acceso"
                                    >
                                        <Trash2 size={14} className="mr-1.5" />
                                        Revocar
                                    </button>
                                 </td>
                             </tr>
                         ))
                     )}
                 </tbody>
             </table>
         </div>
      </div>

      {/* MODAL DE GESTIÓN MULTI-ÁREA */}
      {areaManagerUser && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full flex flex-col max-h-[85vh] border border-indigo-500/30 overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 bg-slate-950 border-b border-white/10 flex justify-between items-center">
                    <div className="flex items-center">
                        <div className="p-2 bg-indigo-900/30 rounded-lg mr-3 text-indigo-400">
                            <Layers size={20} />
                        </div>
                        <div>
                            <h3 className="font-black text-white uppercase tracking-tight text-sm">Autorización Multi-Área</h3>
                            <p className="text-[10px] text-indigo-400 font-bold uppercase">{areaManagerUser.name}</p>
                        </div>
                    </div>
                    <button onClick={() => setAreaManagerUser(null)} className="text-gray-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 bg-indigo-950/20 border-b border-white/5 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {selectedAreas.length} Áreas Seleccionadas
                    </span>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setSelectedAreas(availableAreas.map(a => normalizeString(a)))}
                            className="text-[9px] font-black text-indigo-400 hover:text-white uppercase"
                        >
                            Seleccionar Todo
                        </button>
                        <span className="text-gray-700">|</span>
                        <button 
                            onClick={() => setSelectedAreas([])}
                            className="text-[9px] font-black text-gray-500 hover:text-white uppercase"
                        >
                            Limpiar
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-950/30">
                    {availableAreas.map((area, idx) => {
                        const isSelected = selectedAreas.includes(normalizeString(area));
                        return (
                            <button 
                                key={idx}
                                onClick={() => toggleArea(area)}
                                className={`flex items-center p-3 rounded-xl border transition-all text-left group ${
                                    isSelected 
                                    ? 'bg-indigo-900/20 border-indigo-500/40 text-white' 
                                    : 'bg-slate-900/50 border-white/5 text-gray-500 hover:border-white/20'
                                }`}
                            >
                                <div className={`mr-3 transition-colors ${isSelected ? 'text-indigo-400' : 'text-gray-700 group-hover:text-gray-400'}`}>
                                    {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-tighter truncate">{area}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="p-6 bg-slate-950 border-t border-white/10 flex gap-3">
                    <button 
                        onClick={() => setAreaManagerUser(null)}
                        className="flex-1 py-3 bg-slate-800 text-gray-400 font-bold rounded-xl text-xs uppercase hover:bg-slate-700 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSaveAreas}
                        disabled={isSavingAreas}
                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs uppercase shadow-lg shadow-indigo-950/40 flex items-center justify-center transition-all"
                    >
                        {isSavingAreas ? <Loader className="animate-spin mr-2" size={16}/> : <Save className="mr-2" size={16}/>}
                        {isSavingAreas ? 'Guardando...' : 'Guardar Accesos'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {viewCertificateUser && (
        <PrivacyCertificateModal 
            user={viewCertificateUser}
            privacyText={privacyPolicyText}
            onClose={() => setViewCertificateUser(null)}
        />
      )}

      {/* MODALES DE ADVERTENCIA EXISTENTES... */}
      {deleteConfirmationUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-xl shadow-2xl max-w-sm w-full p-6 relative animate-in fade-in zoom-in duration-200 border border-white/10">
                <button 
                    onClick={() => setDeleteConfirmationUser(null)} 
                    className="absolute top-4 right-4 text-gray-500 hover:text-white"
                >
                    <X size={20} />
                </button>
                <div className="flex justify-center mb-4">
                    <div className="bg-red-900/30 p-3 rounded-full text-red-500 border border-red-500/30">
                        <AlertTriangle size={32} />
                    </div>
                </div>
                <h3 className="text-lg font-bold text-center text-white mb-2">¿Revocar Acceso Legal?</h3>
                <p className="text-sm text-gray-400 text-center mb-6">Estás a punto de invalidar la firma de privacidad de <strong>{deleteConfirmationUser.name}</strong>.</p>
                <div className="flex space-x-3">
                    <button onClick={() => setDeleteConfirmationUser(null)} className="flex-1 py-2.5 border border-white/20 rounded-lg text-gray-300 font-medium hover:bg-white/5" disabled={isDeleting}>Cancelar</button>
                    <button onClick={handleDeleteSignature} disabled={isDeleting} className="flex-1 py-2.5 bg-red-600 rounded-lg text-white font-bold hover:bg-red-700 disabled:opacity-50">{isDeleting ? 'Procesando...' : 'Sí, Revocar'}</button>
                </div>
            </div>
        </div>
      )}
      
      {deviceToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-xl shadow-2xl max-w-sm w-full p-6 relative animate-in fade-in zoom-in duration-200 border border-red-500/20">
                <button onClick={() => setDeviceToDelete(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20} /></button>
                <div className="flex justify-center mb-4"><div className="bg-red-900/20 p-3 rounded-full text-red-500 border border-red-500/30"><Trash2 size={32} /></div></div>
                <h3 className="text-lg font-bold text-center text-white mb-2 uppercase tracking-tight">¿Eliminar ID de Hardware?</h3>
                <p className="text-sm text-gray-400 text-center mb-6">¿Estás seguro de que deseas eliminar el identificador <span className="text-red-400 font-mono font-bold">{deviceToDelete.deviceId}</span>?</p>
                <div className="flex space-x-3">
                    <button onClick={() => setDeviceToDelete(null)} className="flex-1 py-2.5 border border-white/20 rounded-lg text-gray-300 font-medium hover:bg-white/5 uppercase text-xs font-bold" disabled={isDeleting}>Cancelar</button>
                    <button onClick={handleExecuteDeviceRemoval} disabled={isDeleting} className="flex-1 py-2.5 bg-red-600 rounded-lg text-white font-black hover:bg-red-700 transition-all shadow-lg shadow-red-900/40 uppercase text-xs">{isDeleting ? 'Borrando...' : 'SÍ, ELIMINAR ID'}</button>
                </div>
            </div>
        </div>
      )}

      {userToDisconnect && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-xl shadow-2xl max-w-sm w-full p-6 relative animate-in fade-in zoom-in duration-200 border border-amber-500/20">
                <button onClick={() => setUserToDisconnect(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20} /></button>
                <div className="flex justify-center mb-4"><div className="bg-amber-900/20 p-3 rounded-full text-amber-500 border border-amber-500/30"><Power size={32} /></div></div>
                <h3 className="text-lg font-bold text-center text-white mb-2 uppercase tracking-tight">¿Interrumpir Sesión?</h3>
                <p className="text-sm text-gray-400 text-center mb-6">Estás a punto de cerrar forzosamente la sesión activa de <span className="text-amber-400 font-bold">{userToDisconnect.name}</span>.</p>
                <div className="flex space-x-3">
                    <button onClick={() => setUserToDisconnect(null)} className="flex-1 py-2.5 border border-white/20 rounded-lg text-gray-300 font-medium hover:bg-white/5 uppercase text-xs font-bold" disabled={isDeleting}>Cancelar</button>
                    <button onClick={handleExecuteForceLogout} disabled={isDeleting} className="flex-1 py-2.5 bg-amber-600 rounded-lg text-white font-black hover:bg-amber-700 transition-all shadow-lg shadow-amber-900/40 uppercase text-xs">{isDeleting ? 'Finalizando...' : 'SÍ, CERRAR SESIÓN'}</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
