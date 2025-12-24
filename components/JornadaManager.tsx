
import React, { useState, useEffect } from 'react';
import { Timer, Coffee, Play, Square, History, AlertCircle, BellRing, Trash2 } from 'lucide-react';

const LIMIT_DRIVING = 19800; // 5h 30min em segundos
const LIMIT_REST = 1800;    // 30min em segundos

interface JornadaManagerProps {
  mode: 'IDLE' | 'DRIVING' | 'RESTING';
  startTime: number | null;
  logs: any[];
  setMode: (mode: 'IDLE' | 'DRIVING' | 'RESTING') => void;
  setStartTime: (time: number | null) => void;
  setLogs: React.Dispatch<React.SetStateAction<any[]>>;
}

export const JornadaManager: React.FC<JornadaManagerProps> = ({ mode, startTime, logs, setMode, setStartTime, setLogs }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [alert, setAlert] = useState<string | null>(null);

  useEffect(() => {
    let interval: any;
    if (mode !== 'IDLE' && startTime) {
      // Calcula o tempo decorrido imediatamente ao montar ou mudar modo
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
    // Alerta de limite de direção
    if (mode === 'DRIVING' && currentTime >= LIMIT_DRIVING) {
      setAlert("⚠️ LIMITE DE 5h30 ATINGIDO! Pare imediatamente para descansar.");
    } 
    // Alerta de descanso concluído
    else if (mode === 'RESTING' && currentTime >= LIMIT_REST) {
      setAlert("✅ DESCANSO DE 30 MINUTOS CONCLUÍDO! Você pode retomar a jornada.");
    } else {
      setAlert(null);
    }
  }, [currentTime, mode]);

  const formatTime = (s: number) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAction = (newMode: 'IDLE' | 'DRIVING' | 'RESTING') => {
    // Se estava rodando algo, salva o log antes de mudar
    if (mode !== 'IDLE' && startTime) {
      const now = Date.now();
      const duration = Math.floor((now - startTime) / 1000);
      
      const newLog = { 
        id: now.toString(),
        start: new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
        end: new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
        duration: duration,
        type: mode === 'DRIVING' ? 'Direção' : 'Descanso',
        date: new Date().toLocaleDateString()
      };
      
      setLogs(prev => [newLog, ...prev]);
    }

    if (newMode === 'IDLE') {
      setStartTime(null);
    } else {
      setStartTime(Date.now());
    }
    setMode(newMode);
  };

  const clearHistory = () => {
    if (window.confirm("Deseja apagar todo o histórico de jornada?")) {
      setLogs([]);
    }
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black flex items-center gap-3"><History/> Registros Recentes</h3>
            {logs.length > 0 && (
              <button onClick={clearHistory} className="text-slate-400 hover:text-rose-500 transition-colors">
                <Trash2 size={20}/>
              </button>
            )}
          </div>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {logs.length === 0 ? (
              <p className="text-slate-400 text-sm py-4">Nenhum registro encontrado.</p>
            ) : logs.map((log) => (
              <div key={log.id} className={`p-4 rounded-2xl flex justify-between items-center border animate-fade-in ${log.type === 'Direção' ? 'bg-blue-50 border-blue-100' : 'bg-emerald-50 border-emerald-100'}`}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase">{log.type}</p>
                    <span className="text-[10px] text-slate-300 font-bold">{log.date}</span>
                  </div>
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
              <li className="flex gap-3 mt-4 text-[10px] uppercase opacity-60">Siga as leis de trânsito para sua segurança.</li>
           </ul>
        </div>
      </div>
    </div>
  );
};
