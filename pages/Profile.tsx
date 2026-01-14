
import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserCircle, Shield, Camera, Loader, Mail, Briefcase, ShieldCheck } from 'lucide-react';
import { appwriteService } from '../services/appwriteService';

export const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            // Actualizamos el contexto global para que se vea en el Header inmediatamente
            updateUser({ avatarUrl: publicUrl });
        } else {
            alert("Error al subir la imagen. Verifica tu conexión o formato.");
        }
        setUploading(false);
    }
  };

  const displayAvatar = localAvatar || user.avatarUrl;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Perfil Header Card */}
      <div className="bg-slate-900 rounded-2xl shadow-xl border border-white/10 p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        
        {/* Avatar Section */}
        <div className="relative shrink-0">
            <div 
                className="w-40 h-40 rounded-full bg-slate-950 flex items-center justify-center text-indigo-300 overflow-hidden border-4 border-indigo-500/30 cursor-pointer shadow-2xl transition-transform hover:scale-105 duration-300"
                onClick={handleAvatarClick}
            >
                {displayAvatar ? (
                    <img src={displayAvatar} alt="Perfil" className="w-full h-full object-cover" />
                ) : (
                    <UserCircle size={100} className="text-slate-800" />
                )}
            </div>

            {/* Overlay de Edición */}
            <div 
                className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer border-4 border-indigo-500/50"
                onClick={handleAvatarClick}
            >
                {uploading ? (
                    <Loader size={32} className="text-indigo-400 animate-spin" />
                ) : (
                    <>
                      <Camera size={32} className="text-white mb-2" />
                      <span className="text-[10px] font-bold text-white uppercase tracking-widest">Cambiar Foto</span>
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
          <h2 className="text-3xl font-black text-white tracking-tight uppercase">{user.name}</h2>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
              <div className="flex items-center px-3 py-1.5 rounded-lg bg-indigo-900/30 text-indigo-300 text-xs font-bold border border-indigo-500/20">
                <Briefcase size={14} className="mr-2" />
                ÁREA: {user.area}
              </div>
              <div className="flex items-center px-3 py-1.5 rounded-lg bg-slate-800 text-gray-400 text-xs font-bold border border-white/5">
                <ShieldCheck size={14} className="mr-2 text-emerald-500" />
                ROL: {user.role.toUpperCase()}
              </div>
          </div>
          
          <p className="mt-6 flex items-center justify-center md:justify-start text-gray-400 text-sm font-medium">
            <Mail size={16} className="mr-2 text-indigo-500" />
            {user.email}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Tarjeta de Seguridad */}
          <div className="bg-slate-900 rounded-2xl shadow-sm border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10 font-bold text-white flex items-center bg-slate-950/30 uppercase tracking-widest text-sm">
              <Shield size={18} className="mr-3 text-indigo-500" />
              Seguridad de la Cuenta
            </div>
            <div className="p-8 space-y-6">
               <div className="flex justify-between items-center py-2">
                 <div>
                   <p className="font-bold text-gray-200">Autenticación Corporativa</p>
                   <p className="text-xs text-gray-500 mt-1">Tu acceso está gestionado por las políticas globales de TI.</p>
                 </div>
                 <ShieldCheck size={20} className="text-emerald-500" />
               </div>
               
               <div className="pt-4 border-t border-white/5 flex justify-between items-center py-2">
                 <div>
                   <p className="font-bold text-gray-200">Doble Factor (2FA)</p>
                   <p className="text-xs text-gray-500 mt-1">Capa adicional de seguridad mediante App corporativa.</p>
                 </div>
                 <span className="text-[10px] bg-slate-800 text-gray-500 px-2 py-1 rounded font-bold border border-white/5 uppercase">No Activo</span>
               </div>
            </div>
          </div>

          {/* Tarjeta de Información de Dispositivo */}
          <div className="bg-slate-900 rounded-2xl shadow-sm border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10 font-bold text-white flex items-center bg-slate-950/30 uppercase tracking-widest text-sm">
              <Loader size={18} className="mr-3 text-amber-500" />
              Estado de Conexión
            </div>
            <div className="p-8 space-y-4">
               <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-bold uppercase tracking-tighter">Última IP Detectada:</span>
                  <span className="text-white font-mono">{user.lastIp || '192.168.1.XXX'}</span>
               </div>
               <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-bold uppercase tracking-tighter">Límite de Dispositivos:</span>
                  <span className="text-white font-bold">{user.maxDevices || 2} equipos</span>
               </div>
               <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-bold uppercase tracking-tighter">Estado Legal ACUR:</span>
                  <span className="text-emerald-400 font-bold flex items-center">
                    <ShieldCheck size={14} className="mr-1" />
                    ACTIVO
                  </span>
               </div>
               
               <div className="mt-6 p-4 bg-indigo-950/20 rounded-xl border border-indigo-500/20">
                  <p className="text-[10px] text-indigo-300 leading-relaxed font-medium uppercase tracking-tight">
                    Cualquier discrepancia en su información de área o permisos debe ser reportada de inmediato al Administrador del Sistema.
                  </p>
               </div>
            </div>
          </div>
      </div>
    </div>
  );
};
