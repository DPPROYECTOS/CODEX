
import React, { useEffect, useState } from 'react';
import { appwriteService } from '../services/appwriteService';
import { AccessLog } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Eye, Clock, TrendingUp, TrendingDown, RefreshCw, User, FileText, Trash2, AlertTriangle, X, Download, FileSpreadsheet } from 'lucide-react';

export const AdminAnalytics: React.FC = () => {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [stats, setStats] = useState<{
      topProcedures: { name: string, count: number, area: string }[],
      leastProcedures: { name: string, count: number, area: string }[],
      recentLogs: AccessLog[]
  }>({ topProcedures: [], leastProcedures: [], recentLogs: [] });

  const loadData = async () => {
    setLoading(true);
    const data = await appwriteService.getAdminAnalytics();
    setLogs(data);
    processStats(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const processStats = (data: AccessLog[]) => {
      const counts: {[key: string]: { name: string, count: number, area: string }} = {};
      
      data.forEach(log => {
          if (!log.procedure_id) return; 
          if (!counts[log.procedure_id]) {
              counts[log.procedure_id] = { 
                  name: log.procedure_name || 'Desconocido', 
                  count: 0,
                  area: log.area || 'N/A'
              };
          }
          counts[log.procedure_id].count++;
      });

      const sortedArray = Object.values(counts).sort((a, b) => b.count - a.count);
      
      setStats({
          topProcedures: sortedArray.slice(0, 10),
          leastProcedures: sortedArray.slice(-10).reverse(),
          recentLogs: data.slice(0, 100) // Mostramos los últimos 100 en la tabla visual
      });
  };

  const handleExportToExcel = () => {
      if (logs.length === 0) {
          alert("No hay datos para exportar.");
          return;
      }

      setIsExporting(true);
      
      try {
          // Definir encabezados
          const headers = ["ID Registro", "Usuario", "Email", "Procedimiento", "Área", "Fecha Acceso", "Hora", "Duración (Segundos)"];
          
          // Mapear datos
          const csvRows = logs.map(log => [
              log.id,
              `"${log.user_name?.replace(/"/g, '""')}"`,
              `"${log.user_email}"`,
              `"${log.procedure_name?.replace(/"/g, '""')}"`,
              `"${log.area}"`,
              new Date(log.accessed_at).toLocaleDateString('es-MX'),
              new Date(log.accessed_at).toLocaleTimeString('es-MX'),
              log.duration_seconds
          ]);

          // Combinar encabezados y filas
          const csvContent = [
              headers.join(","),
              ...csvRows.map(row => row.join(","))
          ].join("\n");

          // Crear Blob con BOM para soporte de tildes/Ñ en Excel Windows
          const blob = new Blob(["\ufeff", csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          
          const now = new Date();
          const fileName = `Analitica_CODEX_${now.getMonth() + 1}_${now.getFullYear()}.csv`;

          link.setAttribute("href", url);
          link.setAttribute("download", fileName);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
      } catch (error) {
          console.error("Error al exportar:", error);
          alert("Error al generar el archivo Excel.");
      } finally {
          setIsExporting(false);
      }
  };

  const handleDeleteAll = async () => {
      setIsDeleting(true);
      const success = await appwriteService.adminDeleteAllAccessLogs();
      if (success) {
          setShowDeleteModal(false);
          await loadData();
      } else {
          alert("Error al intentar limpiar la bitácora de accesos.");
      }
      setIsDeleting(false);
  };

  const formatTime = (seconds: number) => {
      if (seconds < 60) return `${seconds}s`;
      const mins = Math.floor(seconds / 60);
      return `${mins}m ${seconds % 60}s`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
              <h1 className="text-2xl font-bold text-white flex items-center">
                  <TrendingUp className="mr-3 text-indigo-400" />
                  Analítica de Procedimientos
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                  Impacto, frecuencia de uso y tiempos de lectura de la documentación maestra.
              </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
              <button 
                onClick={handleExportToExcel}
                disabled={isExporting || logs.length === 0}
                className="flex items-center px-4 py-2 bg-emerald-900/20 text-emerald-400 hover:bg-emerald-900/40 rounded-lg border border-emerald-500/30 transition-all font-bold text-sm shadow-sm disabled:opacity-50"
              >
                  {isExporting ? (
                      <RefreshCw size={18} className="mr-2 animate-spin" />
                  ) : (
                      <FileSpreadsheet size={18} className="mr-2" />
                  )}
                  {isExporting ? 'Generando...' : 'Exportar a Excel'}
              </button>

              <button 
                onClick={() => setShowDeleteModal(true)}
                disabled={logs.length === 0}
                className="flex items-center px-4 py-2 bg-red-900/20 text-red-400 hover:bg-red-900/40 rounded-lg border border-red-500/30 transition-all font-bold text-sm shadow-sm disabled:opacity-50"
              >
                  <Trash2 size={18} className="mr-2" />
                  Borrar Historial
              </button>
              
              <button 
                  onClick={loadData} 
                  className="p-2 bg-slate-800 text-gray-400 hover:text-white rounded-lg border border-white/10 transition-colors"
                  title="Refrescar datos"
              >
                  <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              </button>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* TOP VIEWED CHART */}
          <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-white/10">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center border-b border-white/5 pb-2">
                  <Eye className="mr-2 text-indigo-400" size={18} />
                  Más Visualizados (Top 10)
              </h3>
              <div className="h-64">
                  {stats.topProcedures.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-gray-600 italic">No hay datos disponibles</div>
                  ) : (
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={stats.topProcedures} layout="vertical" margin={{ left: 0 }}>
                              <XAxis type="number" hide />
                              <YAxis dataKey="name" type="category" width={150} tick={{fill: '#94a3b8', fontSize: 10}} tickFormatter={(val) => val.length > 20 ? val.substring(0,20)+'...' : val} />
                              <Tooltip 
                                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px' }}
                                  itemStyle={{ color: '#818cf8' }}
                                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                              />
                              <Bar dataKey="count" fill="#4f46e5" radius={[0, 4, 4, 0]}>
                                  {stats.topProcedures.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={index < 3 ? '#818cf8' : '#4f46e5'} />
                                  ))}
                              </Bar>
                          </BarChart>
                      </ResponsiveContainer>
                  )}
              </div>
          </div>

          {/* LEAST VIEWED LIST */}
          <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-white/10 flex flex-col">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center border-b border-white/5 pb-2">
                  <TrendingDown className="mr-2 text-amber-500" size={18} />
                  Bajo Tráfico (Críticos para Capacitación)
              </h3>
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {stats.leastProcedures.length === 0 ? (
                      <p className="text-gray-500 text-center py-10 italic">No hay datos suficientes para mostrar tendencias.</p>
                  ) : (
                      <ul className="space-y-3">
                          {stats.leastProcedures.map((proc, idx) => (
                              <li key={idx} className="flex justify-between items-center bg-slate-950/50 p-3 rounded-lg border border-white/5 group hover:border-indigo-500/30 transition-all">
                                  <div>
                                      <p className="text-sm font-bold text-gray-300 truncate max-w-[200px]">{proc.name}</p>
                                      <p className="text-[10px] text-gray-500 uppercase font-black">{proc.area}</p>
                                  </div>
                                  <span className="text-xs font-bold text-amber-500 bg-amber-900/20 px-2.5 py-1 rounded-full border border-amber-500/20">
                                      {proc.count} vistas
                                  </span>
                              </li>
                          ))}
                      </ul>
                  )}
              </div>
          </div>
      </div>

      {/* ACCESS LOG TABLE */}
      <div className="bg-slate-900 rounded-xl shadow-sm border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10 bg-slate-950/30 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center">
                  <Clock className="mr-2 text-indigo-400" size={18} />
                  Registro Detallado de Actividad
              </h3>
              <span className="text-[10px] font-mono text-gray-500 bg-black px-2 py-1 rounded border border-white/5">
                MOSTRANDO ÚLTIMOS {stats.recentLogs.length} REGISTROS
              </span>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                  <thead className="bg-slate-950 text-gray-400 font-medium border-b border-white/10">
                      <tr>
                          <th className="px-6 py-4">Usuario</th>
                          <th className="px-6 py-4">Procedimiento</th>
                          <th className="px-6 py-4">Área</th>
                          <th className="px-6 py-4 text-center">Duración</th>
                          <th className="px-6 py-4 text-right">Fecha / Hora</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                      {loading ? (
                          <tr><td colSpan={5} className="px-6 py-12 text-center">
                              <RefreshCw className="animate-spin text-indigo-500 mx-auto mb-2" size={32} />
                              <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">Cargando Base de Datos...</span>
                          </td></tr>
                      ) : stats.recentLogs.length === 0 ? (
                          <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No hay registros de actividad en la bitácora.</td></tr>
                      ) : (
                          stats.recentLogs.map((log) => (
                              <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                  <td className="px-6 py-4">
                                      <div className="flex items-center">
                                          <div className="bg-indigo-900/30 p-2 rounded-full mr-3 text-indigo-400 border border-indigo-500/20">
                                              <User size={14} />
                                          </div>
                                          <div>
                                              <p className="font-bold text-gray-200">{log.user_name}</p>
                                              <p className="text-[10px] text-gray-500 font-mono">{log.user_email}</p>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="px-6 py-4">
                                      <div className="flex items-center">
                                          <FileText size={14} className="mr-2 text-indigo-500" />
                                          <span className="text-gray-300 font-medium truncate max-w-[200px]" title={log.procedure_name}>
                                              {log.procedure_name}
                                          </span>
                                      </div>
                                  </td>
                                  <td className="px-6 py-4">
                                      <span className="text-[10px] font-black text-gray-400 uppercase bg-slate-950 px-2 py-1 rounded border border-white/5">
                                          {log.area || 'N/A'}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                      <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded ${log.duration_seconds > 60 ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-gray-500 border border-white/5'}`}>
                                          {log.duration_seconds > 0 ? formatTime(log.duration_seconds) : '-'}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-right text-[10px] text-gray-500 font-mono">
                                      <p>{new Date(log.accessed_at).toLocaleDateString()}</p>
                                      <p className="text-indigo-500/50">{new Date(log.accessed_at).toLocaleTimeString()}</p>
                                  </td>
                              </tr>
                          ))
                      )}
                  </tbody>
              </table>
          </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN DE BORRADO */}
      {showDeleteModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
              <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-red-500/40 shadow-[0_0_50px_rgba(239,68,68,0.2)] overflow-hidden relative">
                  
                  <div className="bg-red-900/20 p-6 flex flex-col items-center text-center border-b border-red-500/20">
                      <div className="p-4 bg-red-900/30 rounded-full text-red-500 border border-red-500/30 mb-4 animate-pulse">
                          <AlertTriangle size={48} />
                      </div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tighter">Limpieza Crítica de Bitácora</h3>
                  </div>

                  <div className="p-8 text-center">
                      <p className="text-gray-300 mb-6 leading-relaxed">
                          Esta acción eliminará de forma <strong>permanente</strong> todos los registros de acceso, duraciones y métricas del sistema. <br/>
                          <span className="text-red-500 font-black mt-3 block italic text-xs uppercase tracking-widest border-y border-red-500/20 py-2">ADVERTENCIA: Operación Irreversible</span>
                      </p>

                      <div className="flex flex-col sm:flex-row gap-3">
                          <button 
                            onClick={() => setShowDeleteModal(false)}
                            className="flex-1 py-3 bg-slate-800 text-gray-400 font-bold rounded-xl hover:bg-slate-700 transition-colors order-2 sm:order-1 border border-white/5"
                            disabled={isDeleting}
                          >
                              CANCELAR
                          </button>
                          <button 
                            onClick={handleDeleteAll}
                            disabled={isDeleting}
                            className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl shadow-lg shadow-red-900/40 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center order-1 sm:order-2"
                          >
                              {isDeleting ? (
                                  <>
                                    <RefreshCw className="animate-spin mr-2" size={18} />
                                    EJECUTANDO...
                                  </>
                              ) : (
                                  'SÍ, BORRAR TODO'
                              )}
                          </button>
                      </div>
                  </div>

                  <button 
                    onClick={() => setShowDeleteModal(false)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                  >
                      <X size={24} />
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};
