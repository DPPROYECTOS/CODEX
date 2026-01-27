
import React, { useState, useEffect, useRef } from 'react';
import { X, Loader, Download, FileText, AlertTriangle, Lock, ShieldCheck, RefreshCw, Layers, ZoomIn, ZoomOut, Maximize2, ShieldAlert, Flag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { appwriteService } from '../services/appwriteService';
import { useNavigate } from 'react-router-dom';

interface FileViewerModalProps {
  fileUrl: string;
  fileName: string;
  procedureId?: string;
  onClose: () => void;
}

export const FileViewerModal: React.FC<FileViewerModalProps> = ({ fileUrl, fileName, procedureId, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [viewerEngine, setViewerEngine] = useState<'ms-office' | 'google-drive' | 'ms-view'>('ms-office');
  const [zoomScale, setZoomScale] = useState(1);
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const hasLoggedIncidentRef = useRef<Record<string, boolean>>({});

  const triggerSecurityLog = (type: string, details: string) => {
    // Evitar spam de logs idénticos en la misma sesión de visor
    const lockKey = `${type}-${details}`;
    if (hasLoggedIncidentRef.current[lockKey] || !user) return;
    
    hasLoggedIncidentRef.current[lockKey] = true;
    appwriteService.logSecurityIncident({
        user_id: user.$id,
        user_name: user.name,
        user_email: user.email,
        user_area: user.area,
        procedure_id: procedureId,
        procedure_name: fileName,
        device_id: appwriteService.getDeviceId(),
        incident_type: type,
        details: details,
        severity: 'CRITICAL'
    });
  };

  // --- LÓGICA DE ESCUDO DE PRIVACIDAD MULTI-SENSOR ---
  useEffect(() => {
    const handleBlur = () => {
        setIsWindowBlurred(true);
        triggerSecurityLog('FOCUS_LOST_ATTEMPT', 'Pérdida de foco (Posible herramienta de recorte o cambio de aplicación)');
    };
    
    const handleFocus = () => {
        setIsWindowBlurred(false);
        // Permitir registrar nuevos eventos tras recuperar el foco
        hasLoggedIncidentRef.current = {};
    };

    const handleCopy = (e: ClipboardEvent) => {
        e.preventDefault();
        triggerSecurityLog('COPY_ATTEMPT', 'Intento de copiado de contenido (Ctrl+C o Menú Navegador)');
    };

    const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        triggerSecurityLog('CONTEXT_MENU', 'Intento de apertura de menú contextual (Clic Derecho)');
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
        const isMod = e.ctrlKey || e.metaKey;
        
        if (isMod && e.key === 'p') {
            e.preventDefault();
            triggerSecurityLog('PRINT_ATTEMPT', 'Intento de impresión del documento (Ctrl+P)');
        }
        if (isMod && e.key === 's') {
            e.preventDefault();
            triggerSecurityLog('SAVE_ATTEMPT', 'Intento de guardado local (Bypass de descarga - Ctrl+S)');
        }
        if (isMod && (e.key === 'c' || e.key === 'x')) {
            triggerSecurityLog('COPY_ATTEMPT', 'Intento de copiado/corte vía teclado (Ctrl+C/X)');
        }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
        window.removeEventListener('blur', handleBlur);
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('copy', handleCopy);
        document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [user, procedureId, fileName]);

  const getFileType = (url: string) => {
    try {
        const cleanUrl = url.split('?')[0];
        const ext = cleanUrl.split('.').pop()?.toLowerCase();
        if (['pdf'].includes(ext || '')) return 'pdf';
        if (['vsdx', 'vsd'].includes(ext || '')) return 'visio';
        if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext || '')) return 'office';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image';
    } catch (e) { return 'unknown'; }
    return 'unknown';
  };

  const fileType = getFileType(fileUrl);
  const handleLoad = () => { setIsLoading(false); setHasError(false); };
  const handleError = () => { setIsLoading(false); setHasError(true); };

  const cycleEngine = () => {
    setIsLoading(true);
    setHasError(false);
    if (viewerEngine === 'ms-office') setViewerEngine('google-drive');
    else if (viewerEngine === 'google-drive') setViewerEngine('ms-view');
    else setViewerEngine('ms-office');
  };

  const handleZoomIn = () => setZoomScale(prev => Math.min(prev + 0.25, 5));
  const handleZoomOut = () => setZoomScale(prev => Math.max(prev - 0.25, 0.25));
  const handleResetZoom = () => setZoomScale(1);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) handleZoomIn();
        else handleZoomOut();
    }
  };

  const handleReportFinding = () => {
      onClose();
      navigate('/consultation', { 
          state: { 
              procedureId: procedureId, 
              procedureName: fileName 
          } 
      });
  };

  const WatermarkOverlay = () => (
    <div className="absolute inset-0 z-[60] pointer-events-none overflow-hidden opacity-[0.04] select-none no-print">
        <div className="flex flex-wrap w-[200%] h-[200%] -rotate-45 -translate-x-1/4 -translate-y-1/4">
            {Array.from({ length: 100 }).map((_, i) => (
                <div key={i} className="p-12 text-[10px] font-black text-white uppercase whitespace-nowrap tracking-widest">
                    CONFIDENCIAL - {user?.name || 'USUARIO'} - {new Date().toLocaleDateString()}
                </div>
            ))}
        </div>
    </div>
  );

  const renderContent = () => {
    const encodedUrl = encodeURIComponent(fileUrl);
    let iframeSrc = "";
    if (viewerEngine === 'ms-office') iframeSrc = `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}&wdStartOn=1`;
    else if (viewerEngine === 'google-drive') iframeSrc = `https://drive.google.com/viewerng/viewer?embedded=true&url=${encodedUrl}`;
    else iframeSrc = `https://view.officeapps.live.com/op/view.aspx?src=${encodedUrl}`;

    if (hasError) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 animate-in fade-in duration-300">
                <AlertTriangle size={48} className="mb-4 text-amber-500" />
                <p className="mb-2 text-lg font-bold text-white text-center">Error de visualización</p>
                <button onClick={cycleEngine} className="mt-4 px-4 py-2 bg-indigo-700 text-white rounded-lg font-bold hover:bg-indigo-600">Reintentar</button>
            </div>
        );
    }

    const SecurityBlock = ({ width = "w-[220px]", height = "h-[60px]" }) => (
      <div className={`absolute top-0 right-0 ${width} ${height} z-[70] bg-white flex items-center justify-center border-l border-b border-gray-100 shadow-sm no-print`}>
        <div className="flex items-center bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
            <Lock size={12} className="text-indigo-600 mr-2" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Protegido</span>
        </div>
      </div>
    );

    switch (fileType) {
      case 'pdf':
        return (
          <div className="w-full h-full relative bg-white overflow-hidden print:hidden">
            <SecurityBlock />
            <WatermarkOverlay />
            <iframe src={`https://docs.google.com/gview?url=${encodedUrl}&embedded=true`} className="w-full h-full border-none relative z-10" onLoad={handleLoad} onError={handleError} title="PDF Viewer" />
          </div>
        );
      case 'visio':
        return (
          <div className="w-full h-full relative overflow-hidden bg-white print:hidden">
              <SecurityBlock width="w-[140px]" height="h-[40px]" />
              <WatermarkOverlay />
              <iframe src={iframeSrc} className="absolute top-0 left-0 w-full h-full border-none z-10" onLoad={handleLoad} onError={handleError} key={viewerEngine} title="Visio Viewer" />
          </div>
        );
      case 'office':
        return (
          <div className="w-full h-full relative overflow-hidden bg-white print:hidden">
              <SecurityBlock width="w-[280px]" height="h-[52px]" />
              <WatermarkOverlay />
              <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`} className="absolute top-0 left-0 w-full h-[calc(100%+50px)] border-none z-10" onLoad={handleLoad} onError={handleError} title="Office Viewer" />
          </div>
        );
      case 'image':
        return (
          <div className="w-full h-full relative bg-[#050505] flex flex-col overflow-hidden print:hidden">
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[200] flex items-center bg-slate-900/95 backdrop-blur-2xl border border-white/20 rounded-2xl p-2 shadow-2xl no-print">
                  <button onClick={handleZoomOut} className="p-2.5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all"><ZoomOut size={22} /></button>
                  <div className="px-5 min-w-[90px] text-center border-x border-white/10 mx-1"><span className="text-sm font-black text-indigo-400 font-mono">{Math.round(zoomScale * 100)}%</span></div>
                  <button onClick={handleZoomIn} className="p-2.5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all"><ZoomIn size={22} /></button>
                  <div className="w-px h-6 bg-white/10 mx-2"></div>
                  <button onClick={handleResetZoom} className="p-2.5 hover:bg-indigo-600 text-gray-400 hover:text-white rounded-xl transition-all" title="Ajustar"><Maximize2 size={22} /></button>
              </div>
              <div className="flex-1 overflow-auto custom-scrollbar bg-black/40 relative" onWheel={handleWheel}>
                  <WatermarkOverlay />
                  <div className="min-w-full min-h-full flex p-[100px]">
                    <img ref={imageRef} src={fileUrl} alt={fileName} style={{ margin: 'auto', width: `${zoomScale * 100}%`, maxWidth: 'none', display: 'block' }} className="shadow-2xl bg-white rounded-sm transition-[width] duration-200 ease-out relative z-10" onLoad={handleLoad} onError={handleError} />
                  </div>
              </div>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
            <FileText size={48} className="mb-4 text-indigo-400" />
            <p className="mb-4 text-lg font-bold text-white uppercase tracking-tight">Formato sin vista previa</p>
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center px-6 py-3 bg-indigo-700 text-white rounded-lg font-bold hover:bg-indigo-600 transition-all shadow-lg">
              <Download size={20} className="mr-2" /> Descargar Archivo
            </a>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-2 sm:p-6 animate-in fade-in duration-200" onClick={onClose}>
      <div className="w-full max-w-7xl h-full max-h-[92vh] flex flex-col bg-[#0B0C15] rounded-xl border border-indigo-500/30 shadow-2xl overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
        
        {isWindowBlurred && (
            <div className="absolute inset-0 z-[1000] bg-black flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-100">
                <div className="bg-red-900/20 p-6 rounded-full border border-red-500/50 mb-6 animate-pulse">
                    <ShieldAlert size={64} className="text-red-500" />
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Contenido Protegido por CODEX</h2>
                <p className="text-red-400 font-bold max-w-md">
                    Se ha detectado una pérdida de foco o intento de captura. 
                    Por seguridad, la visualización ha sido suspendida.
                </p>
                <p className="text-gray-500 text-xs mt-8 uppercase font-mono">ID de Auditoría: {user?.$id.substring(0,8)}</p>
            </div>
        )}

        <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-white/10 shrink-0 z-[110] shadow-md no-print">
            <div className="flex items-center space-x-3 overflow-hidden">
                <div className="p-1.5 bg-indigo-900/40 rounded border border-indigo-500/30 text-indigo-300 shrink-0"><ShieldCheck size={18} /></div>
                <div className="min-w-0"><h3 className="text-sm md:text-base font-bold text-white truncate font-display tracking-wide uppercase">{fileName}</h3></div>
            </div>
            
            <div className="flex items-center space-x-2">
                <button 
                    onClick={handleReportFinding}
                    className="flex items-center justify-center px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors font-bold text-xs uppercase tracking-widest shadow-lg"
                    title="Reportar un hallazgo o duda sobre este documento"
                >
                    <Flag size={16} className="mr-2" />
                    <span className="hidden sm:inline">Reportar Hallazgo</span>
                </button>
                <button onClick={onClose} className="flex items-center justify-center px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg transition-colors font-bold text-xs uppercase tracking-widest shadow-lg shrink-0">
                    <span className="mr-2 hidden sm:inline">Cerrar</span><X size={20} />
                </button>
            </div>
        </div>

        <div className="flex-1 bg-slate-950 relative w-full h-full overflow-hidden flex flex-col">
             {isLoading && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-[120] pointer-events-none">
                     <Loader className="animate-spin text-indigo-500 mb-4" size={40} />
                     <p className="text-indigo-200 font-bold animate-pulse text-[10px] tracking-widest uppercase">Estableciendo Conexión Segura...</p>
                 </div>
             )}
             {renderContent()}
        </div>
      </div>
    </div>
  );
};
