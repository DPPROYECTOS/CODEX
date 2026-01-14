
import React from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  LogOut, 
  Menu,
  X,
  Shield, 
  Layers,
  Eye,
  Search,
  Inbox,
  ChevronDown,
  FileCheck,
  TrendingUp,
  Lightbulb,
  User as UserIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ADMIN_EMAILS } from '../types';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);
  const location = useLocation();

  React.useEffect(() => {
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
  }, [location]);

  if (!user) return null;

  // Normalizar correos para comparación robusta
  const isAdmin = user.email && ADMIN_EMAILS.some(email => email.toLowerCase() === user.email.toLowerCase());
  const isMultiArea = user.allowedAreas.length > 1;

  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Inicio' },
    { to: '/catalog', icon: BookOpen, label: 'Procedimientos' },
    { to: '/consultation', icon: Search, label: 'Consulta y Observaciones' },
    { to: '/proposals', icon: Lightbulb, label: 'Propuestas de Mejora' },
  ];

  if (isAdmin) {
    links.push({ to: '/admin', icon: Shield, label: 'Administrador' });
    links.push({ to: '/admin/analytics', icon: TrendingUp, label: 'Analíticas' });
    links.push({ to: '/admin/requests', icon: FileCheck, label: 'Solicitudes' });
    links.push({ to: '/admin/inbox', icon: Inbox, label: 'Buzón Usuarios' });
    links.push({ to: '/admin/proposals', icon: Lightbulb, label: 'Gestión de Mejoras' });
  }

  return (
    <div className="min-h-screen flex bg-[#020617] flex-col md:flex-row text-white">
      
      {user.isImpersonating && (
        <div className="fixed top-0 left-0 right-0 h-8 bg-orange-900 z-50 flex items-center justify-center text-white text-xs font-bold uppercase tracking-wider shadow-md border-b border-orange-700">
            <Eye size={14} className="mr-2" />
            Modo Auditoría Activo: Estás visualizando la cuenta de {user.name} sin firma.
        </div>
      )}

      {/* Sidebar Desktop */}
      <aside className={`hidden md:flex w-64 bg-slate-950 text-white flex-col fixed h-full z-10 shadow-2xl border-r border-white/10 ${user.isImpersonating ? 'mt-8' : ''}`}>
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            CODEX 
            <span className="text-indigo-300 font-light text-sm bg-indigo-900/50 px-1.5 py-0.5 rounded border border-indigo-500/30">v1.0</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-semibold">Plataforma Corporativa</p>
        </div>
        
        <div className="p-4 bg-slate-900/50">
          <p className="text-xs text-gray-400 uppercase font-semibold mb-1">
            {isAdmin ? 'Perfil Global' : isMultiArea ? 'Acceso Corporativo' : 'Área Asignada'}
          </p>
          <div className="flex items-center space-x-2">
            {isAdmin ? (
               <Shield size={16} className="text-red-400 shadow-[0_0_8px_rgba(248,113,113,0.4)]" />
            ) : isMultiArea ? (
               <Layers size={16} className="text-emerald-400" />
            ) : (
               <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span>
            )}
            
            <p className="font-medium text-gray-200 truncate uppercase">
              {isAdmin ? 'ADMINISTRADOR' : isMultiArea ? 'Multi-Área' : user.area}
            </p>
          </div>
          {isAdmin ? (
             <p className="text-[10px] text-red-400 mt-1 leading-tight font-bold uppercase tracking-tighter">
               Control Total de Sistemas
             </p>
          ) : isMultiArea ? (
            <p className="text-[10px] text-gray-500 mt-1 leading-tight">
              {user.allowedAreas.length} áreas autorizadas
            </p>
          ) : null}
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => 
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive 
                  ? 'bg-indigo-900/50 text-white border border-indigo-500/30' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <link.icon size={20} />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-6 border-t border-white/10 text-center">
          <p className="text-[10px] text-gray-600 font-bold tracking-widest uppercase leading-relaxed">
            SUAVE Y FACIL<br/>S.A. de C.V.
          </p>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className={`md:hidden fixed w-full bg-slate-950 text-white z-20 flex justify-between items-center p-4 shadow-md border-b border-white/10 ${user.isImpersonating ? 'top-8' : 'top-0'}`}>
        <h1 className="font-black text-xl tracking-tight">CODEX</h1>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-300">
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className={`md:hidden fixed inset-0 bg-slate-950 z-10 pt-20 px-6 space-y-4 ${user.isImpersonating ? 'mt-8' : ''}`}>
           {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => 
                `flex items-center space-x-3 px-4 py-4 rounded-lg text-lg ${
                  isActive ? 'bg-indigo-900/50 text-white' : 'text-gray-400'
                }`
              }
            >
              <link.icon size={24} />
              <span>{link.label}</span>
            </NavLink>
          ))}
          <button onClick={logout} className="flex items-center space-x-3 text-red-400 w-full px-4 py-4 mt-8 bg-white/5 rounded-lg border border-white/10">
            <LogOut size={24} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className={`flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 overflow-y-auto text-white ${user.isImpersonating ? 'mt-8' : ''}`}>
        {/* Header Bar */}
        <header className="flex justify-between items-center mb-8">
          <div>
             <h2 className="text-2xl font-bold text-white">
               {location.pathname === '/' ? 'Panel Principal' : 
                location.pathname === '/catalog' ? 'Catálogo de Procedimientos' :
                location.pathname === '/consultation' ? 'Consulta y Observaciones' :
                location.pathname === '/proposals' ? 'Propuestas de Mejora' :
                location.pathname === '/profile' ? 'Mi Perfil' :
                location.pathname === '/admin' ? 'Administración' : 
                location.pathname === '/admin/analytics' ? 'Analíticas de Uso' :
                location.pathname === '/admin/requests' ? 'Solicitudes de Archivos' : 
                location.pathname === '/admin/inbox' ? 'Buzón de Usuarios' : 
                location.pathname === '/admin/proposals' ? 'Gestión de Mejoras' : ''}
             </h2>
             <p className="text-gray-400 text-sm mt-1">
               {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
             </p>
          </div>
          <div className="flex items-center space-x-4">
            
            <div className="relative">
                <button 
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center space-x-3 bg-slate-900 px-2 py-2 pr-4 rounded-full shadow-sm border border-white/10 hover:bg-slate-800 transition-all cursor-pointer group"
                >
                  <div className="w-14 h-14 rounded-full bg-slate-950 flex items-center justify-center text-white font-bold text-xl border-2 border-indigo-500/50 overflow-hidden group-hover:border-indigo-400 transition-colors">
                    {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                        user.name.charAt(0)
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <span className="block text-sm font-bold text-white leading-tight">{user.name}</span>
                    <span className="block text-[10px] text-gray-400 uppercase font-bold tracking-wide">
                        {isAdmin ? 'Administrador' : isMultiArea ? 'Multi-Acceso' : user.area}
                    </span>
                  </div>
                  <ChevronDown size={16} className={`text-gray-400 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-900 rounded-xl shadow-xl border border-white/10 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                      <div className="p-4 border-b border-white/10 bg-black/20">
                          <p className="text-xs font-bold text-gray-500 uppercase">Cuenta Activa</p>
                          <p className="text-sm font-bold text-indigo-300 truncate">{user.email}</p>
                      </div>
                      
                      <Link 
                        to="/profile" 
                        onClick={() => setProfileMenuOpen(false)}
                        className="w-full text-left px-4 py-3 text-sm font-bold text-gray-300 hover:bg-white/5 flex items-center transition-colors border-b border-white/5"
                      >
                          <UserIcon size={16} className="mr-2 text-indigo-400" />
                          Mi Perfil
                      </Link>

                      <button 
                        onClick={() => { logout(); setProfileMenuOpen(false); }}
                        className="w-full text-left px-4 py-3 text-sm font-bold text-red-400 hover:bg-white/5 flex items-center transition-colors"
                      >
                          <LogOut size={16} className="mr-2" />
                          Cerrar Sesión
                      </button>
                  </div>
                )}
            </div>

          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
};
