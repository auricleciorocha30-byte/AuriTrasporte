
import React, { useState, useEffect } from 'react';
import { Timer, Coffee, Play, Square, History, AlertCircle } from 'lucide-react';

export const JornadaManager: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [time, setTime] = useState(0); // Segundos
  const [logs, setLogs] = useState<{start: string, end?: string, duration: number}[]>([]);

  useEffect(() => {
    let interval: any;
    if (isActive) {
      interval = setInterval(() => setTime(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (s: number) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    if (isActive) {
      setLogs([{ start: new Date(Date.now() - time*1000).toLocaleTimeString(), end: new Date().toLocaleTimeString(), duration: time }, ...logs]);
      setTime(0);
    }
    setIsActive(!isActive);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="bg-slate-900 rounded-[3rem] p-10 text-center text-white shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full -mr-32 -mt-32"></div>
        <Timer size={48} className="text-primary-400 mx-auto mb-6" />
        <h2 className="text-3xl font-black mb-2">Controle de Jornada</h2>
        <p className="text-slate-400 text-sm mb-10">Gerencie seu tempo de direção e descanso para sua segurança.</p>
        
        <div className="text-6xl md:text-8xl font-black font-mono mb-12 tracking-tighter">
          {formatTime(time)}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <button onClick={toggleTimer} className={`w-full md:w-64 py-5 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 transition-all ${isActive ? 'bg-rose-500 hover:bg-rose-600' : 'bg-primary-600 hover:bg-primary-700'}`}>
            {isActive ? <><Square size={24}/> Encerrar</> : <><Play size={24}/> Iniciar Direção</>}
          </button>
          <button className="w-full md:w-64 py-5 bg-slate-800 hover:bg-slate-700 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 transition-all">
            <Coffee size={24}/> Registrar Descanso
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
          <h3 className="text-xl font-black mb-6 flex items-center gap-3"><History/> Histórico de Hoje</h3>
          <div className="space-y-4">
            {logs.length === 0 ? (
              <p className="text-slate-400 text-sm py-4">Nenhum registro hoje.</p>
            ) : logs.map((log, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Período</p>
                  <p className="font-bold text-slate-700">{log.start} - {log.end}</p>
                </div>
                <div className="text-right">
                   <p className="text-xs font-bold text-slate-400 uppercase">Duração</p>
                   <p className="font-black text-primary-600">{formatTime(log.duration)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-amber-50 p-8 rounded-[2.5rem] border border-amber-100">
           <h3 className="text-xl font-black text-amber-900 mb-6 flex items-center gap-3"><AlertCircle/> Lembretes</h3>
           <ul className="space-y-4 text-amber-800 text-sm font-bold">
              <li className="flex gap-3">✅ Não dirija mais de 5h30 sem descanso.</li>
              <li className="flex gap-3">✅ Descanso obrigatório de 30 minutos a cada período.</li>
              <li className="flex gap-3">✅ O descanso diário deve ser de no mínimo 11h.</li>
           </ul>
        </div>
      </div>
    </div>
  );
};
