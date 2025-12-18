import React, { useEffect, useState } from 'react';
import { Shield, Users, Activity, RefreshCw, FileCheck, CheckCircle, Eye, Trash2, AlertTriangle, X, FileEdit, Radio, Clock, Network, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { appwriteService } from '../services/appwriteService';
import { User } from '../types';
import { PrivacyCertificateModal } from '../components/PrivacyCertificateModal';
import { Link } from 'react-router-dom';

export const AdminPanel: React.FC = () => {
  const { user, onlineUsers } = useAuth();
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [viewCertificateUser, setViewCertificateUser] = useState<User | null>(null);
  const [privacyPolicyText, setPrivacyPolicyText] = useState('');
  const [deleteConfirmationUser, setDeleteConfirmationUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  
  const loadData = async () => {
    setLoading(true);
    const [usersData, policyData] = await Promise.all([
        appwriteService.adminGetAllUsers(),
        appwriteService.getSystemConfig('privacy_policy')
    ]);
    setUsersList(usersData);
    setPrivacyPolicyText(policyData || 'Texto de política no disponible.');
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
    } else {
        alert("Error al eliminar la constancia.");
    }
    setIsDeleting(false);
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
            <p className="text-xs text-indigo-400 font-mono">v1.0 System</p>
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

        <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-white/10 hover:border-blue-500/30 transition-colors group">
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
          <h3 className="font-semibold text-gray-200">Usuarios en Línea</h3>
          <p className="text-sm text-gray-500 mt-1">Sesiones activas en este momento.</p>
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
            <p className="text-sm text-gray-500 mt-1">Todos los servicios operando.</p>
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
                 <Radio size={18} className="mr-2 text-blue-500" />
                 Monitor de Actividad en Tiempo Real
             </h3>
             <span className="text-xs font-mono text-blue-500 animate-pulse uppercase">● Transmitiendo en vivo</span>
         </div>
         <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
                 <thead className="bg-slate-950 text-gray-400 font-medium border-b border-white/10">
                     <tr>
                         <th className="px-6 py-4">Usuario Conectado</th>
                         <th className="px-6 py-4">Área</th>
                         <th className="px-6 py-4">Rol</th>
                         <th className="px-6 py-4 text-right">Inicio de Sesión</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                     {onlineUsers.length === 0 ? (
                         <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No hay otros usuarios conectados en este momento.</td></tr>
                     ) : (
                         onlineUsers.map((u, index) => (
                             <tr key={`${u.userId}-${index}`} className="hover:bg-blue-900/10 transition-colors">
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
                                 <td className="px-6 py-4 text-gray-400 capitalize">{u.role}</td>
                                 <td className="px-6 py-4 text-right text-xs font-mono text-gray-500">
                                     <span className="flex items-center justify-end">
                                        <Clock size={12} className="mr-1.5 opacity-50"/>
                                        {new Date(u.onlineAt).toLocaleTimeString()}
                                     </span>
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

      <div className="bg-slate-900 rounded-xl shadow-sm border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <h3 className="font-bold text-gray-200 flex items-center">
                <Users size={18} className="mr-2 text-gray-500" />
                Directorio General de Usuarios
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
                        <th className="px-6 py-4">Nombre</th>
                        <th className="px-6 py-4">Usuario</th>
                        <th className="px-6 py-4">Área Asignada</th>
                        <th className="px-6 py-4">IP</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {loading ? (
                        <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Cargando datos...</td></tr>
                    ) : usersList.length === 0 ? (
                        <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No se encontraron usuarios en la tabla pública.</td></tr>
                    ) : (
                        usersList.map((u) => (
                            <tr key={u.$id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-semibold text-white uppercase">
                                        {u.signedName || <span className="text-gray-500 italic text-xs capitalize">Sin firmar</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-300">{u.name}</div>
                                    <div className="text-xs text-gray-500">{u.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-900/30 text-indigo-300 border border-indigo-500/30">
                                        {u.area}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2 py-1 rounded border border-white/10 bg-slate-950 text-xs font-mono text-gray-500">
                                        <Network size={12} className="mr-1.5 opacity-50"/>
                                        {u.lastIp || 'N/A'}
                                    </span>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {viewCertificateUser && (
        <PrivacyCertificateModal 
            user={viewCertificateUser}
            privacyText={privacyPolicyText}
            onClose={() => setViewCertificateUser(null)}
        />
      )}

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
                
                <h3 className="text-lg font-bold text-center text-white mb-2">
                    ¿Revocar Acceso Legal?
                </h3>
                
                <p className="text-sm text-gray-400 text-center mb-6">
                    Estás a punto de invalidar la firma de privacidad de <strong>{deleteConfirmationUser.name}</strong>. 
                    El usuario será bloqueado.
                </p>
                
                <div className="flex space-x-3">
                    <button 
                        onClick={() => setDeleteConfirmationUser(null)}
                        className="flex-1 py-2.5 border border-white/20 rounded-lg text-gray-300 font-medium hover:bg-white/5 transition-colors"
                        disabled={isDeleting}
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleDeleteSignature}
                        disabled={isDeleting}
                        className="flex-1 py-2.5 bg-red-600 rounded-lg text-white font-bold hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
                    >
                        {isDeleting ? 'Procesando...' : 'Sí, Revocar'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};