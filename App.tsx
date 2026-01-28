
import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Catalog } from './pages/Catalog';
import { ProcedureDetail } from './pages/ProcedureDetail';
import { CommunityContributions } from './pages/CommunityContributions';
import { AdminPanel } from './pages/AdminPanel';
import { AdminPrivacyEditor } from './pages/AdminPrivacyEditor';
import { AdminCertificateEditor } from './pages/AdminCertificateEditor';
import { AdminInbox } from './pages/AdminInbox';
import { AdminRequests } from './pages/AdminRequests';
import { AdminAnalytics } from './pages/AdminAnalytics';
import { AdminProposals } from './pages/AdminProposals';
import { AdminIncidents } from './pages/AdminIncidents';
import { AdminTelemetry } from './pages/AdminTelemetry';
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

  const isMasterHardware = user.isAdminHardware === true;
  const isImpersonating = user.isImpersonating === true;
  const isAdminByEmail = user.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
  
  const canSkipPrivacy = isMasterHardware || isImpersonating || isAdminByEmail;

  if (!user.privacyAccepted && !canSkipPrivacy) {
    return <Privacy />;
  }

  return <>{children}</>;
};

const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isLoading } = useAuth();
    if (isLoading) return null;
    
    const isAdminByEmail = user?.email && ADMIN_EMAILS.some(e => e.toLowerCase() === user?.email.toLowerCase());
    const isMasterHardware = user?.isAdminHardware === true;

    if (!user || (!isAdminByEmail && !isMasterHardware)) {
        return <Navigate to="/" replace />;
    }
    
    return <>{children}</>;
};

const ScheduleGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locked, setLocked] = useState(false);
  const [checking, setChecking] = useState(true);
  
  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const day = now.getDay(); 
      const hour = now.getHours();
      
      let isOpen = false;
      
      if (day >= 1 && day <= 5) {
        if (hour >= 7 && hour < 18) isOpen = true;
      }
      else if (day === 6) {
        if (hour >= 7 && hour < 13) isOpen = true;
      }
      
      setLocked(!isOpen);
      setChecking(false);
    };
    
    checkTime();
    const interval = setInterval(checkTime, 60000); 
    return () => clearInterval(interval);
  }, []);

  if (checking) return null; 
  if (locked) return <ScheduleLockScreen />;

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
    const { user } = useAuth();

    return (
        <Routes>
            <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
            
            <Route path="/admin/lock-preview" element={
                <AdminGuard>
                    <ScheduleLockScreen previewMode={true} />
                </AdminGuard>
            } />

            <Route path="/" element={
                <ProtectedRoute>
                    <ScheduleGuard>
                        <Layout />
                    </ScheduleGuard>
                </ProtectedRoute>
            }>
                <Route index element={<Dashboard />} />
                <Route path="catalog" element={<Catalog />} />
                <Route path="contributions" element={<CommunityContributions />} />
                <Route path="consultation" element={<Consultation />} />
                <Route path="procedure/:id" element={<ProcedureDetail />} />
                <Route path="proposals" element={<Proposals />} />
                <Route path="profile" element={<Profile />} />
                
                <Route path="admin" element={
                    <AdminGuard>
                        <AdminPanel />
                    </AdminGuard>
                } />
                <Route path="admin/telemetry" element={
                    <AdminGuard>
                        <AdminTelemetry />
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
                <Route path="admin/incidents" element={
                    <AdminGuard>
                        <AdminIncidents />
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
