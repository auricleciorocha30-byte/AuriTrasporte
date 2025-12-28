
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Timer, Coffee, Play, Square, History, AlertCircle, BellRing, Trash2, Clock, CheckCircle, Activity, Loader2 } from 'lucide-react';
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

  // Função utilitária para pegar a data local normalizada para YYYY-MM-DD
  const getLocalDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTime = (s: number) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Filtra logs de hoje e injeta a sessão ATIVA (Live) se houver
  const historyItems = useMemo(() => {
    const todayStr = getLocalDateStr();
    // Filtramos os logs que batem com a data de hoje (YYYY-MM-DD)
    const filtered = logs.filter(l => l.date === todayStr);
    
    // Se houver uma jornada ativa, cria um log "virtual" para exibição no topo
    if (mode !== 'IDLE' && startTime) {
      const activeLog: any = {
        id: 'active-session',
        is_live: true,
        type: mode === 'DRIVING' ? 'Direção' : 'Descanso',
        start_time: new Date(startTime).toISOString(),
        duration_seconds: currentTime,
        date: todayStr
      };
      return [activeLog, ...filtered];
    }
    
    return filtered;
  }, [logs, mode, startTime, currentTime]);

  // Efeito do cronômetro baseado na diferença absoluta de tempo
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

  // Gestão de Alertas de Tempo
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
    // Se está finalizando uma ação anterior, salva o log
    if (mode !== 'IDLE' && startTime) {
      const now = Date.now();
      const duration = Math.floor((now - startTime) / 1000);
      
      // Salva apenas se tiver pelo menos 2 segundos de atividade
      if (duration >= 2) {
        const newLog: Omit<JornadaLog, 'id' | 'user_id'> = { 
          start_time: new Date(startTime).toISOString(), 
          end_time: new Date(now).toISOString(), 
          duration_seconds: duration,
          type: mode === 'DRIVING' ? 'Direção' : 'Descanso',
          date: getLocalDateStr() // Garante data local
        };
        await onSaveLog(newLog);
      }
    }

    // Altera o modo e o tempo inicial
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
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-fade-in">
      {/* Painel Central do Cronômetro */}
      <div className={`rounded-[3rem] p-8 md:p-12 text-center text-white shadow-2xl transition-all duration-500 relative overflow-hidden flex flex-col items-center justify-center min-h-[500px] ${mode === 'DRIVING' ? 'bg-primary-900' : mode === 'RESTING' ? 'bg-emerald-900' : 'bg-slate-900'}`}>
        
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-10">
          <div className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border-2 animate-pulse flex items-center gap-2 ${mode === 'DRIVING' ? 'bg-blue-500/20 border-blue-400/50 text-blue-100' : mode === 'RESTING' ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-100' : 'bg-white/5 border-white/10 text-slate-400'}`}>
            {mode === 'DRIVING' ? <Play size={12} fill="currentColor" /> : mode === 'RESTING' ? <Coffee size={12}/> : <Timer size={12}/>}
            {mode === 'DRIVING' ? 'Ao Volante' : mode === 'RESTING' ? 'Em Descanso' : 'Jornada Parada'}
          </div>
        </div>

        {alert && (
          <div className="w-full max-w-[320px] mb-8 bg-white p-4 rounded-2xl flex items-center gap-3 text-slate-900 animate-bounce shadow-2xl z-20 mx-auto border-2 border-primary-500/20 mt-12">
            <div className={`p-2 rounded-full ${mode === 'DRIVING' ? 'bg-rose-100 text-rose-500' : 'bg-emerald-100 text-emerald-500'}`}>
               <BellRing size={20} />
            </div>
            <p className="font-black text-[12px] leading-tight flex-1 text-left">{alert}</p>
          </div>
        )}

        <div className={`relative mb-6 ${!alert ? 'mt-12' : ''}`}>
           <Timer size={48} className={`${mode === 'IDLE' ? 'text-slate-500' : 'text-primary-400'} ${mode !== 'IDLE' ? 'animate-pulse' : ''}`} />
        </div>
        
        <div className="text-7xl md:text-9xl font-black font-mono my-6 tracking-tighter select-none tabular-nums relative">
          {formatTime(currentTime)}
          {mode !== 'IDLE' && (
             <span className="absolute -top-4 -right-8 flex h-3 w-3">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
             </span>
          )}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4 w-full px-4 mt-8">
          {mode !== 'DRIVING' ? (
            <button disabled={isSaving} onClick={() => handleAction('DRIVING')} className="w-full md:w-64 py-5 bg-primary-600 hover:bg-primary-700 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 shadow-lg transition-all active:scale-95 disabled:opacity-50">
              {isSaving ? <Loader2 className="animate-spin" /> : <Play size={24}/>} 
              {isSaving ? 'Salvando...' : 'Iniciar Direção'}
            </button>
          ) : (
            <button disabled={isSaving} onClick={() => handleAction('IDLE')} className="w-full md:w-64 py-5 bg-rose-500 hover:bg-rose-600 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 shadow-lg transition-all active:scale-95 disabled:opacity-50">
              {isSaving ? <Loader2 className="animate-spin" /> : <Square size={24}/>} 
              {isSaving ? 'Salvando...' : 'Parar Direção'}
            </button>
          )}

          {mode !== 'RESTING' ? (
            <button disabled={isSaving} onClick={() => handleAction('RESTING')} className="w-full md:w-64 py-5 bg-slate-800 hover:bg-slate-700 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 shadow-lg transition-all active:scale-95 disabled:opacity-50">
              {isSaving ? <Loader2 className="animate-spin" /> : <Coffee size={24}/>} 
              {isSaving ? 'Salvando...' : 'Iniciar Descanso'}
            </button>
          ) : (
            <button disabled={isSaving} onClick={() => handleAction('IDLE')} className="w-full md:w-64 py-5 bg-emerald-600 hover:bg-emerald-700 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 shadow-lg transition-all active:scale-95 disabled:opacity-50">
              {isSaving ? <Loader2 className="animate-spin" /> : <Square size={24}/>} 
              {isSaving ? 'Salvando...' : 'Parar Descanso'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-2">
        {/* Histórico Consolidado */}
        <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black flex items-center gap-3 uppercase tracking-tighter">
              <History/> Histórico de Hoje
            </h3>
            {isSaving && <Loader2 className="animate-spin text-primary-500" size={16} />}
            {!isSaving && <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{historyItems.length} Eventos</span>}
          </div>
          
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {historyItems.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="mx-auto text-slate-100 mb-2" size={48} />
                <p className="text-slate-400 text-sm font-bold">Nenhum evento registrado hoje.</p>
                <p className="text-[10px] text-slate-300 uppercase mt-1">Inicie a jornada acima para começar</p>
              </div>
            ) : historyItems.map((log: any) => (
              <div 
                key={log.id} 
                className={`p-4 rounded-2xl flex justify-between items-center border transition-all ${
                  log.is_live 
                    ? 'bg-amber-50 border-amber-200 ring-4 ring-amber-100/50 animate-pulse' 
                    : log.type === 'Direção' 
                      ? 'bg-blue-50 border-blue-100' 
                      : 'bg-emerald-50 border-emerald-100'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`text-[10px] font-black uppercase ${log.is_live ? 'text-amber-600' : log.type === 'Direção' ? 'text-primary-600' : 'text-emerald-600'}`}>
                      {log.is_live ? 'AGORA: ' : ''}{log.type}
                    </p>
                    {log.is_live ? <Activity size={10} className="text-amber-500 animate-bounce" /> : <CheckCircle size={10} className="text-slate-300" />}
                  </div>
                  <p className="font-bold text-slate-700 text-sm">
                    {new Date(log.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                    <span className="mx-2 opacity-30">→</span>
                    {log.is_live ? 'Em curso' : new Date(log.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-black text-slate-900 text-sm">{formatTime(log.duration_seconds)}</p>
                  {!log.is_live && (
                    <button onClick={() => onDeleteLog(log.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                      <Trash2 size={16}/>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Informações Legais */}
        <div className="bg-amber-50 p-8 rounded-[2.5rem] border border-amber-100 h-fit">
           <h3 className="text-xl font-black text-amber-900 mb-6 flex items-center gap-3 uppercase tracking-tighter"><AlertCircle/> Guia Lei 13.103</h3>
           <ul className="space-y-4 text-amber-800 text-sm font-bold">
              <li className="flex gap-3">✅ Máximo 5h 30min de direção contínua sem parada.</li>
              <li className="flex gap-3">✅ Descanso obrigatório de 30 minutos após cada ciclo de direção.</li>
              <li className="flex gap-3">✅ Jornada diária requer pelo menos 11 horas de repouso total.</li>
              <li className="flex gap-3 mt-4 text-[10px] uppercase opacity-60">Seus dados são salvos localmente e na nuvem ao trocar os modos.</li>
           </ul>
        </div>
      </div>
    </div>
  );
};
