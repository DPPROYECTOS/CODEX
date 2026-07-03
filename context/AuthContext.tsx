
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, OnlineUser } from '../types';
import { appwriteService } from '../services/appwriteService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  onlineUsers: OnlineUser[]; 
  login: (email: string, password?: string, forceDeviceReset?: boolean) => Promise<void>;
  logout: () => void;
  acceptPrivacy: (signedName?: string, signedDepartment?: string) => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  forceLogoutUser: (userId: string) => Promise<void>;
  impersonateUser: (targetUser: User) => void; 
  stopImpersonating: () => void; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const setUser = (u: User | null | ((prev: User | null) => User | null)) => {
    setUserState(prev => {
      const next = typeof u === 'function' ? u(prev) : u;
      if (next) {
        if (!next.allowedAreas) {
          next.allowedAreas = next.area ? [next.area] : [];
        } else if (!Array.isArray(next.allowedAreas)) {
          next.allowedAreas = [String(next.allowedAreas)];
        }
      }
      return next;
    });
  };
  const [originalAdmin, setOriginalAdmin] = useState<User | null>(null); // Guardar admin real
  const [isLoading, setIsLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  
  const presenceChannel = useRef<any>(null);

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    // CORRECCIÓN: La presencia ahora se transmite SIEMPRE que haya un usuario autenticado.
    // Usamos 'originalAdmin' si existe para que en el monitor aparezca el Admin, 
    // pero operando bajo la "huella" de la terminal actual.
    if (user) {
        // Identidad que se reportará al monitor
        const realIdentity = originalAdmin || user;

        if (!presenceChannel.current) {
            console.log("🟢 Iniciando transmisión de presencia...");
            presenceChannel.current = appwriteService.subscribeToPresence(
                realIdentity, 
                (users) => {
                    setOnlineUsers(users);
                },
                (targetId) => {
                    // Si el broadcast de fuerza de salida es para el usuario real (no el impersonado)
                    if (targetId === realIdentity.$id) {
                        console.warn("🛑 SESIÓN FINALIZADA POR ADMINISTRADOR (VÍA REALTIME)");
                        logout();
                        alert("Tu sesión ha sido finalizada por un administrador.");
                    }
                }
            );
        }
    } else {
        if (presenceChannel.current) {
            console.log("🔴 Pausando transmisión de presencia (Logout)");
            appwriteService.unsubscribeFromPresence(presenceChannel.current);
            presenceChannel.current = null;
        }
    }

    return () => {
        if (presenceChannel.current) {
            appwriteService.unsubscribeFromPresence(presenceChannel.current);
            presenceChannel.current = null;
        }
    };
  }, [user, originalAdmin]);

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

  const login = async (email: string, password?: string, forceDeviceReset?: boolean) => {
    setIsLoading(true);
    try {
      const user = await appwriteService.login(email, password, forceDeviceReset);
      setUser(user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await appwriteService.logout();
    setUser(null);
    setOriginalAdmin(null);
    if (presenceChannel.current) {
        await appwriteService.unsubscribeFromPresence(presenceChannel.current);
        presenceChannel.current = null;
    }
  };

  const impersonateUser = (targetUser: User) => {
    if (!originalAdmin && user) {
        setOriginalAdmin(user);
    }
    setUser({ ...targetUser, isImpersonating: true });
  };

  const stopImpersonating = () => {
    if (originalAdmin) {
        setUser(originalAdmin);
        setOriginalAdmin(null);
    }
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

  const forceLogoutUser = async (targetUserId: string) => {
    if (user && targetUserId === user.$id) {
        await logout();
        return;
    }
    if (presenceChannel.current) {
        await presenceChannel.current.send({
            type: 'broadcast',
            event: 'force_logout',
            payload: { userId: targetUserId }
        });
    }
  };

  return (
    <AuthContext.Provider value={{ 
        user, 
        isLoading, 
        onlineUsers, 
        login, 
        logout, 
        acceptPrivacy, 
        updateUser, 
        forceLogoutUser,
        impersonateUser,
        stopImpersonating
    }}>
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
