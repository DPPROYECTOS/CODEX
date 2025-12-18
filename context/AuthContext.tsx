
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, OnlineUser } from '../types';
import { appwriteService } from '../services/appwriteService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  onlineUsers: OnlineUser[]; // Lista de usuarios conectados en tiempo real
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  acceptPrivacy: (signedName?: string, signedDepartment?: string) => Promise<void>;
  updateUser: (updates: Partial<User>) => void; // Nueva función para actualizar estado local
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  
  // Referencia para guardar el canal de suscripción y evitar duplicados
  const presenceChannel = useRef<any>(null);

  useEffect(() => {
    checkSession();
  }, []);

  // Efecto para manejar la conexión de Realtime cuando el usuario cambia (Login/Logout)
  useEffect(() => {
    // Si hay usuario logueado, iniciamos la conexión de presencia
    if (user) {
        if (!presenceChannel.current) {
            console.log("🟢 Iniciando transmisión de presencia...");
            presenceChannel.current = appwriteService.subscribeToPresence(user, (users) => {
                setOnlineUsers(users);
            });
        }
    } else {
        // Si no hay usuario, limpiamos la conexión
        if (presenceChannel.current) {
            console.log("🔴 Cerrando transmisión de presencia...");
            appwriteService.unsubscribeFromPresence(presenceChannel.current);
            presenceChannel.current = null;
            setOnlineUsers([]);
        }
    }

    // Cleanup al desmontar el componente
    return () => {
        if (presenceChannel.current) {
            appwriteService.unsubscribeFromPresence(presenceChannel.current);
            presenceChannel.current = null;
        }
    };
  }, [user]);

  const checkSession = async () => {
    try {
      const currentUser = await appwriteService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error("Session check failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      const user = await appwriteService.login(email, password);
      setUser(user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await appwriteService.logout();
    setUser(null);
  };

  const acceptPrivacy = async (signedName?: string, signedDepartment?: string) => {
    if (user) {
        await appwriteService.updateUserPrivacy(user.$id, signedName, signedDepartment);
        setUser(prev => prev ? { 
            ...prev, 
            privacyAccepted: true,
            signedName: signedName,
            signedDepartment: signedDepartment
        } : null);
    }
  };

  const updateUser = (updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, onlineUsers, login, logout, acceptPrivacy, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
