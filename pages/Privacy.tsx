import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ArrowRight, PenTool } from 'lucide-react';
import { appwriteService } from '../services/appwriteService';
import { googleDriveService } from '../services/googleDriveService';

export const Privacy: React.FC = () => {
  const { acceptPrivacy, logout, user } = useAuth();
  const [isAccepting, setIsAccepting] = useState(false);
  const [privacyText, setPrivacyText] = useState<string>('');
  const [loadingText, setLoadingText] = useState(true);
  const [, setUploadStatus] = useState<string>('');

  const [signName, setSignName] = useState('');
  const [signLastName, setSignLastName] = useState('');
  
  const signDepartment = user?.area || 'NO ASIGNADO';

  useEffect(() => {
    const loadPolicy = async () => {
      const text = await appwriteService.getSystemConfig('privacy_policy');
      if (text) {
        setPrivacyText(text);
      } else {
        setPrivacyText(`
<h1 style="text-align: center; color: #ffffff;">ACUR CODEX</h1>
<h3 style="text-align: center; color: #d1d5db;">Acuerdo Corporativo de Uso y Regulación del Sistema CODEX</h3>
<p style="color: #9ca3af;">Cargando texto normativo...</p>
        `);
      }
      setLoadingText(false);
    };
    loadPolicy();
  }, [user]);

  const generateAndUploadCertificate = async () => {
    try {
        setUploadStatus('Generando constancias...');
        
        let template = await appwriteService.getSystemConfig('privacy_certificate_template');
        if (!template) {
            template = `<h1>Constancia CODEX</h1><p>El usuario [NOMBRE DEL USUARIO] aceptó los términos.</p>`;
        }

        const fullName = `${signName} ${signLastName}`.toUpperCase();
        const currentDate = new Date();
        const dateStr = currentDate.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const timeStr = currentDate.toLocaleTimeString('es-MX');
        const idRegistro = `SFCV-${user?.$id.substring(0,4)}-${Date.now()}`;
        const ip = "192.168.10.X";

        let filledContent = template
            .replace(/\[NOMBRE DEL USUARIO\]/g, fullName)
            .replace(/\[ID DE USUARIO\]/g, user?.$id || 'N/A')
            .replace(/\[DEPARTAMENTO\]/g, signDepartment)
            .replace(/\[CORREO\]/g, user?.email || 'N/A')
            .replace(/\[FECHA\]/g, dateStr)
            .replace(/\[HORA\]/g, timeStr)
            .replace(/\[IP\]/g, ip)
            .replace(/\[ID DE REGISTRO\]/g, idRegistro)
            .replace(/\[CIUDAD\]/g, "Naucalpan de Juárez");

        const htmlContent = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'><title>Constancia CODEX</title></head>
            <body>${filledContent}</body></html>
        `;

        const blobWord = new Blob([htmlContent], { type: 'application/vnd.ms-word' });
        const fileWord = new File([blobWord], `Constancia_${fullName.replace(/\s+/g, '_')}.doc`, { type: 'application/vnd.ms-word' });

        const blobHtml = new Blob([htmlContent], { type: 'text/html' });
        const fileHtml = new File([blobHtml], `Constancia_${fullName.replace(/\s+/g, '_')}.html`, { type: 'text/html' });

        setUploadStatus('Subiendo archivos a Drive...');
        
        await Promise.all([
            googleDriveService.uploadToDrive(fileWord),
            googleDriveService.uploadToDrive(fileHtml)
        ]);

        setUploadStatus('Archivos guardados correctamente.');
        return true;

    } catch (error) {
        console.error("Error generando/subiendo constancia:", error);
        setUploadStatus('Error al guardar constancia (se permitirá acceso local).');
        return false; 
    }
  };

  const handleAccept = async () => {
    setIsAccepting(true);
    await generateAndUploadCertificate();
    const fullName = `${signName} ${signLastName}`.toUpperCase();
    await acceptPrivacy(fullName, signDepartment);
    setIsAccepting(false);
  };

  const isFormValid = 
    signName.trim().length > 0 && 
    signLastName.trim().length > 0 &&
    signDepartment.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
      <div className="bg-slate-900 max-w-3xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/10">
        <div className="bg-gradient-to-r from-indigo-950 to-slate-950 p-6 text-white shrink-0 shadow-lg relative z-10 border-b border-white/10">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                 <ShieldCheck size={32} className="text-indigo-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Protocolo de Seguridad</h1>
                <p className="text-indigo-300 text-sm font-medium">ACUR CODEX v2024</p>
              </div>
            </div>
            <div className="text-right hidden sm:block">
               <p className="text-xs text-gray-400">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-8 overflow-y-auto bg-slate-950 relative">
          {loadingText ? (
            <div className="flex items-center justify-center h-full text-indigo-400">
                <div className="animate-pulse font-semibold">Cargando ACUR CODEX...</div>
            </div>
          ) : (
             <div className="bg-slate-900 p-10 shadow-sm border border-white/10 rounded-sm min-h-full">
                <div 
                  className="prose prose-sm prose-invert max-w-none text-gray-300 leading-relaxed font-serif"
                  dangerouslySetInnerHTML={{ __html: privacyText }}
                />
             </div>
          )}
        </div>

        <div className="p-6 bg-slate-900 border-t border-white/10 shrink-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.2)]">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white flex items-center mb-2 uppercase tracking-wide">
              <PenTool size={16} className="mr-2 text-indigo-400" />
              Firma Digital Obligatoria (Art. 7.1)
            </h3>
            <p className="text-xs text-gray-400 mb-3">
              Para proceder, escribe tu nombre completo y confirma tu departamento asignado.
              Al firmar, aceptas incondicionalmente los términos del ACUR CODEX.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Nombre(s)</label>
                <input 
                  type="text" 
                  value={signName}
                  onChange={(e) => setSignName(e.target.value)}
                  className="w-full px-3 py-2 border border-white/10 rounded focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none text-sm transition-all bg-slate-800 focus:bg-slate-700 font-medium text-white placeholder-gray-500"
                  placeholder="Ej. Juan Carlos"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Apellidos</label>
                <input 
                  type="text" 
                  value={signLastName}
                  onChange={(e) => setSignLastName(e.target.value)}
                  className="w-full px-3 py-2 border border-white/10 rounded focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none text-sm transition-all bg-slate-800 focus:bg-slate-700 font-medium text-white placeholder-gray-500"
                  placeholder="Ej. Pérez"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Departamento / Área</label>
                <input 
                    type="text" 
                    value={signDepartment}
                    readOnly
                    className="w-full px-3 py-2 border border-white/10 rounded bg-slate-800/50 text-gray-500 font-bold outline-none text-sm cursor-not-allowed uppercase"
                    title="Asignado por sistema según perfil de usuario"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-white/5">
            <button 
              onClick={logout}
              className="text-red-400 hover:text-red-300 text-sm font-bold px-4 py-2 hover:bg-white/5 rounded transition-colors w-full sm:w-auto uppercase tracking-wide"
            >
              No Acepto (Salir)
            </button>
            
            <div className="flex flex-col items-end w-full sm:w-auto">
                <button
                onClick={handleAccept}
                disabled={isAccepting || loadingText || !isFormValid}
                className={`flex items-center justify-center space-x-2 px-8 py-3 rounded-lg font-bold shadow-md transition-all w-full sm:w-auto
                    ${isFormValid 
                    ? 'bg-indigo-700 hover:bg-indigo-600 text-white transform hover:scale-105 shadow-indigo-900/40' 
                    : 'bg-slate-800 text-gray-500 cursor-not-allowed border border-white/5'
                    }`}
                >
                <span>{isAccepting ? 'Procesando...' : 'Firmar y Acceder al Sistema'}</span>
                {!isAccepting && <ArrowRight size={18} />}
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};