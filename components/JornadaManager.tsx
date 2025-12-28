
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Timer, Coffee, Play, Square, History, AlertCircle, BellRing, Trash2, Clock, CheckCircle, Activity, Loader2, CalendarDays, ArrowRight } from 'lucide-react';
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
  addGlobalNotification: (title: string, msg: string, type?: 'warning' | 'info') => void;
  isSaving?: boolean;
}

export const JornadaManager: React.FC<JornadaManagerProps> = ({ mode, startTime, logs, setMode, setStartTime, onSaveLog, onDeleteLog, addGlobalNotification, isSaving }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [alert, setAlert] = useState<string | null>(null);
  
  const drivingAlertFired = useRef(false);
  const restAlertFired = useRef(false);

  // Função para pegar a data local em formato YYYY-MM-DD
  const getLocalDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const formatTime = (s: number) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatClockTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Memoizar apenas logs salvos para não re-renderizar a lista inteira a cada segundo
  const savedLogs = useMemo(() => {
    const todayStr = getLocalDateStr();
    return [...logs]
      .filter(l => (l.date || l.start_time?.split('T')[0]) === todayStr)
      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
  }, [logs]);

  useEffect(() => {
    let interval: any;
    if (mode !== 'IDLE' && startTime) {
      const updateTime = () => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        setCurrentTime(elapsed > 0 ? elapsed : 0);
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
      const msg = "⚠️ LIMITE DE 5h30 ATINGIDO!";
      setAlert(msg);
      if (!drivingAlertFired.current) {
        addGlobalNotification("Alerta de Direção", msg, "warning");
        drivingAlertFired.current = true;
      }
    } 
    else if (mode === 'RESTING' && currentTime >= LIMIT_REST) {
      const msg = "✅ DESCANSO CONCLUÍDO!";
      setAlert(msg);
      if (!restAlertFired.current) {
        addGlobalNotification("Descanso Concluído", msg, "info");
        restAlertFired.current = true;
      }
    } else {
      setAlert(null);
    }
  }, [currentTime, mode]);

  const handleAction = async (newMode: 'IDLE' | 'DRIVING' | 'RESTING') => {
    // 1. Fechar a seção anterior se existir
    if (mode !== 'IDLE' && startTime) {
      const now = Date.now();
      const duration = Math.floor((now - startTime) / 1000);
      
      if (duration >= 1) {
        const newLog: Omit<JornadaLog, 'id' | 'user_id'> = { 
          start_time: new Date(startTime).toISOString(), 
          end_time: new Date(now).toISOString(), 
          duration_seconds: duration,
          type: mode === 'DRIVING' ? 'Direção' : 'Descanso',
          date: getLocalDateStr()
        };
        await onSaveLog(newLog);
      }
    }

    // 2. Iniciar nova seção ou parar
    if (newMode === 'IDLE') {
      setStartTime(null);
      setMode('IDLE');
    } else {
      const now = Date.now();
      setStartTime(now);
      setMode(newMode);
      drivingAlertFired.current = false;
      restAlertFired.current = false;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-fade-in">
      {/* Painel de Controle Principal */}
      <div className={`rounded-[4rem] p-10 md:p-16 text-center text-white shadow-2xl transition-all duration-700 relative overflow-hidden flex flex-col items-center justify-center min-h-[550px] ${mode === 'DRIVING' ? 'bg-primary-950' : mode === 'RESTING' ? 'bg-emerald-950' : 'bg-slate-900'}`}>
        
        {/* Camada de Decoração de Fundo */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
           <div className={`absolute -top-24 -left-24 w-96 h-96 rounded-full blur-[120px] ${mode === 'DRIVING' ? 'bg-blue-400' : mode === 'RESTING' ? 'bg-emerald-400' : 'bg-slate-400'}`}></div>
           <div className={`absolute -bottom-24 -right-24 w-96 h-96 rounded-full blur-[120px] ${mode === 'DRIVING' ? 'bg-indigo-400' : mode === 'RESTING' ? 'bg-teal-400' : 'bg-slate-400'}`}></div>
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className={`px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-[0.25em] border-2 flex items-center gap-3 mb-12 ${mode === 'DRIVING' ? 'bg-primary-500/20 border-primary-500/50 text-primary-300' : mode === 'RESTING' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-white/5 border-white/10 text-slate-500'}`}>
            <Activity size={16} className={mode !== 'IDLE' ? 'animate-spin' : ''} />
            {mode === 'DRIVING' ? 'Operação em Curso: Direção' : mode === 'RESTING' ? 'Operação em Curso: Descanso' : 'Aguardando Início de Jornada'}
          </div>

          {mode !== 'IDLE' && startTime && (
            <div className="mb-6 flex items-center gap-2 text-white/40 font-bold uppercase text-[10px] tracking-widest">
              <Clock size={12}/> Iniciado às {new Date(startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
            </div>
          )}

          <div className="text-8xl md:text-[10rem] font-black font-mono tracking-tighter select-none tabular-nums leading-none mb-12 flex items-baseline gap-2">
            {formatTime(currentTime)}
          </div>

          {alert && (
            <div className="mb-12 bg-white/10 backdrop-blur-xl border border-white/20 px-8 py-4 rounded-[2rem] flex items-center gap-4 text-white animate-bounce shadow-2xl">
              <div className={`p-2 rounded-full ${mode === 'DRIVING' ? 'bg-rose-500' : 'bg-emerald-500'}`}>
                 <BellRing size={24} />
              </div>
              <p className="font-black text-sm uppercase tracking-tight">{alert}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl px-4">
            <button 
              disabled={isSaving || mode === 'DRIVING'} 
              onClick={() => handleAction('DRIVING')} 
              className={`py-6 rounded-[2.5rem] font-black text-xl flex items-center justify-center gap-4 shadow-xl transition-all active:scale-95 ${mode === 'DRIVING' ? 'bg-primary-800/40 text-primary-400 border-2 border-primary-500/20 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-500 text-white'}`}
            >
              {mode === 'DRIVING' ? <CheckCircle size={28}/> : <Play size={28}/>} 
              Direção
            </button>

            <button 
              disabled={isSaving || mode === 'RESTING'} 
              onClick={() => handleAction('RESTING')} 
              className={`py-6 rounded-[2.5rem] font-black text-xl flex items-center justify-center gap-4 shadow-xl transition-all active:scale-95 ${mode === 'RESTING' ? 'bg-emerald-800/40 text-emerald-400 border-2 border-emerald-500/20 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
            >
              {mode === 'RESTING' ? <CheckCircle size={28}/> : <Coffee size={28}/>} 
              Descanso
            </button>
            
            <button 
              disabled={isSaving || mode === 'IDLE'} 
              onClick={() => handleAction('IDLE')} 
              className={`py-6 rounded-[2.5rem] font-black text-xl flex items-center justify-center gap-4 shadow-xl transition-all active:scale-95 ${mode === 'IDLE' ? 'bg-slate-800 text-slate-700 cursor-not-allowed opacity-20' : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40'}`}
            >
              {isSaving ? <Loader2 className="animate-spin" size={28} /> : <Square size={28}/>} 
              Finalizar
            </button>
          </div>
        </div>
      </div>

      {/* Histórico e Resumo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4">
        {/* Histórico Detalhado */}
        <div className="lg:col-span-8 bg-white p-10 rounded-[3.5rem] border shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-2xl font-black flex items-center gap-4 uppercase tracking-tighter">
                <History className="text-primary-600"/> Histórico de Hoje
              </h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                <CalendarDays size={12}/> {getLocalDateStr().split('-').reverse().join('/')}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{savedLogs.length} seções registradas</span>
            </div>
          </div>
          
          <div className="space-y-6 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
            {savedLogs.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-100">
                <Clock className="mx-auto text-slate-200 mb-4" size={64} />
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Nenhuma seção finalizada hoje.</p>
              </div>
            ) : savedLogs.map((log) => (
              <div 
                key={log.id} 
                className={`group p-6 rounded-[2rem] flex justify-between items-center border-2 transition-all hover:border-slate-300 ${
                  log.type === 'Direção' ? 'bg-blue-50/30 border-blue-50' : 'bg-emerald-50/30 border-emerald-50'
                }`}
              >
                <div className="flex gap-6 items-center">
                  <div className={`p-4 rounded-2xl ${log.type === 'Direção' ? 'bg-primary-100 text-primary-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {log.type === 'Direção' ? <Activity size={24}/> : <Coffee size={24}/>}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`text-[11px] font-black uppercase tracking-widest ${log.type === 'Direção' ? 'text-primary-600' : 'text-emerald-600'}`}>
                        {log.type}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-lg font-black text-slate-800">
                      <span>{formatClockTime(log.start_time)}</span>
                      <ArrowRight size={14} className="text-slate-300" />
                      <span>{log.end_time ? formatClockTime(log.end_time) : '---'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Duração</p>
                    <p className="font-black text-slate-900 text-xl">{formatTime(log.duration_seconds)}</p>
                  </div>
                  <button 
                    onClick={() => { if(confirm("Remover este registro?")) onDeleteLog(log.id) }} 
                    className="p-3 bg-white shadow-sm rounded-full text-slate-200 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={20}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card Informativo Legal */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white">
             <h3 className="text-xl font-black mb-8 flex items-center gap-3 uppercase tracking-tighter">
               <AlertCircle className="text-amber-500"/> Regras de Ouro
             </h3>
             <div className="space-y-6">
                <div className="flex gap-4">
                   <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-black shrink-0">1</div>
                   <p className="text-slate-400 text-sm font-bold">Direção contínua não deve exceder <span className="text-white">5h 30min</span>.</p>
                </div>
                <div className="flex gap-4">
                   <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-black shrink-0">2</div>
                   <p className="text-slate-400 text-sm font-bold">Descanso obrigatório de <span className="text-white">30 minutos</span> após limite.</p>
                </div>
                <div className="flex gap-4">
                   <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-black shrink-0">3</div>
                   <p className="text-slate-400 text-sm font-bold">Total de <span className="text-white">11 horas</span> de descanso por dia.</p>
                </div>
             </div>
             
             <div className="mt-12 p-6 bg-white/5 rounded-3xl border border-white/5">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Dica de Operação</p>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  O AuriLog registra automaticamente o início e o fim quando você altera o status ou finaliza a jornada. Registros de 1 segundo são ignorados.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
