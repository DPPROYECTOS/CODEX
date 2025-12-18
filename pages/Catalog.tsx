
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { appwriteService, normalizeString } from '../services/appwriteService';
import { Procedure, Folder } from '../types';
import { 
  Search, Folder as FolderIcon, ChevronRight, FileText, ArrowLeft, Grid, Plus, Edit2, Trash2, X, 
  AlertTriangle, CheckCircle, Clock, CornerUpLeft, ArrowUpRight, Box, Activity, ClipboardCheck, 
  Truck, Monitor, Users, ShoppingBag, FolderOpen, Settings, Warehouse, RotateCcw, Shield, 
  Briefcase, Wrench, Archive, Target, ShieldCheck, Package, ClipboardList, LogIn, Factory, 
  Cpu, Repeat, Hammer, Lock, ShoppingCart, Banknote, Medal, Cog, Receipt, Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { FileViewerModal } from '../components/FileViewerModal';

const AREA_ICONS: {[key: string]: any} = {
  // Operaciones y Mejora
  "PROYECTOS Y MEJORA CONTINUA": Target,
  "PROYECTOS": Target,
  "CALIDAD": ShieldCheck,
  "OPERACIONES": Cog,
  
  // Logística y Almacén
  "MENSAJERIA Y DISTRIBUCION": Truck,
  "MENSAJERÍA Y DISTRIBUCIÓN": Truck,
  "ALMACEN C": Package,
  "ALMACEN F": Package,
  "CENTRO DE DISTRIBUCION": Warehouse,
  "CENTRO DE DISTRIBUCIÓN": Warehouse,
  "INVENTARIOS": ClipboardList,
  "RECIBO": LogIn,
  "DEVOLUCIONES": RotateCcw,
  "LOGÍSTICA INVERSA": Repeat,
  "LOGISTICA INVERSA": Repeat,
  "WHATSAPP": Zap,

  // Producción y Maquila
  "EMPAQUE RETAIL": ShoppingBag,
  "EMPAQUE TV": Monitor,
  "MAQUILA": Factory,
  "REACONDICIONADO": Hammer,
  "MANTENIMIENTO": Wrench,

  // Administrativo y Seguridad
  "TECNOLOGÍAS DE LA INFORMACIÓN": Cpu,
  "TECNOLOGIAS DE LA INFORMACION": Cpu,
  "RECURSOS HUMANOS": Users,
  "SEGURIDAD": Lock,
  "SEGURIDAD PATRIMONIAL": Shield,
  "COMPRAS": ShoppingCart,
  "VENTAS": Banknote,
  "DIRECCIÓN": Medal,
  "DIRECCION": Medal,
  "ADMINISTRACIÓN": Briefcase,
  "ADMINISTRACION": Briefcase,
  "FINANZAS": Receipt
};

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => (
    <div className={`fixed bottom-6 right-6 z-[100] px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom duration-300 border ${type === 'success' ? 'bg-emerald-900/80 border-emerald-500/50 text-emerald-100' : 'bg-red-900/80 border-red-500/50 text-red-100'}`}>
        {type === 'success' ? <CheckCircle size={20} className="text-emerald-400" /> : <AlertTriangle size={20} className="text-red-400" />}
        <span className="font-medium text-sm">{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-70"><X size={16} /></button>
    </div>
);

export const Catalog: React.FC = () => {
  const { user } = useAuth();
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewTab, setViewTab] = useState<'active' | 'history'>('active');
  const [areaProcedures, setAreaProcedures] = useState<Procedure[]>([]);
  const [areaFolders, setAreaFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);
  const [availableAreas, setAvailableAreas] = useState<string[]>([]);

  const [isManageMode, setIsManageMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [inputName, setInputName] = useState('');
  const [processing, setProcessing] = useState(false);
  
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);
  const [viewFile, setViewFile] = useState<{url: string, name: string} | null>(null);

  const isAdmin = user?.role === 'admin';
  const isSingleAreaUser = !isAdmin && user?.allowedAreas.length === 1;

  const showToast = (msg: string, type: 'success' | 'error') => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 4000);
  };

  const refreshAreas = async () => {
      const dbAreas = await appwriteService.getAllAreas();
      setAvailableAreas(dbAreas);
  };

  useEffect(() => { refreshAreas(); }, []);

  useEffect(() => {
      if (isSingleAreaUser && !selectedArea && user?.allowedAreas[0]) {
          setSelectedArea(user.allowedAreas[0]);
      }
  }, [isSingleAreaUser, selectedArea, user]);

  const displayAreas = availableAreas.filter(area => {
      if (isAdmin) return true;
      const normalizedArea = normalizeString(area);
      return user?.allowedAreas.some(allowed => normalizeString(allowed) === normalizedArea);
  });

  useEffect(() => {
    if (searchTerm.length > 2 && user) {
        setLoading(true);
        setCurrentFolder(null); 
        appwriteService.getProcedures(user, searchTerm).then(docs => {
            setAreaProcedures(docs);
            setLoading(false);
        });
    }
  }, [searchTerm, user]);

  useEffect(() => {
      const loadAreaContent = async () => {
          if (user && selectedArea && !searchTerm) {
              setLoading(true);
              try {
                  const [folders, docs] = await Promise.all([
                      appwriteService.getFolders(selectedArea),
                      appwriteService.getProcedures(user, '', selectedArea)
                  ]);
                  setAreaFolders(folders);
                  setAreaProcedures(docs);
              } catch (e) {
                  console.error(e);
              } finally {
                  setLoading(false);
              }
          }
      };
      loadAreaContent();
  }, [selectedArea, user, searchTerm]);

  const handleBack = () => {
      setSearchTerm('');
      if (currentFolder) {
          setCurrentFolder(null);
      } else {
          if (!isSingleAreaUser) {
              setSelectedArea(null);
              setAreaProcedures([]);
              setAreaFolders([]);
          }
      }
  };

  const filteredByStatus = areaProcedures.filter(proc => {
      const rawStatus = proc.status ? String(proc.status) : 'VIGENTE';
      const statusUpper = rawStatus.toUpperCase().trim();
      const isExpired = statusUpper === 'CADUCO' || statusUpper === 'OBSOLETO' || statusUpper === 'HISTORICO';
      return viewTab === 'active' ? !isExpired : isExpired;
  });

  let visibleFolders: Folder[] = [];
  let visibleDocs: Procedure[] = [];

  if (selectedArea && !searchTerm) {
      if (currentFolder) {
          visibleFolders = []; 
          visibleDocs = filteredByStatus.filter(p => p.folder_id === currentFolder.id);
      } else {
          const validFolderIds = areaFolders.map(f => f.id);
          visibleDocs = filteredByStatus.filter(p => !p.folder_id || !validFolderIds.includes(p.folder_id));
          visibleFolders = areaFolders.filter(folder => {
              const matchingDocsCount = filteredByStatus.filter(p => p.folder_id === folder.id).length;
              return matchingDocsCount > 0;
          });
      }
  } else if (searchTerm) {
      visibleDocs = areaProcedures; 
  }

  const getFolderCount = (folderId: string) => filteredByStatus.filter(p => p.folder_id === folderId).length;

  const isSearching = searchTerm.length > 0;
  const showBackButton = isSearching || (selectedArea && (!isSingleAreaUser || currentFolder));

  const getAreaIcon = (areaName: string) => {
      const upperName = areaName.toUpperCase();
      return AREA_ICONS[upperName] || Box;
  };

  const handleCreateArea = async () => {
      if (!inputName.trim()) return;
      setProcessing(true);
      const success = await appwriteService.createArea(inputName.trim());
      if (success) { await refreshAreas(); showToast(`Área creada`, 'success'); setShowAddModal(false); setInputName(''); }
      setProcessing(false);
  };
  const handleRenameArea = async () => {
      if (!showRenameModal || !inputName.trim()) return;
      setProcessing(true);
      const success = await appwriteService.renameArea(showRenameModal, inputName.trim());
      if (success) { await refreshAreas(); showToast(`Área renombrada`, 'success'); setShowRenameModal(null); setInputName(''); }
      setProcessing(false);
  };
  const handleDeleteArea = async () => {
      if (!showDeleteModal) return;
      setProcessing(true);
      const success = await appwriteService.deleteArea(showDeleteModal);
      if (success) { await refreshAreas(); showToast(`Área eliminada`, 'success'); setShowDeleteModal(null); }
      setProcessing(false);
  };

  return (
    <div className="bg-slate-900 rounded-xl shadow-sm border border-white/10 min-h-[600px] flex flex-col relative">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="p-6 border-b border-white/10 flex flex-col gap-4 bg-slate-950/30">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center w-full md:w-auto">
                {showBackButton && (
                    <button 
                        onClick={handleBack}
                        className="mr-3 p-2 hover:bg-white/10 rounded-full text-indigo-400 transition-colors shadow-sm border border-transparent hover:border-white/10"
                        title="Atrás"
                    >
                        <ArrowLeft size={20} />
                    </button>
                )}
                
                <div>
                    {isSearching ? (
                        <h2 className="text-xl font-bold text-gray-200">Buscando: "{searchTerm}"</h2>
                    ) : selectedArea ? (
                        <div>
                             <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-0.5 flex items-center">
                                 {selectedArea}
                                 {currentFolder && <ChevronRight size={12} className="mx-1" />}
                                 {currentFolder && <span className="text-indigo-400">{currentFolder.name}</span>}
                             </p>
                             <h2 className="text-xl font-bold text-gray-200 flex items-center uppercase">
                                 {currentFolder ? currentFolder.name : 'Directorio Principal'}
                             </h2>
                        </div>
                    ) : (
                        <div className="flex items-center text-gray-200 font-bold text-lg">
                            <Grid size={20} className="mr-2 text-indigo-500" />
                            Catálogo de Procesos
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
                    <input 
                        type="text" 
                        placeholder="Buscar globalmente..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-sm text-white placeholder-gray-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                {isAdmin && !selectedArea && !isSearching && (
                    <button 
                        onClick={() => setIsManageMode(!isManageMode)}
                        className={`p-2.5 rounded-lg border transition-all ${isManageMode ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-gray-400 border-white/10'}`}
                    >
                        <Settings size={20} className={isManageMode ? 'animate-spin-slow' : ''} />
                    </button>
                )}
            </div>
        </div>
      </div>

      <div className="flex-1 p-6 bg-slate-950/30 flex flex-col">
        
        {selectedArea && !isSearching && !loading && (
            <div className="flex justify-between items-center mb-6">
                <div className="flex space-x-1 bg-slate-800 p-1 rounded-lg border border-white/10">
                    <button onClick={() => setViewTab('active')} className={`px-4 py-2 text-sm font-bold rounded-md transition-all flex items-center ${viewTab === 'active' ? 'bg-slate-900 text-indigo-400 shadow-sm border border-white/5' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>
                        <CheckCircle size={16} className="mr-2" /> VIGENTES
                    </button>
                    <button onClick={() => setViewTab('history')} className={`px-4 py-2 text-sm font-bold rounded-md transition-all flex items-center ${viewTab === 'history' ? 'bg-slate-700 text-gray-300 shadow-sm border border-white/5' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>
                        <Clock size={16} className="mr-2" /> CADUCOS
                    </button>
                </div>
                
                {currentFolder && (
                    <button onClick={handleBack} className="text-sm font-bold text-indigo-400 hover:text-indigo-300 flex items-center">
                        <CornerUpLeft size={16} className="mr-1" /> REGRESAR
                    </button>
                )}
            </div>
        )}

        {loading ? (
             <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-4"></div>
                 Sincronizando...
             </div>
        ) : !selectedArea && !isSearching ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-300">
                 {isManageMode && (
                     <button onClick={() => { setInputName(''); setShowAddModal(true); }} className="group relative w-full h-48 rounded-2xl border-2 border-dashed border-indigo-500/30 hover:border-indigo-400 hover:bg-indigo-900/10 transition-all flex flex-col items-center justify-center text-indigo-500 hover:text-indigo-300">
                        <Plus size={48} className="mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                        <span className="font-bold text-sm tracking-wide">AGREGAR ÁREA</span>
                     </button>
                 )}
                 {displayAreas.map(area => {
                     const Icon = getAreaIcon(area);
                     return (
                        <div key={area} className="relative group">
                            <button
                                onClick={() => !isManageMode && setSelectedArea(area)}
                                disabled={isManageMode}
                                className="relative w-full h-48 bg-slate-900 rounded-2xl shadow-sm border border-white/10 hover:shadow-xl hover:border-indigo-500/30 transition-all duration-300 overflow-hidden text-left flex flex-col justify-between p-6 z-10 hover:-translate-y-1"
                            >
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl transition-all group-hover:bg-indigo-500/20 group-hover:scale-150 duration-500"></div>

                                <div className="flex justify-between items-start z-10">
                                    <div className="p-3.5 bg-slate-800 rounded-xl group-hover:bg-indigo-600 group-hover:text-white text-gray-400 transition-colors duration-300 shadow-sm border border-white/5">
                                        <Icon size={26} />
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                                        <ArrowUpRight size={20} className="text-indigo-400" />
                                    </div>
                                </div>

                                <div className="z-10 mt-4">
                                    <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">DEPARTAMENTO</p>
                                    <h3 className="font-bold text-lg text-gray-200 leading-tight group-hover:text-white line-clamp-2 uppercase">
                                        {area}
                                    </h3>
                                </div>
                            </button>
                            
                            {/* Admin Controls */}
                            {isManageMode && (
                                <div className="absolute top-3 right-3 flex gap-2 z-20">
                                    <button onClick={() => { setInputName(area); setShowRenameModal(area); }} className="p-2 bg-slate-800 text-indigo-400 rounded-lg shadow-md border border-white/10 hover:bg-slate-700"><Edit2 size={14} /></button>
                                    <button onClick={() => setShowDeleteModal(area)} className="p-2 bg-slate-800 text-red-400 rounded-lg shadow-md border border-white/10 hover:bg-slate-700"><Trash2 size={14} /></button>
                                </div>
                            )}
                        </div>
                     );
                 })}
            </div>
        ) : (
            <div className="space-y-8 animate-in fade-in duration-300">
                
                {visibleFolders.length > 0 && !currentFolder && !isSearching && (
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center">
                            <FolderIcon size={14} className="mr-2" /> Carpetas
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {visibleFolders.map(folder => {
                                const count = getFolderCount(folder.id);
                                return (
                                    <button
                                        key={folder.id}
                                        onClick={() => setCurrentFolder(folder)}
                                        className="bg-slate-900 p-4 rounded-xl border border-white/10 hover:border-indigo-500/40 hover:shadow-md transition-all text-left group flex flex-col justify-between h-32 relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <FolderIcon size={64} className="text-indigo-400" />
                                        </div>
                                        <div className="p-2 bg-slate-800 text-indigo-400 rounded-lg w-fit group-hover:bg-indigo-600 group-hover:text-white transition-colors border border-white/5">
                                            <FolderIcon size={20} fill="currentColor" fillOpacity={0.2} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-200 text-sm truncate uppercase group-hover:text-white">{folder.name}</h4>
                                            <p className="text-xs text-gray-500">{count} documentos</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div>
                    {(visibleFolders.length > 0 && visibleDocs.length > 0) && (
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center mt-8">
                            <FileText size={14} className="mr-2" /> Archivos
                        </h3>
                    )}

                    {visibleDocs.length > 0 && (
                        <div className="grid grid-cols-1 gap-3">
                            {visibleDocs.map(proc => {
                                const isExpired = viewTab === 'history';
                                return (
                                    <div key={proc.$id} className={`flex items-center justify-between p-4 bg-slate-900 rounded-lg border transition-all group ${isExpired ? 'border-red-900/20 hover:bg-white/5 opacity-60' : 'border-white/5 hover:border-indigo-500/30 hover:shadow-md hover:bg-slate-800'}`}>
                                        <Link to={`/procedure/${proc.$id}`} className="flex items-center space-x-4 flex-1">
                                            <div className={`p-2.5 rounded-lg border shadow-sm ${isExpired ? 'bg-red-900/20 text-red-500 border-red-500/30' : 'bg-slate-800 text-indigo-400 border-white/10 group-hover:bg-indigo-600 group-hover:text-white transition-colors'}`}>
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <h4 className={`font-bold text-sm ${isExpired ? 'text-gray-500 line-through' : 'text-gray-200 group-hover:text-white'}`}>{proc.name}</h4>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <span className="text-[10px] font-mono bg-slate-800 text-gray-400 px-1.5 rounded border border-white/10">{proc.code}</span>
                                                    {!isExpired && <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${proc.status === 'Vigente' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30' : 'bg-amber-900/30 text-amber-400 border border-amber-500/30'}`}>{proc.status}</span>}
                                                    {isExpired && <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-red-900/30 text-red-400 border border-red-500/30">OBSOLETO</span>}
                                                    <span className="text-[10px] text-gray-500">v{proc.version}</span>
                                                </div>
                                            </div>
                                        </Link>
                                        <div className="flex items-center gap-2">
                                            <Link to={`/procedure/${proc.$id}`}><ChevronRight size={18} className="text-gray-600 group-hover:text-indigo-500" /></Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {visibleDocs.length === 0 && visibleFolders.length === 0 && (
                        <div className="text-center py-12 bg-slate-900 rounded-xl border border-dashed border-white/10">
                            <div className="bg-slate-800 p-4 rounded-full inline-block mb-3 border border-white/5">
                                {viewTab === 'active' ? <FolderOpen className="text-gray-500" size={32} /> : <Archive className="text-gray-500" size={32} />}
                            </div>
                            <p className="text-gray-400 font-medium">Esta carpeta está vacía.</p>
                            <p className="text-xs text-gray-600 mt-1">No se encontraron elementos {viewTab === 'active' ? 'vigentes' : 'caducos'}.</p>
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>

      {viewFile && <FileViewerModal fileUrl={viewFile.url} fileName={viewFile.name} onClose={() => setViewFile(null)} />}

      {/* ADMIN MODALS */}
      {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
              <div className="bg-slate-900 p-6 rounded-xl shadow-xl w-full max-w-sm border border-white/10">
                  <h3 className="font-bold mb-4 text-white">Nueva Área</h3>
                  <input value={inputName} onChange={e => setInputName(e.target.value)} className="w-full border border-white/20 bg-black/50 p-2 rounded mb-4 uppercase text-white" autoFocus />
                  <div className="flex justify-end gap-2"><button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancelar</button><button onClick={handleCreateArea} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500">Crear</button></div>
              </div>
          </div>
      )}
      {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
              <div className="bg-slate-900 p-6 rounded-xl shadow-xl w-full max-w-sm border-t-4 border-red-500 border-x border-b border-white/10">
                  <h3 className="font-bold mb-2 text-white">¿Eliminar {showDeleteModal}?</h3>
                  <p className="text-sm text-gray-400 mb-4">Esta acción no se puede deshacer.</p>
                  <div className="flex justify-end gap-2"><button onClick={() => setShowDeleteModal(null)} className="px-4 py-2 text-gray-400 hover:text-white">Cancelar</button><button onClick={handleDeleteArea} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500">Eliminar</button></div>
              </div>
          </div>
      )}
      {showRenameModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
              <div className="bg-slate-900 p-6 rounded-xl shadow-xl w-full max-w-sm border border-white/10">
                  <h3 className="font-bold mb-4 text-white">Renombrar Área</h3>
                  <input value={inputName} onChange={e => setInputName(e.target.value)} className="w-full border border-white/20 bg-black/50 p-2 rounded mb-4 uppercase text-white" />
                  <div className="flex justify-end gap-2"><button onClick={() => setShowRenameModal(null)} className="px-4 py-2 text-gray-400 hover:text-white">Cancelar</button><button onClick={handleRenameArea} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500">Guardar</button></div>
              </div>
          </div>
      )}
    </div>
  );
};
