
import React, { useState, useEffect } from 'react';
import { Timer, Coffee, Play, Square, History, AlertCircle, BellRing, Trash2, Clock } from 'lucide-react';
import { JornadaLog } from '../types';

const LIMIT_DRIVING = 19800; // 5h 30min em segundos
const LIMIT_REST = 1800;    // 30min em segundos

interface JornadaManagerProps {
  mode: 'IDLE' | 'DRIVING' | 'RESTING';
  startTime: number | null;
  logs: JornadaLog[];
  setMode: (mode: 'IDLE' | 'DRIVING' | 'RESTING') => void;
  setStartTime: (time: number | null) => void;
  onSaveLog: (log: Omit<JornadaLog, 'id' | 'user_id'>) => Promise<void>;
  onDeleteLog: (id: string) => Promise<void>;
}

export const JornadaManager: React.FC<JornadaManagerProps> = ({ mode, startTime, logs, setMode, setStartTime, onSaveLog, onDeleteLog }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [alert, setAlert] = useState<string | null>(null);

  useEffect(() => {
    let interval: any;
    if (mode !== 'IDLE' && startTime) {
      const updateTime = () => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setCurrentTime(elapsed);
      };
      
      updateTime();
      interval = setInterval(updateTime, 1000);
    } else {
      setCurrentTime(0);
    }
    return () => clearInterval(interval);
  }, [mode, startTime]);

  useEffect(() => {
    if (mode === 'DRIVING' && currentTime >= LIMIT_DRIVING) {
      const msg = "⚠️ LIMITE DE 5h30 ATINGIDO! Pare imediatamente.";
      setAlert(msg);
      triggerPushNotification("Alerta de Jornada", msg);
    } 
    else if (mode === 'RESTING' && currentTime >= LIMIT_REST) {
      const msg = "✅ DESCANSO DE 30 MINUTOS CONCLUÍDO!";
      setAlert(msg);
      triggerPushNotification("Jornada Atualizada", msg);
    } else {
      setAlert(null);
    }
  }, [currentTime, mode]);

  const triggerPushNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    }
  };

  const formatTime = (s: number) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAction = async (newMode: 'IDLE' | 'DRIVING' | 'RESTING') => {
    if (mode !== 'IDLE' && startTime) {
      const now = Date.now();
      const duration = Math.floor((now - startTime) / 1000);
      
      const newLog: Omit<JornadaLog, 'id' | 'user_id'> = { 
        start_time: new Date(startTime).toISOString(), 
        end_time: new Date(now).toISOString(), 
        duration_seconds: duration,
        type: mode === 'DRIVING' ? 'Direção' : 'Descanso',
        date: new Date().toISOString().split('T')[0]
      };
      
      await onSaveLog(newLog);
    }

    if (newMode === 'IDLE') {
      setStartTime(null);
      localStorage.removeItem('aurilog_jornada_mode');
    } else {
      const now = Date.now();
      setStartTime(now);
      localStorage.setItem('aurilog_jornada_mode', newMode);
    }
    setMode(newMode);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-fade-in">
      <div className={`rounded-[3rem] p-10 text-center text-white shadow-2xl transition-all duration-500 relative overflow-hidden ${mode === 'DRIVING' ? 'bg-primary-900' : mode === 'RESTING' ? 'bg-emerald-900' : 'bg-slate-900'}`}>
        
        {alert && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[90%] bg-white p-4 rounded-2xl flex items-center gap-3 text-slate-900 animate-bounce shadow-2xl z-20">
            <BellRing className={mode === 'DRIVING' ? 'text-rose-500' : 'text-emerald-500'} />
            <p className="font-black text-sm">{alert}</p>
          </div>
        )}

        <Timer size={48} className="text-primary-400 mx-auto mb-6" />
        <h2 className="text-3xl font-black mb-2 uppercase tracking-tighter">
          {mode === 'DRIVING' ? 'Ao Volante' : mode === 'RESTING' ? 'Em Descanso' : 'Jornada Profissional'}
        </h2>
        
        <div className="text-7xl md:text-9xl font-black font-mono my-12 tracking-tighter">
          {formatTime(currentTime)}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-2">
        <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black flex items-center gap-3"><History/> Histórico em Nuvem</h3>
          </div>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {logs.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="mx-auto text-slate-100 mb-2" size={48} />
                <p className="text-slate-400 text-sm font-bold">Nenhum registro sincronizado.</p>
              </div>
            ) : logs.map((log) => (
              <div key={log.id} className={`p-4 rounded-2xl flex justify-between items-center border animate-fade-in ${log.type === 'Direção' ? 'bg-blue-50 border-blue-100' : 'bg-emerald-50 border-emerald-100'}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`text-[10px] font-black uppercase ${log.type === 'Direção' ? 'text-primary-600' : 'text-emerald-600'}`}>{log.type}</p>
                    <span className="text-[10px] text-slate-400 font-bold">{new Date(log.date).toLocaleDateString()}</span>
                  </div>
                  <p className="font-bold text-slate-700 text-sm">
                    {new Date(log.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                    <span className="mx-2">→</span>
                    {new Date(log.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-black text-slate-900 text-sm">{formatTime(log.duration_seconds)}</p>
                  <button onClick={() => onDeleteLog(log.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                    <Trash2 size={16}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-amber-50 p-8 rounded-[2.5rem] border border-amber-100 h-fit">
           <h3 className="text-xl font-black text-amber-900 mb-6 flex items-center gap-3"><AlertCircle/> Normas da Lei 13.103</h3>
           <ul className="space-y-4 text-amber-800 text-sm font-bold">
              <li className="flex gap-3">✅ Tempo máximo de direção ininterrupta: 5h 30min.</li>
              <li className="flex gap-3">✅ Tempo mínimo de descanso obrigatório: 30 minutos.</li>
              <li className="flex gap-3">✅ Descanso diário obrigatório de 11 horas.</li>
              <li className="flex gap-3 mt-4 text-[10px] uppercase opacity-60">As notificações deste app ajudam você a cumprir a lei.</li>
           </ul>
        </div>
      </div>
    </div>
  );
};
