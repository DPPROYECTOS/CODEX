import React, { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Save, ShieldAlert, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Heading1, Heading2, Undo, Redo, Eraser, Palette } from 'lucide-react';
import { Link } from 'react-router-dom';
import { appwriteService } from '../services/appwriteService';

export const AdminPrivacyEditor: React.FC = () => {
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
    const text = await appwriteService.getSystemConfig('privacy_policy');
    if (text) {
      setContent(text);
      if (editorRef.current) {
        editorRef.current.innerHTML = text;
      }
    } else {
      // TEXTO POR DEFECTO: ACUR CODEX CON COLORES TEMA
      const defaultText = `
<h1 style="text-align: center; color: #000000;">ACUR CODEX</h1>
<h3 style="text-align: center; color: #000000;">Acuerdo Corporativo de Uso y Regulación del Sistema CODEX</h3>
<p><br></p>
<h4 style="color: #000000;">Capítulo I: Aceptación y Marco Normativo General</h4>
<p><strong>Artículo 1.1. Objeto del Sistema y Denominación</strong><br>
El presente Acuerdo regula el acceso, uso, monitoreo, explotación y administración del Sistema de Inteligencia Operacional denominado CODEX (“CODEX” o “el Sistema”), Plataforma Digital Corporativa destinada a la gestión, visualización, auditoría, control documental y seguimiento de procesos operacionales internos de la Corporación.</p>
<p><strong>Artículo 1.2. Consentimiento Necesario y Vinculación Total</strong><br>
El ingreso, autenticación, navegación o cualquier forma de interacción dentro de CODEX constituye una Aceptación Automática, Total e Irrevocable de los términos establecidos en el presente ACUR CODEX, sin reserva alguna.</p>
<p><strong>Artículo 1.3. Obligación de Lectura Integra</strong><br>
El Usuario declara que ha leído completa y atentamente el contenido del presente Acuerdo previo a ingresar al Sistema, y reconoce que el desconocimiento de sus cláusulas no exime de su cumplimiento.</p>
<p><br></p>
<h4 style="color: #000000;">Capítulo II: Acceso Personalísimo, Seguridad y Custodia de Credenciales</h4>
<p><strong>Artículo 2.1. Carácter Nominal e Intransferible</strong><br>
El acceso a CODEX es estrictamente personal, individual, nominal e intransferible. Las credenciales son proporcionadas por la Corporación únicamente al Usuario titular registrado en la plataforma.</p>
<p><strong>Artículo 2.2. Prohibición Rígida de Cesión</strong><br>
Queda terminantemente prohibido compartir, divulgar, prestar o facilitar las credenciales de CODEX a cualquier tercero interno o externo. Esta acción constituye una falta grave.</p>
<p><strong>Artículo 2.3. Responsabilidad por Uso de Credenciales</strong><br>
Toda acción ejecutada bajo la cuenta del Usuario será atribuida legalmente al propietario de las credenciales, independientemente de quién haya realizado físicamente la acción. El Usuario acepta que:</p>
<ul>
<li>Será responsable de cualquier daño, fuga de información o afectación operacional.</li>
<li>Puede ser sujeto de sanciones disciplinarias, administrativas e incluso acciones legales.</li>
</ul>
<p><br></p>
<h4 style="color: #000000;">Capítulo III: Monitoreo, Registro Forense y Trazabilidad Operacional</h4>
<p><strong>Artículo 3.1. Monitoreo Permanente</strong><br>
CODEX opera bajo un Sistema de Monitoreo Forense Continuo, silencioso y detallado. Al utilizar el Sistema, el Usuario otorga consentimiento expreso, informado e irrevocable para el registro, almacenamiento y uso de dicha información.</p>
<p><strong>Artículo 3.2. Contenido del Registro (BDLAP CODEX)</strong><br>
La Base de Datos de Log de Actividad Propia registra de manera permanente:</p>
<ul>
<li>Identificador único del Usuario.</li>
<li>Perfil y nivel de acceso.</li>
<li>Identificación del dispositivo (ID lógico, IP, hardware asociado).</li>
<li>Horarios precisos de inicio y cierre de sesión.</li>
<li>Cada interacción realizada, con precisión sub-segundo.</li>
<li>Documentos, procesos o módulos consultados.</li>
<li>Parámetros de búsqueda, filtros aplicados y rutas de navegación.</li>
</ul>
<p><strong>Artículo 3.3. Ausencia de Expectativa de Privacidad</strong><br>
El Usuario reconoce que no existe expectativa legítima de privacidad respecto a su actividad dentro del Sistema. La Corporación podrá utilizar la información registrada para auditorías internas, evaluaciones de cumplimiento, investigaciones disciplinarias y acciones legales.</p>
<p><br></p>
<h4 style="color: #000000;">Capítulo IV: Horarios de Acceso Permitidos</h4>
<p><strong>Artículo 4.1. Horario Corporativo Autorizado</strong><br>
El uso de CODEX queda estrictamente limitado a los siguientes horarios:<br>
<strong>Lunes a Viernes: 07:00 a 19:00 horas.<br>Sábado y Domingo: 07:00 a 13:00 horas.</strong><br>
Cualquier intento de acceso fuera de estos horarios será bloqueado automáticamente.</p>
<p><strong>Artículo 4.2. Actividad Extemporánea</strong><br>
Cualquier intento de ingreso o manipulación de datos fuera del horario autorizado será registrado como Actividad Anómala Crítica de Alto Riesgo, constituyendo una falta grave y sujeta a medidas disciplinarias.</p>
<p><br></p>
<h4 style="color: #000000;">Capítulo V: Restricción de Dispositivos y Entorno de Acceso</h4>
<p><strong>Artículo 5.1. Limitación a Dispositivo Corporativo</strong><br>
El acceso a CODEX solo está permitido desde equipos proporcionados, configurados e inventariados por el Departamento de Sistemas (“Dispositivo Corporativo Autorizado”).</p>
<p><strong>Artículo 5.2. Prohibición de Equipos No Autorizados</strong><br>
Queda prohibido el acceso desde dispositivos personales, no inventariados, públicos o sin políticas de seguridad corporativa.</p>
<p><strong>Artículo 5.3. Riesgo y Responsabilidad</strong><br>
Si un Usuario decide —voluntaria o negligentemente— acceder desde un dispositivo no autorizado, asume toda la responsabilidad por cualquier daño o fuga de información.</p>
<p><br></p>
<h4 style="color: #000000;">Capítulo VI: Integridad Operacional del Sistema y Sanciones</h4>
<p><strong>Artículo 6.1. Prohibición de Manipulación</strong><br>
Se prohíbe alterar procesos, descargar información sin autorización, extraer datos confidenciales o intentar eludir protocolos de seguridad.</p>
<p><strong>Artículo 6.2. Protección para el Área de Proyectos y Mejora Continua</strong><br>
El Usuario reconoce que toda información gestionada en CODEX forma parte de un sistema crítico. Cualquier afectación atribuible al Usuario lo hace responsable directo.</p>
<p><br></p>
<h4 style="color: #000000;">Capítulo VII: Firma Digital Obligatoria</h4>
<p><strong>Artículo 7.1. Aceptación por Captura de Nombre</strong><br>
Antes de acceder al Sistema por primera vez, el Usuario deberá escribir un nombre y un apellido. Esta firma digital tendrá plena validez como Constancia Corporativa de Aceptación.</p>
<p><strong>Artículo 7.2. Carácter Legal de la Constancia</strong><br>
La Constancia de Aceptación tiene carácter permanente y prueba que el Usuario leyó y aceptó el ACUR CODEX.</p>
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
    // Obtener HTML directamente del ref para asegurar la última versión
    const finalContent = editorRef.current?.innerHTML || '';
    const success = await appwriteService.updateSystemConfig('privacy_policy', finalContent);
    
    if (success) {
      setMessage({ type: 'success', text: 'Aviso de Privacidad actualizado correctamente con formato.' });
    } else {
      setMessage({ type: 'error', text: 'Error al guardar. Verifica permisos o conexión.' });
    }
    setSaving(false);
  };

  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
        editorRef.current.focus();
    }
  };

  // Botón de Herramienta Reutilizable
  const ToolBtn = ({ icon: Icon, cmd, arg, title }: { icon: any, cmd: string, arg?: string, title: string }) => (
    <button
      onClick={(e) => { e.preventDefault(); execCmd(cmd, arg); }}
      className="p-2 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 rounded transition-colors"
      title={title}
    >
      <Icon size={18} />
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/admin" className="p-2 bg-white rounded-full text-gray-500 hover:text-indigo-700 shadow-sm border border-gray-100 hover:border-indigo-200">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-black">Editor de Aviso de Privacidad</h1>
            <p className="text-black text-sm">Personaliza el documento legal con formato enriquecido.</p>
          </div>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg font-bold text-white transition-all shadow-md ${
            saving ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-700 hover:bg-indigo-800 hover:shadow-lg'
          }`}
        >
          <Save size={18} />
          <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg border flex items-center shadow-sm ${
          message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <ShieldAlert size={20} className="mr-3" />
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col h-[600px]">
        {/* BARRA DE HERRAMIENTAS TIPO WORD */}
        <div className="bg-gray-50 border-b border-gray-200 p-2 flex flex-wrap items-center gap-1">
            <div className="flex items-center space-x-1 border-r border-gray-300 pr-2 mr-1">
                <ToolBtn icon={Undo} cmd="undo" title="Deshacer" />
                <ToolBtn icon={Redo} cmd="redo" title="Rehacer" />
            </div>
            
            <div className="flex items-center space-x-1 border-r border-gray-300 pr-2 mr-1">
                <ToolBtn icon={Heading1} cmd="formatBlock" arg="H1" title="Título 1" />
                <ToolBtn icon={Heading2} cmd="formatBlock" arg="H2" title="Título 2" />
            </div>

            <div className="flex items-center space-x-1 border-r border-gray-300 pr-2 mr-1">
                <ToolBtn icon={Bold} cmd="bold" title="Negrita" />
                <ToolBtn icon={Italic} cmd="italic" title="Cursiva" />
                <ToolBtn icon={Underline} cmd="underline" title="Subrayado" />
                
                {/* Selector de Color de Texto */}
                <div className="relative p-2 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 rounded transition-colors cursor-pointer flex items-center justify-center group" title="Color de Texto">
                    <Palette size={18} />
                    <input 
                        type="color" 
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        onChange={(e) => execCmd('foreColor', e.target.value)}
                    />
                </div>

                <ToolBtn icon={Eraser} cmd="removeFormat" title="Borrar Formato" />
            </div>

            <div className="flex items-center space-x-1 border-r border-gray-300 pr-2 mr-1">
                <ToolBtn icon={AlignLeft} cmd="justifyLeft" title="Alinear Izquierda" />
                <ToolBtn icon={AlignCenter} cmd="justifyCenter" title="Centrar" />
                <ToolBtn icon={AlignRight} cmd="justifyRight" title="Alinear Derecha" />
                <ToolBtn icon={AlignJustify} cmd="justifyFull" title="Justificar" />
            </div>

            <div className="flex items-center space-x-1">
                <ToolBtn icon={ListOrdered} cmd="insertOrderedList" title="Lista Numerada" />
                <ToolBtn icon={List} cmd="insertUnorderedList" title="Lista con Viñetas" />
            </div>
        </div>

        {/* ÁREA DE EDICIÓN */}
        <div className="flex-1 bg-gray-100/50 p-6 overflow-y-auto cursor-text" onClick={() => editorRef.current?.focus()}>
           <div 
             className="max-w-[21cm] min-h-[29.7cm] mx-auto bg-white shadow-xl p-[2.5cm] outline-none prose prose-indigo max-w-none border border-gray-200 text-black"
             contentEditable={!loading}
             ref={editorRef}
             onInput={(e) => setContent(e.currentTarget.innerHTML)}
             style={{ minHeight: '100%' }}
           />
        </div>
        
        <div className="bg-gray-50 p-2 border-t border-gray-200 text-xs text-gray-400 text-center uppercase tracking-wider font-semibold">
             Editor WYSIWYG - CODEX System v1.0
        </div>
      </div>
    </div>
  );
};