
import React from 'react';
import { User } from '../types';
import { X, Printer, ShieldCheck } from 'lucide-react';

interface PrivacyCertificateModalProps {
  user: User;
  privacyText: string;
  onClose: () => void;
}

export const PrivacyCertificateModal: React.FC<PrivacyCertificateModalProps> = ({ user, onClose }) => {
  
  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date();
  const dateString = currentDate.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeString = currentDate.toLocaleTimeString('es-MX');
  
  const displayUserName = user.signedName || user.name;
  const displayDepartment = user.signedDepartment || user.area;

  const folioRegistro = `SFCV-${displayDepartment.substring(0,3).toUpperCase()}-${user.$id.substring(0, 4).toUpperCase()}-${Date.now().toString().slice(-6)}`;
  const ipAddress = "192.168.10.X (Intranet)"; 

  const PageHeader = () => (
    <header className="border-b-2 border-black pb-2 mb-4 flex justify-between items-start">
        <div className="w-full text-center">
            <h1 className="text-[13pt] font-bold uppercase tracking-wide !text-black leading-tight" style={{ fontFamily: 'Arial, sans-serif' }}>SUAVE Y FÁCIL CV DIRECTO S.A. DE C.V.</h1>
            <p className="text-[9pt] !text-gray-700 font-bold mt-1" style={{ fontFamily: 'Arial, sans-serif' }}>SISTEMA CODEX - GESTIÓN CORPORATIVA</p>
        </div>
    </header>
  );

  const PageFooter = ({ pageNum, totalPages }: { pageNum: number, totalPages: number }) => (
    <div className="mt-auto pt-2 border-t border-black text-[9pt] !text-gray-700 uppercase flex justify-between items-end" style={{ fontFamily: 'Arial, sans-serif' }}>
        <div>
            <p className="font-bold !text-black">Documento interno confidencial.</p>
        </div>
        <div className="text-right">
            <p className="font-bold !text-black">Página {pageNum} de {totalPages}</p>
        </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-indigo-950/90 backdrop-blur-sm z-50 overflow-y-auto print:overflow-visible print:bg-white">
      <style>{`
        @page { size: letter; margin: 0; }
        @media print {
          body { -webkit-print-color-adjust: exact; background-color: white !important; }
          .page-break { page-break-after: always; }
          .no-print { display: none !important; }
          .sheet { box-shadow: none !important; margin: 0 !important; }
        }
      `}</style>

      <div className="min-h-screen w-full flex flex-col items-center py-8 px-4 print:p-0 print:block">

        <div className="bg-slate-900 p-4 rounded-xl shadow-xl flex justify-between items-center text-white print:hidden w-full max-w-[21.59cm] mb-6 border border-white/10 sticky top-4 z-50">
          <h3 className="font-bold flex items-center text-sm md:text-lg">
            <ShieldCheck className="mr-2 text-indigo-400" size={24} />
            Vista Preliminar de Constancia Legal
          </h3>
          <div className="flex space-x-3">
            <button 
                onClick={handlePrint}
                className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm font-bold flex items-center transition-colors shadow-lg border border-indigo-500"
            >
                <Printer size={18} className="mr-2" />
                Imprimir / PDF
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
                <X size={24} />
            </button>
          </div>
        </div>

        {/* ======================= PÁGINA 1 ======================= */}
        <div className="sheet bg-white w-full max-w-[21.59cm] h-[27.94cm] px-[2.2cm] py-[2.5cm] shadow-2xl !text-black relative print:shadow-none print:w-full print:h-[27.94cm] print:m-0 font-sans leading-snug text-justify flex flex-col mb-8 print:mb-0 print:break-after-page page-break box-border" style={{ fontFamily: 'Arial, sans-serif' }}>
            
            <PageHeader />

            <div className="flex-1">
                <div className="text-center mb-6">
                    <h2 className="text-[13pt] font-bold uppercase !text-black decoration-double underline underline-offset-4" style={{ fontFamily: 'Arial, sans-serif' }}>
                        CONSTANCIA DE ACEPTACIÓN DE AVISOS DE PRIVACIDAD<br/>Y TÉRMINOS DE USO DEL SISTEMA CODEX
                    </h2>
                </div>

                <div className="text-[11pt] space-y-2 !text-black mb-6" style={{ fontFamily: 'Arial, sans-serif' }}>
                    <p>
                        En la ciudad de Naucalpan de Juárez, siendo las <strong>{timeString}</strong> del día <strong>{dateString}</strong>, se emite la presente CONSTANCIA para certificar la adhesión formal y legal del Usuario a las normativas corporativas.
                    </p>
                </div>

                <div className="text-[11pt] space-y-4" style={{ fontFamily: 'Arial, sans-serif' }}>
                    
                    <div>
                        <h4 className="font-bold !text-black uppercase text-[12pt] mb-2 border-b border-black pb-0.5" style={{ fontFamily: 'Arial, sans-serif' }}>I. Identificación del Usuario</h4>
                        <table className="w-full border-collapse border-2 border-black text-[11pt] mb-1">
                            <tbody>
                                <tr>
                                    <td className="border border-black bg-gray-200 p-2 font-bold w-1/3 !text-black">NOMBRE DEL USUARIO:</td>
                                    <td className="border border-black p-2 uppercase font-semibold !text-black bg-white">{displayUserName}</td>
                                </tr>
                                <tr>
                                    <td className="border border-black bg-gray-200 p-2 font-bold !text-black">ID DE USUARIO:</td>
                                    <td className="border border-black p-2 font-mono !text-black bg-white">{user.$id}</td>
                                </tr>
                                <tr>
                                    <td className="border border-black bg-gray-200 p-2 font-bold !text-black">DEPARTAMENTO:</td>
                                    <td className="border border-black p-2 uppercase font-semibold !text-black bg-white">{displayDepartment}</td>
                                </tr>
                                <tr>
                                    <td className="border border-black bg-gray-200 p-2 font-bold !text-black">CORREO:</td>
                                    <td className="border border-black p-2 !text-black bg-white">{user.email}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="!text-black">
                        <h4 className="font-bold !text-black uppercase text-[12pt] mb-1" style={{ fontFamily: 'Arial, sans-serif' }}>II. Declaración de Consentimiento Legal</h4>
                        <p className="text-justify leading-snug !text-black">
                            El Usuario otorga su <strong>CONSENTIMIENTO EXPRESO, TOTAL, IRREVOCABLE</strong> para el uso, operación y navegación dentro del Sistema CODEX.
                        </p>
                    </div>

                    <div className="!text-black">
                        <h4 className="font-bold !text-black uppercase text-[12pt] mb-1" style={{ fontFamily: 'Arial, sans-serif' }}>III. Aceptación del Aviso de Privacidad</h4>
                        <p className="text-justify leading-snug !text-black">
                            El Usuario manifiesta haber leído, comprendido y aceptado en su totalidad el <strong>Aviso de Privacidad Integral</strong> y el <strong>Acuerdo Corporativo de Uso y Regulación (ACUR CODEX)</strong>.
                        </p>
                    </div>

                     <div className="!text-black">
                        <h4 className="font-bold !text-black uppercase text-[12pt] mb-1" style={{ fontFamily: 'Arial, sans-serif' }}>IV. Naturaleza Corporativa del Sistema</h4>
                        <p className="text-justify leading-snug !text-black">
                            El Usuario reconoce y acepta que el Sistema CODEX es propiedad exclusiva de <strong>SUAVE Y FÁCIL CV DIRECTO S.A. DE C.V.</strong>
                        </p>
                    </div>

                    <div className="!text-black">
                        <h4 className="font-bold !text-black uppercase text-[12pt] mb-1" style={{ fontFamily: 'Arial, sans-serif' }}>V. Responsabilidad Personalísima</h4>
                        <p className="text-justify leading-snug !text-black">
                            El Usuario reconoce que su acceso es <strong>PERSONAL E INTRANSFERIBLE</strong>. Se compromete a resguardar sus credenciales y asume la <strong>responsabilidad absoluta</strong> por cualquier actividad realizada.
                        </p>
                    </div>

                    <div className="!text-black">
                        <h4 className="font-bold !text-black uppercase text-[12pt] mb-1" style={{ fontFamily: 'Arial, sans-serif' }}>VI. Monitoreo y Registro Forense</h4>
                        <p className="text-justify leading-snug !text-black">
                            El Usuario acepta que toda su actividad dentro de CODEX está sujeta a monitoreo permanente y renuncia expresamente a cualquier expectativa de privacidad en la plataforma.
                        </p>
                    </div>
                </div>
            </div>

            <PageFooter pageNum={1} totalPages={2} />
        </div>

        {/* ======================= PÁGINA 2 ======================= */}
        <div className="sheet bg-white w-full max-w-[21.59cm] h-[27.94cm] px-[2.2cm] py-[2.5cm] shadow-2xl !text-black relative print:shadow-none print:w-full print:h-[27.94cm] print:m-0 font-sans leading-snug text-justify flex flex-col print:break-before-page page-break box-border" style={{ fontFamily: 'Arial, sans-serif' }}>
            
            <PageHeader />

            <div className="flex-1 text-[11pt] space-y-6 !text-black" style={{ fontFamily: 'Arial, sans-serif' }}>
                
                 <div className="mt-2 !text-black">
                    <h4 className="font-bold !text-black uppercase text-[12pt] mb-2" style={{ fontFamily: 'Arial, sans-serif' }}>VII. Horarios de Uso Autorizados</h4>
                    <p className="text-justify leading-snug !text-black mb-4">
                        El Usuario se obliga a utilizar el Sistema CODEX únicamente dentro de los horarios operativos autorizados:
                    </p>
                    <table className="mx-auto w-3/4 border-2 border-black text-[11pt]">
                        <tbody>
                            <tr>
                                <td className="border border-black bg-gray-200 px-4 py-2 font-bold text-center !text-black">Lunes a Viernes</td>
                                <td className="border border-black px-4 py-2 text-center font-semibold !text-black bg-white">07:00 – 19:00 horas</td>
                            </tr>
                            <tr>
                                <td className="border border-black bg-gray-200 px-4 py-2 font-bold text-center !text-black">Sábado y Domingo</td>
                                <td className="border border-black px-4 py-2 text-center font-semibold !text-black bg-white">07:00 – 13:00 horas</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                 <div className="!text-black">
                    <h4 className="font-bold !text-black uppercase text-[12pt] mb-2" style={{ fontFamily: 'Arial, sans-serif' }}>VIII. Restricción de Dispositivos</h4>
                    <p className="text-justify leading-snug !text-black">
                        Queda estrictamente prohibido el acceso a CODEX desde dispositivos personales o no autorizados. El Usuario acepta los riesgos y responsabilidades legales derivados.
                    </p>
                </div>

                <div className="!text-black">
                    <h4 className="font-bold !text-black uppercase text-[12pt] mb-2" style={{ fontFamily: 'Arial, sans-serif' }}>IX. Efectos Legales</h4>
                    <p className="text-justify leading-snug !text-black">
                        La presente constancia tiene plena validez jurídica interna y constituye <strong>PRUEBA PLENA DE CONSENTIMIENTO</strong> del Usuario.
                    </p>
                </div>

                <div className="pt-12 !text-black">
                    <h4 className="font-bold !text-black uppercase text-[12pt] mb-8 border-b border-black pb-1 text-center" style={{ fontFamily: 'Arial, sans-serif' }}>X. Firma Digital del Usuario</h4>
                    
                    <div className="flex justify-center mt-4">
                        <div className="text-center w-full max-w-md border border-gray-300 p-8 bg-gray-50/50">
                            <p className="text-[14pt] font-bold uppercase mb-2 !text-black">{displayUserName}</p>
                            <p className="text-[9pt] !text-black uppercase font-bold border-t-2 border-black inline-block pt-1 min-w-[250px]">FIRMA ELECTRÓNICA DE ACEPTACIÓN</p>
                            
                            <div className="mt-6 text-[9pt] !text-gray-600 font-mono">
                                <p>HASH: {folioRegistro}</p>
                                <p>Fecha: {dateString} {timeString}</p>
                                <p>IP Registro: {ipAddress}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <PageFooter pageNum={2} totalPages={2} />
        </div>

      </div>
    </div>
  );
};
