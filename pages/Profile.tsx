
import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserCircle, Shield, Key, Camera, Loader } from 'lucide-react';
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

  // Determinar qué imagen mostrar: local (recién subida) -> user.avatarUrl (base de datos) -> Default Icon
  const displayAvatar = localAvatar || user.avatarUrl;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex items-center space-x-6">
        
        {/* Avatar Section */}
        <div className="relative group">
            <div 
                className="w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-300 overflow-hidden border-2 border-indigo-100 cursor-pointer"
                onClick={handleAvatarClick}
            >
                {displayAvatar ? (
                    <img src={displayAvatar} alt="Perfil" className="w-full h-full object-cover" />
                ) : (
                    <UserCircle size={64} />
                )}
            </div>

            {/* Overlay de Edición */}
            <div 
                className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={handleAvatarClick}
            >
                {uploading ? (
                    <Loader size={24} className="text-white animate-spin" />
                ) : (
                    <Camera size={24} className="text-white" />
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

        <div>
          <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
          <p className="text-gray-500 font-medium">{user.email}</p>
          <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-sm font-bold border border-indigo-200">
            Área: {user.area}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 font-bold text-gray-800 flex items-center bg-gray-50/50">
          <Shield size={20} className="mr-2 text-indigo-500" />
          Seguridad
        </div>
        <div className="p-6 space-y-6">
           <div className="flex justify-between items-center py-2">
             <div>
               <p className="font-medium text-gray-700">Contraseña</p>
               <p className="text-sm text-gray-400">Se recomienda cambiarla cada 90 días.</p>
             </div>
             <button className="flex items-center text-indigo-700 hover:text-indigo-900 font-bold text-sm uppercase tracking-wide">
               <Key size={16} className="mr-2" />
               Cambiar Contraseña
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};
