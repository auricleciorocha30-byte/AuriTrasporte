
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Truck, Wallet, Calculator, Menu, X, LogOut, Bell, Search, Database, CheckSquare, Settings, Lock, User as UserIcon, Loader2, AlertCircle, Timer, Fuel } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { TripManager } from './components/TripManager';
import { ExpenseManager } from './components/ExpenseManager';
import { FreightCalculator } from './components/FreightCalculator';
import { VehicleManager } from './components/VehicleManager';
import { MaintenanceManager } from './components/MaintenanceManager';
import { BackupManager } from './components/BackupManager';
import { JornadaManager } from './components/JornadaManager';
import { StationLocator } from './components/StationLocator';
import { AppView, Trip, Expense, Vehicle, MaintenanceItem, TripStatus } from './types';
import { supabase } from './lib/supabase';

interface AppNotification {
  id: string;
  title: string;
  msg: string;
  type: 'warning' | 'info';
}

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');

  const [trips, setTrips] = useState<Trip[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceItem[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Estado Global da Jornada para continuidade entre telas
  const [jornadaMode, setJornadaMode] = useState<'IDLE' | 'DRIVING' | 'RESTING'>(() => {
    return (localStorage.getItem('aurilog_jornada_mode') as any) || 'IDLE';
  });
  const [jornadaStartTime, setJornadaStartTime] = useState<number | null>(() => {
    const saved = localStorage.getItem('aurilog_jornada_start');
    return saved ? Number(saved) : null;
  });
  const [jornadaLogs, setJornadaLogs] = useState<any[]>(() => {
    const saved = localStorage.getItem('aurilog_jornada_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('aurilog_dismissed_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) fetchData();
  }, [session]);

  // Persistência da Jornada
  useEffect(() => {
    localStorage.setItem('aurilog_jornada_mode', jornadaMode);
    localStorage.setItem('aurilog_jornada_logs', JSON.stringify(jornadaLogs));
    if (jornadaStartTime) {
      localStorage.setItem('aurilog_jornada_start', jornadaStartTime.toString());
    } else {
      localStorage.removeItem('aurilog_jornada_start');
    }
  }, [jornadaMode, jornadaStartTime, jornadaLogs]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      setSession(null);
      window.location.href = window.location.origin;
    } catch (err) {
      console.error(err);
      window.location.reload();
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tripsRes, expRes, vehRes, mainRes] = await Promise.all([
        supabase.from('trips').select('*').order('date', { ascending: false }),
        supabase.from('expenses').select('*').order('date', { ascending: false }),
        supabase.from('vehicles').select('*').order('plate', { ascending: true }),
        supabase.from('maintenance').select('*').order('purchase_date', { ascending: false })
      ]);
      
      setTrips(tripsRes.data || []);
      setExpenses(expRes.data || []);
      setVehicles(vehRes.data || []);
      setMaintenance(mainRes.data || []);
      
      checkNotifications(tripsRes.data || [], mainRes.data || [], vehRes.data || []);
    } catch (err: any) { 
      console.error("Erro ao carregar dados:", err.message);
    }
    finally { setLoading(false); }
  };

  const checkNotifications = (currentTrips: Trip[], currentMain: MaintenanceItem[], currentVehicles: Vehicle[]) => {
    const alerts: AppNotification[] = [];
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    currentTrips.forEach(t => {
      const nid = `trip-${t.id}-${t.date}`;
      if (t.status === TripStatus.SCHEDULED && t.date === tomorrowStr && !dismissedIds.includes(nid)) {
        alerts.push({ id: nid, title: 'Próxima Viagem', msg: `Viagem marcada para amanhã para ${t.destination}!`, type: 'info' });
      }
    });

    currentMain.forEach(m => {
      const pDate = new Date(m.purchase_date);
      const expiryDate = new Date(pDate.setMonth(pDate.getMonth() + m.warranty_months));
      const vehicle = currentVehicles.find(v => v.id === m.vehicle_id);
      const isKmExpired = vehicle && m.warranty_km > 0 && vehicle.current_km > (m.km_at_purchase + m.warranty_km);

      const timeNid = `main-time-${m.id}`;
      const kmNid = `main-km-${m.id}`;

      if (expiryDate < new Date() && !dismissedIds.includes(timeNid)) {
        alerts.push({ id: timeNid, title: 'Garantia Vencida (Tempo)', msg: `A garantia de "${m.part_name}" no ${vehicle?.plate} expirou!`, type: 'warning' });
      } else if (isKmExpired && !dismissedIds.includes(kmNid)) {
        alerts.push({ id: kmNid, title: 'Garantia Vencida (KM)', msg: `Garantia de "${m.part_name}" no ${vehicle?.plate} excedeu KM!`, type: 'warning' });
      }
    });

    setNotifications(alerts);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError('');
    try {
      let res;
      if (isSignUp) {
        res = await supabase.auth.signUp({ email, password });
      } else {
        res = await supabase.auth.signInWithPassword({ email, password });
      }
      if (res.error) throw res.error;
    } catch (err: any) { 
      setError(err.message); 
    }
    finally { setAuthLoading(false); }
  };

  const handleViewChange = (view: AppView) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <aside className={`fixed md:relative z-40 w-64 h-full bg-slate-900 text-slate-300 p-4 transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex items-center justify-between mb-10 px-2">
          <div className="flex items-center gap-2">
            <Truck className="text-primary-500" size={28} />
            <span className="text-xl font-bold text-white tracking-tighter uppercase">AuriLog</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-1 text-slate-500"><X size={20} /></button>
        </div>
        <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
          <MenuBtn icon={LayoutDashboard} label="Dashboard" active={currentView === AppView.DASHBOARD} onClick={() => handleViewChange(AppView.DASHBOARD)} />
          <MenuBtn icon={Truck} label="Viagens" active={currentView === AppView.TRIPS} onClick={() => handleViewChange(AppView.TRIPS)} />
          <MenuBtn icon={Settings} label="Veículos" active={currentView === AppView.VEHICLES} onClick={() => handleViewChange(AppView.VEHICLES)} />
          <MenuBtn icon={CheckSquare} label="Manutenções" active={currentView === AppView.MAINTENANCE} onClick={() => handleViewChange(AppView.MAINTENANCE)} />
          <MenuBtn icon={Wallet} label="Despesas" active={currentView === AppView.EXPENSES} onClick={() => handleViewChange(AppView.EXPENSES)} />
          <div className="h-px bg-slate-800 my-4"></div>
          <MenuBtn icon={Calculator} label="Frete ANTT" active={currentView === AppView.CALCULATOR} onClick={() => handleViewChange(AppView.CALCULATOR)} />
          <MenuBtn icon={Timer} label="Jornada" active={currentView === AppView.JORNADA} onClick={() => handleViewChange(AppView.JORNADA)} />
          <MenuBtn icon={Fuel} label="Postos Próximos" active={currentView === AppView.STATIONS} onClick={() => handleViewChange(AppView.STATIONS)} />
          <div className="h-px bg-slate-800 my-4"></div>
          <MenuBtn icon={Database} label="Backup & Restaurar" active={currentView === AppView.BACKUP} onClick={() => handleViewChange(AppView.BACKUP)} />
        </nav>
        <div className="absolute bottom-6 left-4 right-4">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-all font-bold">
            <LogOut size={20} /> <span>Sair</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0 z-10">
          <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-slate-600"><Menu size={24} /></button>
          <div className="hidden md:block relative w-64 lg:w-96">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input type="text" placeholder="Pesquisar..." className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-full focus:ring-2 focus:ring-primary-500 text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative transition-colors">
                <Bell size={22} />
                {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white shadow-2xl rounded-2xl border border-slate-100 p-4 z-50 animate-fade-in">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-slate-900 text-lg">Notificações</h4>
                    <button onClick={() => setShowNotifications(false)} className="text-slate-400"><X size={18}/></button>
                  </div>
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-center py-8 text-sm text-slate-400">Sem notificações.</p>
                    ) : notifications.map((n) => (
                      <div key={n.id} className={`p-4 rounded-2xl border ${n.type === 'warning' ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'}`}>
                        <p className="text-lg font-black leading-tight">{n.msg}</p>
                        <button onClick={() => {setDismissedIds(p => [...p, n.id]); setNotifications(p => p.filter(x => x.id !== n.id))}} className="mt-2 text-xs font-bold text-slate-500 underline">Apagar</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
          {!session ? (
            <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
               <div className="bg-white p-8 rounded-[3rem] shadow-xl w-full max-w-md border border-slate-100">
                  <div className="flex justify-center mb-6">
                    <Truck className="text-primary-600" size={48} />
                  </div>
                  <h1 className="text-2xl font-black mb-2 text-center">Bem-vindo ao AuriLog</h1>
                  <p className="text-slate-500 text-center mb-8 font-medium">Faça login para gerenciar sua frota.</p>
                  
                  <form onSubmit={handleAuth} className="space-y-4">
                      <input type="email" placeholder="E-mail" className="w-full p-4 rounded-2xl border border-slate-200 font-bold focus:ring-2 focus:ring-primary-500 outline-none" value={email} onChange={e => setEmail(e.target.value)} required />
                      <input type="password" placeholder="Senha" className="w-full p-4 rounded-2xl border border-slate-200 font-bold focus:ring-2 focus:ring-primary-500 outline-none" value={password} onChange={e => setPassword(e.target.value)} required />
                      
                      {error && <p className="text-rose-500 text-sm font-bold text-center px-2">{error}</p>}
                      
                      <button disabled={authLoading} className="w-full p-4 bg-primary-600 text-white rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                        {authLoading ? <Loader2 className="animate-spin" /> : (isSignUp ? 'Criar Conta' : 'Entrar na Conta')}
                      </button>
                  </form>
                  <button onClick={() => setIsSignUp(!isSignUp)} className="mt-6 w-full text-primary-600 font-bold text-sm">
                    {isSignUp ? 'Já tem uma conta? Entre agora' : 'Não tem conta? Cadastre-se grátis'}
                  </button>
               </div>
            </div>
          ) : (
            <>
              {currentView === AppView.DASHBOARD && <Dashboard trips={trips} expenses={expenses} />}
              {currentView === AppView.TRIPS && <TripManager trips={trips.filter(t => t.origin.includes(searchTerm) || t.destination.includes(searchTerm))} vehicles={vehicles} onAddTrip={async (t) => {await supabase.from('trips').insert([{...t, user_id: session.user.id}]); fetchData();}} onUpdateStatus={async (id, status) => {await supabase.from('trips').update({status}).eq('id', id); fetchData();}} onDeleteTrip={async (id) => {await supabase.from('trips').delete().eq('id', id); fetchData();}} />}
              {currentView === AppView.VEHICLES && <VehicleManager vehicles={vehicles} onAddVehicle={async (v) => {await supabase.from('vehicles').insert([{...v, user_id: session.user.id}]); fetchData();}} onDeleteVehicle={async (id) => {await supabase.from('vehicles').delete().eq('id', id); fetchData();}} />}
              {currentView === AppView.MAINTENANCE && <MaintenanceManager maintenance={maintenance} vehicles={vehicles} onAddMaintenance={async (m) => {await supabase.from('maintenance').insert([{...m, user_id: session.user.id}]); fetchData();}} onDeleteMaintenance={async (id) => {await supabase.from('maintenance').delete().eq('id', id); fetchData();}} />}
              {currentView === AppView.EXPENSES && <ExpenseManager expenses={expenses} trips={trips} onAddExpense={async (e) => {await supabase.from('expenses').insert([{...e, user_id: session.user.id}]); fetchData();}} onDeleteExpense={async (id) => {await supabase.from('expenses').delete().eq('id', id); fetchData();}} />}
              {currentView === AppView.CALCULATOR && <FreightCalculator />}
              {currentView === AppView.JORNADA && (
                <JornadaManager 
                  mode={jornadaMode} 
                  startTime={jornadaStartTime} 
                  logs={jornadaLogs}
                  setMode={setJornadaMode}
                  setStartTime={setJornadaStartTime}
                  setLogs={setJornadaLogs}
                />
              )}
              {currentView === AppView.STATIONS && <StationLocator />}
              {currentView === AppView.BACKUP && <BackupManager data={{ trips, expenses, vehicles, maintenance }} onRestored={fetchData} />}
            </>
          )}
        </div>
      </main>
      {isMobileMenuOpen && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />}
    </div>
  );
};

const MenuBtn = ({ icon: Icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${active ? 'bg-primary-600 text-white shadow-lg scale-105 z-10' : 'text-slate-400 hover:bg-slate-800'}`}>
    <Icon size={20} /> <span className="font-bold text-sm">{label}</span>
  </button>
);

export default App;
