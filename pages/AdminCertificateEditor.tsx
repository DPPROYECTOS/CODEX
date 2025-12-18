
import React, { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Save, ShieldAlert, Undo, Redo, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { appwriteService } from '../services/appwriteService';

export const AdminCertificateEditor: React.FC = () => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    setLoading(true);
    const text = await appwriteService.getSystemConfig('privacy_certificate_template');
    if (text) {
      setContent(text);
      if (editorRef.current) {
        editorRef.current.innerHTML = text;
      }
    } else {
      const defaultText = `
<div class="sheet" style="width: 21.59cm; height: 27.94cm; padding: 2.5cm 2.2cm 2.0cm 2.2cm; background: white; margin: 0 auto 30px auto; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); font-family: Arial, sans-serif; position: relative; display: flex; flex-direction: column; box-sizing: border-box; color: #000000 !important;">
    <header style="border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 14px; text-align: center;">
        <h1 style="font-size: 13pt; font-weight: bold; text-transform: uppercase; margin: 0; letter-spacing: 0.5px; color: #000000 !important;">SUAVE Y FÁCIL CV DIRECTO S.A. DE C.V.</h1>
        <p style="font-size: 9pt; font-weight: bold; color: #333333 !important; margin-top: 4px;">SISTEMA CODEX - GESTIÓN CORPORATIVA</p>
    </header>

    <div style="flex: 1; color: #000000 !important;">
        <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="font-size: 13pt; font-weight: bold; text-transform: uppercase; text-decoration: underline; margin: 0; color: #000000 !important;">CONSTANCIA DE ACEPTACIÓN DE AVISOS DE PRIVACIDAD Y TÉRMINOS DE USO</h2>
        </div>

        <p style="font-size: 11pt; margin-bottom: 15px; text-align: justify; line-height: 1.3; color: #000000 !important;">En la ciudad de [CIUDAD], siendo las [HORA] del día [FECHA], se emite la presente CONSTANCIA...</p>

        <h4 style="font-size: 12pt; font-weight: bold; text-transform: uppercase; border-bottom: 2px solid #000000; margin-bottom: 10px; color: #000000 !important;">I. Identificación del Usuario</h4>
        <table style="width: 100%; border-collapse: collapse; border: 1.5pt solid black; font-size: 11pt; margin-bottom: 15px;">
            <tr><td style="border: 1pt solid black; background: #e5e7eb; padding: 6px; font-weight: bold; width: 35%; color: #000000 !important;">NOMBRE:</td><td style="border: 1pt solid black; padding: 6px; color: #000000 !important; background: #ffffff;">[NOMBRE DEL USUARIO]</td></tr>
            <tr><td style="border: 1pt solid black; background: #e5e7eb; padding: 6px; font-weight: bold; color: #000000 !important;">ID USUARIO:</td><td style="border: 1pt solid black; padding: 6px; color: #000000 !important; background: #ffffff;">[ID DE USUARIO]</td></tr>
            <tr><td style="border: 1pt solid black; background: #e5e7eb; padding: 6px; font-weight: bold; color: #000000 !important;">DEPARTAMENTO:</td><td style="border: 1pt solid black; padding: 6px; color: #000000 !important; background: #ffffff;">[DEPARTAMENTO]</td></tr>
            <tr><td style="border: 1pt solid black; background: #e5e7eb; padding: 6px; font-weight: bold; color: #000000 !important;">CORREO:</td><td style="border: 1pt solid black; padding: 6px; color: #000000 !important; background: #ffffff;">[CORREO]</td></tr>
        </table>

        <h4 style="font-size: 12pt; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; color: #000000 !important;">II. Consentimiento</h4>
        <p style="font-size: 11pt; text-align: justify; margin-bottom: 10px; color: #000000 !important;">El Usuario otorga su CONSENTIMIENTO EXPRESO, TOTAL E IRREVOCABLE.</p>

        <h4 style="font-size: 12pt; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; color: #000000 !important;">VII. Horarios de Uso Autorizados</h4>
        <table style="width: 75%; margin: 10px auto; border-collapse: collapse; border: 1.5pt solid black; font-size: 11pt;">
            <tr>
                <td style="border: 1pt solid black; background: #e5e7eb; padding: 8px; font-weight: bold; text-align: center; color: #000000 !important;">Lunes a Viernes</td>
                <td style="border: 1pt solid black; padding: 8px; text-align: center; color: #000000 !important; background: #ffffff;">07:00 – 19:00</td>
            </tr>
            <tr>
                <td style="border: 1pt solid black; background: #e5e7eb; padding: 8px; font-weight: bold; text-align: center; color: #000000 !important;">Sábado y Domingo</td>
                <td style="border: 1pt solid black; padding: 8px; text-align: center; color: #000000 !important; background: #ffffff;">07:00 – 13:00</td>
            </tr>
        </table>
    </div>

    <footer style="margin-top: auto; padding-top: 8px; border-top: 1px solid black; font-size: 9pt; color: #333333 !important; display: flex; justify-content: space-between;">
        <span>Documento confidencial.</span>
        <span>Página 1 de 1</span>
    </footer>
</div>
      `;
      setContent(defaultText);
      if (editorRef.current) {
        editorRef.current.innerHTML = defaultText;
      }
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    const finalContent = editorRef.current?.innerHTML || '';
    const success = await appwriteService.updateSystemConfig('privacy_certificate_template', finalContent);
    
    if (success) {
      setMessage({ type: 'success', text: 'Plantilla actualizada correctamente.' });
    } else {
      setMessage({ type: 'error', text: 'Error al guardar. Verifica permisos o conexión.' });
    }
    setSaving(false);
  };

  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) editorRef.current.focus();
  };

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-4">
          <Link to="/admin" className="p-2 bg-white rounded-full text-gray-500 hover:text-indigo-700 shadow-sm border border-gray-100">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-black">Editor de Constancia</h1>
            <p className="text-black text-sm">Diseño de impresión (Tamaño Carta 8.5x11)</p>
          </div>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg font-bold text-white transition-all shadow-md ${
            saving ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-700 hover:bg-indigo-800'
          }`}
        >
          <Save size={18} />
          <span>{saving ? 'Guardando...' : 'Guardar Plantilla'}</span>
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg border flex items-center shadow-sm shrink-0 ${
          message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <ShieldAlert size={20} className="mr-3" />
          {message.text}
        </div>
      )}

      <div className="flex-1 bg-gray-200 overflow-hidden flex flex-col rounded-xl border border-gray-300 shadow-inner">
         <div className="bg-gray-100 border-b border-gray-300 p-2 flex gap-2 shrink-0 justify-center">
            <button onClick={() => execCmd('undo')} className="p-1.5 hover:bg-gray-300 rounded"><Undo size={16}/></button>
            <button onClick={() => execCmd('redo')} className="p-1.5 hover:bg-gray-300 rounded"><Redo size={16}/></button>
            <div className="w-px bg-gray-400 mx-2"></div>
            <button onClick={() => execCmd('bold')} className="p-1.5 hover:bg-gray-300 rounded font-bold">B</button>
            <button onClick={() => execCmd('italic')} className="p-1.5 hover:bg-gray-300 rounded italic">I</button>
            <button onClick={() => execCmd('underline')} className="p-1.5 hover:bg-gray-300 rounded underline">U</button>
         </div>

         <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-gray-500/10">
            <div 
                className="outline-none"
                contentEditable={!loading}
                ref={editorRef}
                onInput={(e) => setContent(e.currentTarget.innerHTML)}
                style={{ width: 'fit-content' }}
            />
         </div>
      </div>
      
      <style>{`
        .sheet {
            box-sizing: border-box;
            margin-bottom: 2rem !important; 
        }
        div[style*="page-break"] {
            height: 1px;
            background: #ccc;
            margin: 10px 0;
            display: block;
        }
      `}</style>
    </div>
  );
};
