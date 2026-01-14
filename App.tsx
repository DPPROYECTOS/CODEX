
import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Catalog } from './pages/Catalog';
import { ProcedureDetail } from './pages/ProcedureDetail';
import { AdminPanel } from './pages/AdminPanel';
import { AdminPrivacyEditor } from './pages/AdminPrivacyEditor';
import { AdminCertificateEditor } from './pages/AdminCertificateEditor';
import { AdminInbox } from './pages/AdminInbox';
import { AdminRequests } from './pages/AdminRequests';
import { AdminAnalytics } from './pages/AdminAnalytics';
import { AdminProposals } from './pages/AdminProposals';
import { Privacy } from './pages/Privacy';
import { Consultation } from './pages/Consultation';
import { Proposals } from './pages/Proposals';
import { Profile } from './pages/Profile';
import { ScheduleLockScreen } from './components/ScheduleLockScreen';
import { ADMIN_EMAILS } from './types';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#020617] text-indigo-500">Cargando aplicación...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Lógica de Bloqueo de Privacidad
  if (!user.privacyAccepted) {
    return <Privacy />;
  }

  return <>{children}</>;
};

// Guardia específico para la ruta de Admin
const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isLoading } = useAuth();
    if (isLoading) return null;
    
    // Si no está logueado o el email no está en la lista blanca, redirigir
    if (!user || !user.email || !ADMIN_EMAILS.includes(user.email)) {
        return <Navigate to="/" replace />;
    }
    
    return <>{children}</>;
};

// Guardia de Horario (Imperativo)
const ScheduleGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locked, setLocked] = useState(false);
  const [checking, setChecking] = useState(true);
  
  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const day = now.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
      const hour = now.getHours();
      
      let isOpen = false;
      
      // Lunes (1) a Viernes (5): 07:00 a 18:00 (17:59)
      if (day >= 1 && day <= 5) {
        if (hour >= 7 && hour < 18) isOpen = true;
      }
      // Sábado (6): 07:00 a 13:00 (12:59)
      else if (day === 6) {
        if (hour >= 7 && hour < 13) isOpen = true;
      }
      // Domingo (0): Cerrado
      
      setLocked(!isOpen);
      setChecking(false);
    };
    
    checkTime();
    // Revisar cada minuto para bloquear en tiempo real si expira la sesión
    const interval = setInterval(checkTime, 60000); 
    return () => clearInterval(interval);
  }, []);

  if (checking) return null; // O un spinner minimalista
  if (locked) return <ScheduleLockScreen />;

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
    const { user } = useAuth();

    return (
        <Routes>
            <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
            
            {/* RUTA DE PREVIEW PARA ADMINS (Evita el bloqueo para que puedan verla) */}
            <Route path="/admin/lock-preview" element={
                <AdminGuard>
                    <ScheduleLockScreen previewMode={true} />
                </AdminGuard>
            } />

            {/* RUTAS PRINCIPALES PROTEGIDAS POR HORARIO */}
            <Route path="/" element={
                <ProtectedRoute>
                    <ScheduleGuard>
                        <Layout />
                    </ScheduleGuard>
                </ProtectedRoute>
            }>
                <Route index element={<Dashboard />} />
                <Route path="catalog" element={<Catalog />} />
                <Route path="consultation" element={<Consultation />} />
                <Route path="procedure/:id" element={<ProcedureDetail />} />
                <Route path="proposals" element={<Proposals />} />
                <Route path="profile" element={<Profile />} />
                
                {/* Rutas Admin Protegidas */}
                <Route path="admin" element={
                    <AdminGuard>
                        <AdminPanel />
                    </AdminGuard>
                } />
                <Route path="admin/privacy-editor" element={
                    <AdminGuard>
                        <AdminPrivacyEditor />
                    </AdminGuard>
                } />
                <Route path="admin/certificate-editor" element={
                    <AdminGuard>
                        <AdminCertificateEditor />
                    </AdminGuard>
                } />
                <Route path="admin/inbox" element={
                    <AdminGuard>
                        <AdminInbox />
                    </AdminGuard>
                } />
                <Route path="admin/requests" element={
                    <AdminGuard>
                        <AdminRequests />
                    </AdminGuard>
                } />
                <Route path="admin/analytics" element={
                    <AdminGuard>
                        <AdminAnalytics />
                    </AdminGuard>
                } />
                <Route path="admin/proposals" element={
                    <AdminGuard>
                        <AdminProposals />
                    </AdminGuard>
                } />
            </Route>
        </Routes>
    );
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
