
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { appwriteService } from '../services/appwriteService';
import { Procedure, Stats, ADMIN_EMAILS } from '../types';
import { FileText, Clock, AlertTriangle, Search, MessageSquare, Key, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentDocs, setRecentDocs] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);

  const [adminPendingTickets, setAdminPendingTickets] = useState(0);
  const [adminPendingDownloads, setAdminPendingDownloads] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        const s = await appwriteService.getStats(user.allowedAreas);
        const docs = await appwriteService.getProcedures(user); 
        setStats(s);
        setRecentDocs(docs.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 3));

        const isAdmin = user.email && ADMIN_EMAILS.includes(user.email);
        if (isAdmin) {
            try {
                const [tickets, requests] = await Promise.all([
                    appwriteService.adminGetConsultationMessages(),
                    appwriteService.adminGetDownloadRequests()
                ]);
                setAdminPendingTickets(tickets.filter(t => t.status === 'pending').length);
                setAdminPendingDownloads(requests.length);
            } catch (error) {
                console.error("Error cargando notificaciones admin", error);
            }
        }
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  if (loading || !user) return <div className="p-8 text-center text-gray-400">Cargando panel...</div>;

  const data = [
    { name: 'Vigentes', value: stats?.totalActive || 0, color: '#4f46e5' }, // Indigo 600
    { name: 'En Revisión', value: stats?.totalReview || 0, color: '#ca8a04' }, // Yellow 600
  ];

  const isMultiArea = user.allowedAreas.length > 1;
  const isAdmin = user.email && ADMIN_EMAILS.includes(user.email);
  const hasAdminAlerts = adminPendingTickets > 0 || adminPendingDownloads > 0;

  return (
    <div className="space-y-6">
      
      {isAdmin && hasAdminAlerts && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top duration-300">
            {adminPendingTickets > 0 && (
                <Link to="/admin/inbox" className="bg-slate-900 border-l-4 border-amber-500 rounded-xl p-4 shadow-md flex items-center justify-between hover:bg-white/5 transition-colors group">
                    <div className="flex items-center">
                        <div className="p-3 bg-amber-900/20 text-amber-500 rounded-full mr-4 group-hover:scale-110 transition-transform">
                            <MessageSquare size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-200 text-lg">{adminPendingTickets} Consultas Nuevas</h3>
                            <p className="text-sm text-gray-500">Usuarios esperando respuesta en buzón.</p>
                        </div>
                    </div>
                    <ArrowRight className="text-gray-600 group-hover:text-amber-500" />
                </Link>
            )}

            {adminPendingDownloads > 0 && (
                <Link to="/admin/requests" className="bg-slate-900 border-l-4 border-indigo-500 rounded-xl p-4 shadow-md flex items-center justify-between hover:bg-white/5 transition-colors group">
                    <div className="flex items-center">
                        <div className="p-3 bg-indigo-900/20 text-indigo-400 rounded-full mr-4 group-hover:scale-110 transition-transform">
                            <Key size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-200 text-lg">{adminPendingDownloads} Solicitudes de Archivo</h3>
                            <p className="text-sm text-gray-500">Usuarios solicitando descargar originales.</p>
                        </div>
                    </div>
                    <ArrowRight className="text-gray-600 group-hover:text-indigo-400" />
                </Link>
            )}
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 rounded-2xl p-8 text-white shadow-xl border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
        
        <h1 className="text-3xl font-bold mb-2 relative z-10">Hola, {user.name.split(' ')[0]}</h1>
        
        <div className="relative z-10 mb-6">
            <p className="text-gray-300 mb-2">
                Bienvenido al portal corporativo. Tienes permisos activos para consultar la documentación de:
            </p>
            
            {isMultiArea ? (
                <div className="flex flex-wrap gap-2 mt-2">
                    {user.allowedAreas.map((area, idx) => (
                        <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 border border-white/10 text-gray-200 backdrop-blur-sm uppercase">
                            {area}
                        </span>
                    ))}
                </div>
            ) : (
                <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded border border-white/10 inline-block mt-1 uppercase">
                    {user.area}
                </span>
            )}
        </div>

        <div className="flex flex-wrap gap-3 relative z-10 items-center">
          <Link to="/catalog" className="bg-white text-slate-900 px-6 py-2.5 rounded-lg font-bold hover:bg-gray-200 transition-colors inline-flex items-center shadow-md">
            <Search size={18} className="mr-2" />
            Buscar Procedimiento
          </Link>
          <div className="text-sm font-medium text-gray-400 ml-2">
              Total visible: <span className="font-bold text-white">{stats?.totalActive}</span> docs vigentes.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats Card */}
        <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-white/10 col-span-1">
          <h3 className="text-lg font-bold text-white mb-4 border-b border-white/5 pb-2">Estado de Documentación</h3>
          <div className="h-48">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff' }} 
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                </PieChart>
             </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-6 text-sm">
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-indigo-600 mr-2 shadow-sm"></span>
              <span className="text-gray-400 font-medium">Vigentes ({stats?.totalActive})</span>
            </div>
             <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-yellow-600 mr-2 shadow-sm"></span>
              <span className="text-gray-400 font-medium">Revisión ({stats?.totalReview})</span>
            </div>
          </div>
        </div>

        {/* Recent Updates */}
        <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-white/10 col-span-1 lg:col-span-2">
          <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-2">
             <h3 className="text-lg font-bold text-white">Actualizaciones Recientes</h3>
             <Link to="/catalog" className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 hover:underline">Ver todos</Link>
          </div>
          
          <div className="space-y-4">
            {recentDocs.length === 0 ? (
              <p className="text-gray-500 italic">No hay actualizaciones recientes.</p>
            ) : (
              recentDocs.map(doc => (
                <div key={doc.$id} className="flex items-start p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-transparent hover:border-indigo-500/30 cursor-pointer group relative">
                  <div className="p-2 bg-slate-800 rounded-lg border border-white/10 text-indigo-400 mr-4 group-hover:text-white shadow-sm">
                    <FileText size={20} />
                  </div>
                  <Link to={`/procedure/${doc.$id}`} className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-gray-200 group-hover:text-white">{doc.name}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${doc.status === 'Vigente' ? 'bg-indigo-900/50 text-indigo-300' : 'bg-amber-900/50 text-amber-300'}`}>
                        {doc.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                        <span className="font-mono text-gray-600">{doc.code}</span> • <span className="font-bold text-indigo-400 uppercase">{doc.area}</span> • v{doc.version}
                    </p>
                    <div className="flex items-center mt-2 text-xs text-gray-600">
                      <Clock size={12} className="mr-1" />
                      Actualizado el {new Date(doc.updatedAt).toLocaleDateString()}
                    </div>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-4 flex items-start shadow-sm">
        <AlertTriangle className="text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
        <div>
           <h4 className="font-bold text-amber-400 text-sm">Recordatorio de Revisión Mensual</h4>
           <p className="text-amber-200/70 text-sm mt-1">Recuerda revisar los procedimientos marcados como "En Revisión" antes del día 30 del mes corriente.</p>
        </div>
      </div>
    </div>
  );
};
