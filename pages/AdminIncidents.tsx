
import React, { useEffect, useState } from 'react';
import { appwriteService } from '../services/appwriteService';
import { SecurityIncident } from '../types';
import { ShieldAlert, Clock, User, FileText, Monitor, RefreshCw, Trash2, AlertTriangle, X, Search, Scissors, Printer, Save, MousePointer2, ExternalLink, FileSpreadsheet } from 'lucide-react';

export const AdminIncidents: React.FC = () => {
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const data = await appwriteService.adminGetSecurityIncidents();
    setIncidents(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteAll = async () => {
    setIsDeleting(true);
    const success = await appwriteService.adminDeleteAllIncidents();
    if (success) {
        setShowDeleteModal(false);
        await loadData();
    } else {
        alert("Error al intentar limpiar el monitor de incidencias.");
    }
    setIsDeleting(false);
  };

  const handleExportToCSV = () => {
    if (incidents.length === 0) {
        alert("No hay incidencias para exportar.");
        return;
    }

    setIsExporting(true);
    try {
        // Definir encabezados del reporte
        const headers = [
            "Fecha", 
            "Hora", 
            "Usuario", 
            "Email", 
            "Área", 
            "Tipo de Incidencia", 
            "Detalles Técnicos", 
            "Documento Relacionado", 
            "ID Documento", 
            "ID Hardware/Terminal"
        ];
        
        // Mapear los datos de las incidencias filtradas
        const rows = filteredIncidents.map(i => [
            new Date(i.created_at).toLocaleDateString('es-MX'),
            new Date(i.created_at).toLocaleTimeString('es-MX'),
            `"${i.user_name.replace(/"/g, '""')}"`,
            `"${i.user_email}"`,
            `"${i.user_area}"`,
            `"${i.incident_type}"`,
            `"${(i.details || '').replace(/"/g, '""')}"`,
            `"${(i.procedure_name || 'N/A').replace(/"/g, '""')}"`,
            `"${i.procedure_id || 'N/A'}"`,
            `"${i.device_id}"`
        ]);

        // Construir contenido CSV
        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        // Crear Blob con BOM para soporte de caracteres especiales en Excel
        const blob = new Blob(["\ufeff", csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        
        const timestamp = new Date().toISOString().split('T')[0];
        link.setAttribute("href", url);
        link.setAttribute("download", `Reporte_Seguridad_CODEX_${timestamp}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
    } catch (error) {
        console.error("Error al exportar reporte:", error);
        alert("Ocurrió un error al generar el reporte CSV.");
    } finally {
        setIsExporting(false);
    }
  };

  const getIncidentIcon = (type: string) => {
    switch (type) {
        case 'COPY_ATTEMPT': return <Scissors size={14} className="text-amber-400" />;
        case 'PRINT_ATTEMPT': return <Printer size={14} className="text-blue-400" />;
        case 'SAVE_ATTEMPT': return <Save size={14} className="text-emerald-400" />;
        case 'CONTEXT_MENU': return <MousePointer2 size={14} className="text-purple-400" />;
        case 'FOCUS_LOST_ATTEMPT': return <ShieldAlert size={14} className="text-red-400" />;
        default: return <AlertTriangle size={14} className="text-gray-400" />;
    }
  };

  const filteredIncidents = incidents.filter(i => 
    i.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.procedure_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.details || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.user_area.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-red-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
              <div className="p-3 bg-red-900/20 rounded-xl border border-red-500/30">
                  <ShieldAlert size={32} className="text-red-500 animate-pulse" />
              </div>
              <div>
                  <h1 className="text-2xl font-black text-white uppercase tracking-tight">Monitor de Incidencias</h1>
                  <p className="text-red-400 text-sm font-bold">Registro Forense Detallado de Fuga de Datos.</p>
              </div>
          </div>
          <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                    type="text" 
                    placeholder="Filtrar por acción, usuario..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white focus:ring-2 focus:ring-red-500 outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <button 
                onClick={handleExportToCSV}
                disabled={isExporting || filteredIncidents.length === 0}
                className="flex items-center px-4 py-2 bg-indigo-900/20 text-indigo-400 hover:bg-indigo-900/40 rounded-lg border border-indigo-500/30 transition-all font-bold text-sm shadow-sm disabled:opacity-50"
                title="Descargar reporte en formato Excel/CSV"
              >
                  {isExporting ? <RefreshCw size={18} className="mr-2 animate-spin" /> : <FileSpreadsheet size={18} className="mr-2" />}
                  {isExporting ? 'Exportando...' : 'Reporte CSV'}
              </button>

              <button 
                onClick={() => setShowDeleteModal(true)}
                className="p-2 bg-red-900/20 text-red-400 hover:bg-red-900/40 rounded-lg border border-red-500/30 transition-all"
                title="Limpiar monitor"
              >
                  <Trash2 size={20} />
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

      <div className="bg-slate-900 rounded-xl shadow-sm border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10 bg-slate-950/30 flex justify-between items-center">
              <h3 className="font-bold text-gray-200 flex items-center uppercase text-sm tracking-widest">
                  Bitácora Forense Detallada
              </h3>
              <div className="flex items-center space-x-4">
                  <span className="text-[9px] font-mono text-amber-500 flex items-center">
                    <Scissors size={10} className="mr-1" /> COPIADO
                  </span>
                  <span className="text-[9px] font-mono text-blue-500 flex items-center">
                    <Printer size={10} className="mr-1" /> IMPRESIÓN
                  </span>
                  <span className="text-[9px] font-mono text-red-500 flex items-center">
                    <ShieldAlert size={10} className="mr-1" /> CAPTURA
                  </span>
              </div>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                  <thead className="bg-slate-950 text-gray-400 font-medium border-b border-white/10">
                      <tr>
                          <th className="px-6 py-4">Usuario Responsable</th>
                          <th className="px-6 py-4">Detalle de la Acción</th>
                          <th className="px-6 py-4">Documento / ID</th>
                          <th className="px-6 py-4">Terminal Física</th>
                          <th className="px-6 py-4 text-right">Fecha / Hora</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                      {loading ? (
                          <tr><td colSpan={5} className="px-6 py-12 text-center">
                              <RefreshCw className="animate-spin text-red-500 mx-auto mb-2" size={32} />
                              <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">Conectando a Central de Seguridad...</span>
                          </td></tr>
                      ) : filteredIncidents.length === 0 ? (
                          <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No se han registrado incidencias de seguridad recientemente.</td></tr>
                      ) : (
                          filteredIncidents.map((incident) => (
                              <tr key={incident.id} className="hover:bg-red-900/5 transition-colors border-l-2 border-l-transparent hover:border-l-red-500">
                                  <td className="px-6 py-4">
                                      <div className="flex items-center">
                                          <div className="bg-slate-800 p-2 rounded-full mr-3 text-gray-500 border border-white/5">
                                              <User size={14} />
                                          </div>
                                          <div>
                                              <p className="font-bold text-gray-200 uppercase text-xs">{incident.user_name}</p>
                                              <p className="text-[10px] text-gray-500 font-mono">{incident.user_email}</p>
                                              <p className="text-[9px] text-indigo-400 font-black uppercase mt-0.5">{incident.user_area}</p>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="px-6 py-4">
                                      <div className="flex items-center space-x-2">
                                          <div className="p-1.5 bg-slate-950 rounded border border-white/10">
                                            {getIncidentIcon(incident.incident_type)}
                                          </div>
                                          <div>
                                              <p className="text-[11px] font-black text-white uppercase tracking-tighter">
                                                  {incident.incident_type.replace('_ATTEMPT', '').replace('_', ' ')}
                                              </p>
                                              <p className="text-[10px] text-red-400 leading-tight max-w-[200px]">
                                                  {incident.details}
                                              </p>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="px-6 py-4">
                                      <div className="flex items-center">
                                          <FileText size={14} className="mr-2 text-indigo-500" />
                                          <span className="text-gray-300 font-medium truncate max-w-[150px]" title={incident.procedure_name}>
                                              {incident.procedure_name || 'Consulta General'}
                                          </span>
                                      </div>
                                      {incident.procedure_id && <p className="text-[9px] text-gray-600 font-mono ml-6 uppercase">ID: {incident.procedure_id.substring(0,8)}</p>}
                                  </td>
                                  <td className="px-6 py-4">
                                      <div className="flex items-center text-[10px] font-mono text-gray-500 bg-slate-950 px-2 py-1 rounded border border-white/5 w-fit">
                                          <Monitor size={12} className="mr-2 opacity-50" />
                                          {incident.device_id}
                                      </div>
                                  </td>
                                  <td className="px-6 py-4 text-right text-[10px] text-gray-500 font-mono">
                                      <p className="text-gray-200">{new Date(incident.created_at).toLocaleDateString()}</p>
                                      <p className="text-red-500 font-bold">{new Date(incident.created_at).toLocaleTimeString()}</p>
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
                      <h3 className="text-xl font-black text-white uppercase tracking-tighter">Limpieza de Monitor de Seguridad</h3>
                  </div>

                  <div className="p-8 text-center">
                      <p className="text-gray-300 mb-6 leading-relaxed">
                          Esta acción eliminará de forma <strong>permanente</strong> todos los registros de alertas forenses detalladas.<br/>
                          <span className="text-red-500 font-black mt-3 block italic text-xs uppercase tracking-widest border-y border-red-500/20 py-2">ADVERTENCIA: Acción Irreversible</span>
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
                            className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl shadow-lg shadow-red-900/40 transition-all flex items-center justify-center order-1 sm:order-2"
                          >
                              {isDeleting ? 'EJECUTANDO...' : 'SÍ, BORRAR BITÁCORA'}
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
