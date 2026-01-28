
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
    Monitor, Cpu, Zap, Battery, BatteryCharging, Wifi, 
    Smartphone, Database, LayoutGrid, Info, ShieldAlert,
    Terminal, Gauge, Globe, Server, Activity, ChevronRight, X
} from 'lucide-react';
import { OnlineUser, DeviceSpecs } from '../types';

export const AdminTelemetry: React.FC = () => {
  const { onlineUsers } = useAuth();
  const [selectedUser, setSelectedUser] = useState<OnlineUser | null>(null);

  const getBatteryIcon = (level?: number, charging?: boolean) => {
    if (charging) return <BatteryCharging size={16} className="text-emerald-500" />;
    if (!level) return <Battery size={16} className="text-gray-500" />;
    if (level < 20) return <Battery size={16} className="text-red-500" />;
    if (level < 60) return <Battery size={16} className="text-amber-500" />;
    return <Battery size={16} className="text-emerald-500" />;
  };

  const TelemetryCard = ({ user }: { user: OnlineUser }) => {
    const specs = user.deviceSpecs;
    return (
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 hover:border-indigo-500/40 transition-all group relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
            <Terminal size={64} className="text-indigo-400" />
        </div>

        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center border border-indigo-500/20 text-indigo-400 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm">
                {user.name.charAt(0)}
            </div>
            <div>
                <h4 className="text-sm font-black text-gray-200 uppercase tracking-tighter truncate max-w-[150px]">{user.name}</h4>
                <p className="text-[10px] font-mono text-indigo-400/70">{user.ip}</p>
            </div>
          </div>
          <button 
            onClick={() => setSelectedUser(user)}
            className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all"
          >
            <Gauge size={18} />
          </button>
        </div>

        {specs ? (
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-slate-950/50 p-2 rounded-lg border border-white/5 flex items-center gap-2">
                <Cpu size={14} className="text-cyan-400" />
                <div>
                    <p className="text-[8px] font-black text-gray-500 uppercase">Cores</p>
                    <p className="text-[10px] font-mono text-white">{specs.cpuCores}</p>
                </div>
            </div>
            <div className="bg-slate-950/50 p-2 rounded-lg border border-white/5 flex items-center gap-2">
                <Database size={14} className="text-purple-400" />
                <div>
                    <p className="text-[8px] font-black text-gray-500 uppercase">RAM</p>
                    <p className="text-[10px] font-mono text-white">{specs.ramGB}GB</p>
                </div>
            </div>
            <div className="bg-slate-950/50 p-2 rounded-lg border border-white/5 flex items-center gap-2">
                <LayoutGrid size={14} className="text-amber-400" />
                <div className="min-w-0">
                    <p className="text-[8px] font-black text-gray-500 uppercase">Pantalla</p>
                    <p className="text-[10px] font-mono text-white truncate">{specs.resolution.split(' ')[0]}</p>
                </div>
            </div>
            <div className="bg-slate-950/50 p-2 rounded-lg border border-white/5 flex items-center gap-2">
                {getBatteryIcon(specs.batteryLevel, specs.isCharging)}
                <div>
                    <p className="text-[8px] font-black text-gray-500 uppercase">Energía</p>
                    <p className="text-[10px] font-mono text-white">{specs.batteryLevel || '--'}%</p>
                </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 p-4 text-center border border-dashed border-white/10 rounded-xl">
             <p className="text-[10px] text-gray-600 font-bold uppercase italic">Telemetría no soportada</p>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center">
            <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{user.area}</span>
            <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                <span className="text-[9px] font-mono text-emerald-500 font-bold">LIVE</span>
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-mono">
      {/* Header Estilo Command Center */}
      <div className="bg-slate-900 p-8 rounded-3xl border border-indigo-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent opacity-30"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
                <Terminal size={24} className="text-indigo-400" />
                <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Telemetría de Terminales</h1>
            </div>
            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest flex items-center">
                <Server size={14} className="mr-2 text-indigo-500" />
                Auditoría Técnica de Hardware en Tiempo Real
            </p>
          </div>
          <div className="flex gap-4">
              <div className="bg-black/40 px-6 py-3 rounded-2xl border border-white/5 flex flex-col items-center">
                <span className="text-xs text-indigo-400 font-black mb-1">NODOS</span>
                <span className="text-2xl font-black text-white">{onlineUsers.length}</span>
              </div>
              <div className="bg-black/40 px-6 py-3 rounded-2xl border border-white/5 flex flex-col items-center">
                <span className="text-xs text-emerald-400 font-black mb-1">STATUS</span>
                <span className="text-2xl font-black text-emerald-500 animate-pulse">SYNC</span>
              </div>
          </div>
        </div>
      </div>

      {/* Grid de Terminales */}
      {onlineUsers.length === 0 ? (
        <div className="py-40 text-center bg-slate-900 rounded-[3rem] border border-dashed border-white/10">
            <Monitor size={80} className="mx-auto text-slate-800 mb-6" />
            <p className="text-gray-500 font-black uppercase tracking-widest text-lg">No hay terminales activas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {onlineUsers.map(u => <TelemetryCard key={u.userId} user={u} />)}
        </div>
      )}

      {/* Alerta de Seguridad Técnica */}
      <div className="bg-amber-950/20 border border-amber-500/20 rounded-3xl p-6 flex items-start gap-4 shadow-inner">
          <ShieldAlert size={32} className="text-amber-500 shrink-0" />
          <div>
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-[0.2em] mb-1">Aviso de Seguridad de Telemetría</h4>
            <p className="text-xs text-amber-200/60 leading-relaxed uppercase font-bold">
                Los datos recolectados incluyen identificadores únicos de GPU, núcleos de CPU y arquitectura de sistema. 
                Cualquier discrepancia técnica respecto al perfil registrado del colaborador generará una alerta de "Terminal No Autorizada".
            </p>
          </div>
      </div>

      {/* Detalle Modal de Telemetría */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4" onClick={() => setSelectedUser(null)}>
            <div className="bg-slate-900 w-full max-w-2xl rounded-[2rem] border border-indigo-500/30 shadow-[0_0_100px_rgba(79,70,229,0.3)] overflow-hidden animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
                
                {/* Modal Header */}
                <div className="p-8 border-b border-white/10 bg-slate-950 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-900/40">
                            <Activity size={32} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">Diagnóstico Terminal</h3>
                            <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest mt-1">ID: {selectedUser.userId}</p>
                        </div>
                    </div>
                    <button onClick={() => setSelectedUser(null)} className="p-3 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-colors">
                        <X size={28} />
                    </button>
                </div>

                <div className="p-8 bg-slate-950/40">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Hardware Section */}
                        <div className="space-y-6">
                            <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Monitor size={14} className="text-indigo-400" /> 
                                Especificaciones Físicas
                            </h4>
                            <div className="space-y-4">
                                <DataRow label="Procesador (Log)" value={`${selectedUser.deviceSpecs?.cpuCores} Threads`} icon={Cpu} />
                                <DataRow label="Memoria RAM" value={`${selectedUser.deviceSpecs?.ramGB} GB Estimados`} icon={Database} />
                                <DataRow label="Plataforma OS" value={selectedUser.deviceSpecs?.platform || 'N/A'} icon={Smartphone} />
                                <DataRow label="GPU" value={selectedUser.deviceSpecs?.gpu || 'N/A'} icon={Zap} subtext />
                            </div>
                        </div>

                        {/* Network/Energy Section */}
                        <div className="space-y-6">
                            <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Globe size={14} className="text-emerald-400" /> 
                                Conectividad & Estado
                            </h4>
                            <div className="space-y-4">
                                <DataRow label="Tipo Conexión" value={selectedUser.deviceSpecs?.connectionType || 'WiFi'} icon={Wifi} />
                                <DataRow label="Latencia Est." value={`${selectedUser.deviceSpecs?.downlinkMbps} Mbps`} icon={Activity} />
                                <DataRow label="Idioma Sistema" value={selectedUser.deviceSpecs?.language || 'es-MX'} icon={Globe} />
                                <DataRow label="Batería" value={`${selectedUser.deviceSpecs?.batteryLevel}% ${selectedUser.deviceSpecs?.isCharging ? '[CARGANDO]' : ''}`} icon={Battery} />
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 p-6 bg-indigo-950/20 border border-indigo-500/20 rounded-2xl">
                         <div className="flex items-center gap-3 mb-3">
                             <Terminal size={18} className="text-indigo-400" />
                             <span className="text-[10px] font-black text-white uppercase tracking-widest">User Agent Forensic</span>
                         </div>
                         <p className="text-[10px] font-mono text-indigo-300 leading-relaxed break-all opacity-60">
                             {navigator.userAgent}
                         </p>
                    </div>
                </div>

                <div className="p-8 bg-slate-950 border-t border-white/5 flex justify-end">
                    <button 
                        onClick={() => setSelectedUser(null)}
                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg"
                    >
                        Cerrar Diagnóstico
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

const DataRow = ({ label, value, icon: Icon, subtext = false }: { label: string, value: string | number, icon: any, subtext?: boolean }) => (
    <div className="flex items-start gap-3">
        <div className="p-2 bg-slate-800 rounded-lg border border-white/5 text-gray-400 mt-0.5">
            <Icon size={14} />
        </div>
        <div className="min-w-0">
            <p className="text-[9px] font-black text-gray-600 uppercase tracking-tighter leading-none mb-1">{label}</p>
            <p className={`font-bold text-white uppercase leading-tight ${subtext ? 'text-[10px] opacity-70 italic' : 'text-xs'}`}>
                {value}
            </p>
        </div>
    </div>
);
