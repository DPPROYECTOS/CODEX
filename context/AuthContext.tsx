
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, OnlineUser } from '../types';
import { appwriteService } from '../services/appwriteService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  onlineUsers: OnlineUser[]; 
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  acceptPrivacy: (signedName?: string, signedDepartment?: string) => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  forceLogoutUser: (userId: string) => Promise<void>; // Nueva función para admins
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  
  const presenceChannel = useRef<any>(null);

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (user) {
        if (!presenceChannel.current) {
            console.log("🟢 Iniciando transmisión de presencia...");
            presenceChannel.current = appwriteService.subscribeToPresence(
                user, 
                (users) => {
                    setOnlineUsers(users);
                },
                (targetId) => {
                    // Este es el listener de broadcast para desconexión forzada
                    if (targetId === user.$id) {
                        console.warn("🛑 SESIÓN FINALIZADA POR ADMINISTRADOR (VÍA REALTIME)");
                        logout();
                        alert("Tu sesión ha sido finalizada por un administrador.");
                    }
                }
            );
        }
    } else {
        if (presenceChannel.current) {
            console.log("🔴 Cerrando transmisión de presencia...");
            appwriteService.unsubscribeFromPresence(presenceChannel.current);
            presenceChannel.current = null;
            setOnlineUsers([]);
        }
    }

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

  // Función para que el admin mande la señal de logout por el canal
  const forceLogoutUser = async (targetUserId: string) => {
    // 1. SI SOY YO MISMO: Logout local instantáneo (el WebSocket me ignoraría)
    if (user && targetUserId === user.$id) {
        console.warn("🛑 AUTO-DESCONEXIÓN EJECUTADA");
        await logout();
        return;
    }

    // 2. SI ES OTRO: Enviar broadcast por Realtime
    if (presenceChannel.current) {
        await presenceChannel.current.send({
            type: 'broadcast',
            event: 'force_logout',
            payload: { userId: targetUserId }
        });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, onlineUsers, login, logout, acceptPrivacy, updateUser, forceLogoutUser }}>
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
