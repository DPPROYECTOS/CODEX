import React from 'react';
import { Clock, Lock, ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ScheduleLockScreenProps {
  previewMode?: boolean;
}

export const ScheduleLockScreen: React.FC<ScheduleLockScreenProps> = ({ previewMode = false }) => {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Fondo animado sutil */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-900 to-slate-900 pointer-events-none"></div>
      
      {previewMode && (
        <div className="absolute top-4 left-4 z-50">
            <Link to="/admin" className="flex items-center text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg font-bold transition-colors shadow-lg">
                <ArrowLeft size={20} className="mr-2" />
                Salir de Vista Previa
            </Link>
        </div>
      )}

      <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-2xl p-8 text-center shadow-2xl relative z-10">
        <div className="flex justify-center mb-6">
            <div className="relative">
                <div className="absolute inset-0 bg-red-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                <div className="bg-slate-900 p-4 rounded-full border-2 border-red-500/50 relative">
                    <Lock size={48} className="text-red-500" />
                </div>
            </div>
        </div>

        <h1 className="text-3xl font-black text-white mb-2 tracking-tight">SISTEMA CERRADO</h1>
        <p className="text-slate-400 font-medium mb-8">CODEX OPERATIONAL PLATFORM</p>

        <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50 mb-8">
            <div className="flex items-center justify-center space-x-2 text-red-400 font-bold mb-4 uppercase text-xs tracking-widest">
                <Clock size={14} />
                <span>Horario Operativo</span>
            </div>
            
            <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center pb-2 border-b border-slate-700/50">
                    <span className="text-slate-300 font-medium">Lunes a Viernes</span>
                    <span className="text-white font-bold font-mono">07:00 - 18:00</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-300 font-medium">Sábado</span>
                    <span className="text-white font-bold font-mono">07:00 - 13:00</span>
                </div>
            </div>
        </div>

        <div className="flex items-start space-x-3 text-left bg-red-900/20 p-4 rounded-lg border border-red-900/30">
            <ShieldAlert className="text-red-400 shrink-0 mt-0.5" size={20} />
            <div>
                <p className="text-red-200 text-xs font-bold mb-1">ACCESO DENEGADO</p>
                <p className="text-red-300/80 text-xs leading-relaxed">
                    Por protocolos de seguridad corporativa, la plataforma no admite conexiones fuera del horario establecido.
                    Cualquier intento de evasión será registrado.
                </p>
            </div>
        </div>

        <div className="mt-8 text-slate-600 text-xs font-mono uppercase">
            Server Time: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};