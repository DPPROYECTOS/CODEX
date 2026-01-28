
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertCircle, MonitorX, Cpu, ShieldCheck } from 'lucide-react';
import { Logo } from '../components/Logo';
import { appwriteService } from '../services/appwriteService';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOperaGX, setIsOperaGX] = useState(false);
  const [recentEmails, setRecentEmails] = useState<string[]>([]);
  const [deviceId, setDeviceId] = useState('');

  useEffect(() => {
    // Detectar Opera GX
    const ua = navigator.userAgent;
    if (ua.includes('OPR') && ua.includes('GX')) {
        setIsOperaGX(true);
    }
    
    // Recuperar historial de correos (Preservar función solicitada)
    try {
        const saved = JSON.parse(localStorage.getItem('codex_recent_emails') || '[]');
        setRecentEmails(saved);
    } catch (e) {}

    // Obtener ID de hardware determinista para mostrar en UI
    setDeviceId(appwriteService.getDeviceId());
  }, []);

  const saveEmailToHistory = (emailToSave: string) => {
    try {
        const currentList = JSON.parse(localStorage.getItem('codex_recent_emails') || '[]');
        if (!currentList.includes(emailToSave)) {
            const newList = [emailToSave, ...currentList].slice(0, 5); 
            localStorage.setItem('codex_recent_emails', JSON.stringify(newList));
        }
    } catch (e) {
        console.error("Error guardando historial de correo");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      saveEmailToHistory(email);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error desconocido.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] px-4 py-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-slate-900/20 opacity-10 pointer-events-none"></div>

      <div className="max-w-md w-full bg-slate-900 rounded-xl shadow-2xl p-8 border border-white/10 relative z-10">
        
        <div className="flex justify-center mb-8">
            <Logo className="w-80 md:w-96 h-auto text-white" />
        </div>

        {isOperaGX && (
           <div className="mb-6 bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 text-sm text-purple-200">
              <div className="flex items-center font-bold mb-2 text-purple-400">
                 <MonitorX size={18} className="mr-2" />
                 Detectado Opera GX
              </div>
              <p>Si la conexión falla, intenta desactivar el <strong>VPN</strong> y el <strong>Bloqueo de Rastreadores</strong>.</p>
           </div>
        )}

        <div className="mb-6 flex items-center justify-between bg-black/40 px-4 py-2 rounded-lg border border-white/5">
            <div className="flex items-center text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                <Cpu size={12} className="mr-2 text-indigo-500" />
                Terminal ID
            </div>
            <div className="flex items-center text-[10px] font-mono text-indigo-400">
                {deviceId}
                <ShieldCheck size={12} className="ml-2 text-emerald-500" />
            </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-900/20 border-l-4 border-red-500 p-4 rounded shadow-sm">
            <div className="flex items-start">
                <AlertCircle className="text-red-500 mr-3 mt-0.5 flex-shrink-0" size={20} />
                <div className="flex-1">
                    <p className="text-sm text-red-300 font-bold mb-1">No se pudo iniciar sesión</p>
                    <p className="text-xs text-red-400 font-mono whitespace-pre-wrap leading-relaxed">
                        {error}
                    </p>
                </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-1">Correo Electrónico</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-gray-500" />
              </div>
              <input
                type="email"
                name="email"
                required
                list="email-history"
                className="block w-full pl-10 pr-3 py-3 bg-slate-800 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm text-white placeholder-gray-500"
                placeholder="usuario@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
              />
              <datalist id="email-history">
                {recentEmails.map((savedEmail, index) => (
                    <option key={index} value={savedEmail} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-300 mb-1">Contraseña</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-500" />
              </div>
              <input
                type="password"
                name="password"
                required
                className="block w-full pl-10 pr-3 py-3 bg-slate-800 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm text-white placeholder-gray-500"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-indigo-700 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-900 transition-all ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-lg'}`}
          >
            {isSubmitting ? 'Verificando credenciales...' : 'Acceder al Sistema'}
          </button>
        </form>
      </div>

      <div className="absolute bottom-6 right-6 opacity-20 pointer-events-none select-none">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Build v1.5</span>
      </div>
    </div>
  );
};
