
import React, { useState, useEffect } from 'react';
import { Timer, Coffee, Play, Square, History, AlertCircle, BellRing } from 'lucide-react';

const LIMIT_DRIVING = 19800; // 5h 30min em segundos
const LIMIT_REST = 1800;    // 30min em segundos

export const JornadaManager: React.FC = () => {
  const [mode, setMode] = useState<'IDLE' | 'DRIVING' | 'RESTING'>('IDLE');
  const [time, setTime] = useState(0); 
  const [logs, setLogs] = useState<{start: string, end?: string, duration: number, type: string}[]>([]);
  const [alert, setAlert] = useState<string | null>(null);

  useEffect(() => {
    let interval: any;
    if (mode !== 'IDLE') {
      interval = setInterval(() => setTime(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [mode]);

  useEffect(() => {
    // Alerta de limite de direção
    if (mode === 'DRIVING' && time >= LIMIT_DRIVING) {
      setAlert("⚠️ LIMITE DE 5h30 ATINGIDO! Pare imediatamente para descansar.");
    } 
    // Alerta de descanso concluído
    else if (mode === 'RESTING' && time >= LIMIT_REST) {
      setAlert("✅ DESCANSO DE 30 MINUTOS CONCLUÍDO! Você pode retomar a jornada.");
    } else {
      setAlert(null);
    }
  }, [time, mode]);

  const formatTime = (s: number) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAction = (newMode: 'IDLE' | 'DRIVING' | 'RESTING') => {
    if (mode !== 'IDLE') {
      setLogs([{ 
        start: new Date(Date.now() - time*1000).toLocaleTimeString(), 
        end: new Date().toLocaleTimeString(), 
        duration: time,
        type: mode === 'DRIVING' ? 'Direção' : 'Descanso'
      }, ...logs]);
    }
    setTime(0);
    setMode(newMode);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className={`rounded-[3rem] p-10 text-center text-white shadow-2xl transition-all duration-500 relative overflow-hidden ${mode === 'DRIVING' ? 'bg-primary-900' : mode === 'RESTING' ? 'bg-emerald-900' : 'bg-slate-900'}`}>
        
        {alert && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[90%] bg-white p-4 rounded-2xl flex items-center gap-3 text-slate-900 animate-bounce shadow-2xl z-20">
            <BellRing className={mode === 'DRIVING' ? 'text-rose-500' : 'text-emerald-500'} />
            <p className="font-black text-sm">{alert}</p>
          </div>
        )}

        <Timer size={48} className="text-primary-400 mx-auto mb-6" />
        <h2 className="text-3xl font-black mb-2">
          {mode === 'DRIVING' ? 'Ao Volante' : mode === 'RESTING' ? 'Em Descanso' : 'Controle de Jornada'}
        </h2>
        
        <div className="text-7xl md:text-9xl font-black font-mono my-12 tracking-tighter">
          {formatTime(time)}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          {mode !== 'DRIVING' ? (
            <button onClick={() => handleAction('DRIVING')} className="w-full md:w-64 py-5 bg-primary-600 hover:bg-primary-700 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 shadow-lg transition-all active:scale-95">
              <Play size={24}/> Iniciar Direção
            </button>
          ) : (
            <button onClick={() => handleAction('IDLE')} className="w-full md:w-64 py-5 bg-rose-500 hover:bg-rose-600 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 shadow-lg transition-all active:scale-95">
              <Square size={24}/> Parar
            </button>
          )}

          {mode !== 'RESTING' ? (
            <button onClick={() => handleAction('RESTING')} className="w-full md:w-64 py-5 bg-slate-800 hover:bg-slate-700 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 shadow-lg transition-all active:scale-95">
              <Coffee size={24}/> Iniciar Descanso
            </button>
          ) : (
            <button onClick={() => handleAction('IDLE')} className="w-full md:w-64 py-5 bg-emerald-600 hover:bg-emerald-700 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 shadow-lg transition-all active:scale-95">
              <Square size={24}/> Finalizar
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
          <h3 className="text-xl font-black mb-6 flex items-center gap-3"><History/> Registros Recentes</h3>
          <div className="space-y-4">
            {logs.length === 0 ? (
              <p className="text-slate-400 text-sm py-4">Nenhum registro nesta sessão.</p>
            ) : logs.map((log, i) => (
              <div key={i} className={`p-4 rounded-2xl flex justify-between items-center border ${log.type === 'Direção' ? 'bg-blue-50 border-blue-100' : 'bg-emerald-50 border-emerald-100'}`}>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">{log.type}</p>
                  <p className="font-bold text-slate-700">{log.start} → {log.end}</p>
                </div>
                <p className="font-black text-slate-900">{formatTime(log.duration)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-amber-50 p-8 rounded-[2.5rem] border border-amber-100">
           <h3 className="text-xl font-black text-amber-900 mb-6 flex items-center gap-3"><AlertCircle/> Lei do Motorista</h3>
           <ul className="space-y-4 text-amber-800 text-sm font-bold">
              <li className="flex gap-3">✅ 5h30 de direção / 30 min de descanso.</li>
              <li className="flex gap-3">✅ Mínimo de 11h de descanso diário.</li>
              <li className="flex gap-3">✅ A cada 24h, o motorista tem direito a descanso.</li>
           </ul>
        </div>
      </div>
    </div>
  );
};
