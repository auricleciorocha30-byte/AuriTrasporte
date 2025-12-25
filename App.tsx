
// @google/genai guidelines followed: exclusively using process.env.API_KEY, correct model names, and response.text usage.
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Truck, Wallet, Calculator, Menu, X, LogOut, Bell, Search, Database, CheckSquare, Settings, Lock, User as UserIcon, Loader2, AlertCircle, Timer, Fuel, Sparkles, Printer, Share2 } from 'lucide-react';
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
        alerts.push({ id: nid, title: 'Próxima Viagem', msg: `Viagem para ${t.destination} marcada para amanhã!`, type: 'info' });
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
        alerts.push({ id: timeNid, title: 'Garantia', msg: `Garantia de "${m.part_name}" no ${vehicle?.plate} venceu por tempo!`, type: 'warning' });
      } else if (isKmExpired && !dismissedIds.includes(kmNid)) {
        alerts.push({ id: kmNid, title: 'Garantia', msg: `Garantia de "${m.part_name}" no ${vehicle?.plate} venceu por KM!`, type: 'warning' });
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

  const handleAddVehicle = async (vehData: any) => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('vehicles').insert([{...vehData, user_id: session.user.id}]);
      if (error) throw error;
      fetchData();
    } catch (err: any) { alert(err.message); }
    finally { setIsSaving(false); }
  };

  const handleUpdateVehicle = async (id: string, vehData: any) => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('vehicles').update(vehData).eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err: any) { alert(err.message); }
    finally { setIsSaving(false); }
  };

  const handleUpdateTrip = async (id: string, tripData: any) => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('trips').update(tripData).eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (err: any) {
      alert("Erro ao atualizar: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: TripStatus, newVehicleKm?: number) => {
    setIsSaving(true);
    try {
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      
      if (tripError) throw tripError;

      if (status === TripStatus.COMPLETED && newVehicleKm !== undefined && tripData.vehicle_id) {
        const { error: vehError } = await supabase
          .from('vehicles')
          .update({ current_km: newVehicleKm })
          .eq('id', tripData.vehicle_id);
        
        if (vehError) throw vehError;
      }

      await fetchData();
    } catch (err: any) {
      alert("Erro ao atualizar status: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareOrPrint = async () => {
    if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title: 'AuriLog - Relatório de Gestão',
          text: 'Confira os dados de fretes e despesas do AuriLog.',
          url: window.location.href
        });
      } catch (err) {
        window.print();
      }
    } else {
      window.print();
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 animate-fade-in">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="inline-flex p-5 bg-primary-600 rounded-[2rem] shadow-2xl mb-6">
              <Truck size={56} className="text-white" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">AuriLog</h1>
            <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest text-[10px]">Gestão Inteligente de Fretes</p>
          </div>
          
          <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl border border-white/10">
            <h2 className="text-2xl font-black text-slate-800 mb-8">
              {isSignUp ? 'Criar nova conta' : 'Entrar na plataforma'}
            </h2>
            
            <form onSubmit={handleAuth} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Seu E-mail</label>
                <input 
                  type="email" 
                  placeholder="exemplo@email.com" 
                  className="w-full p-4 rounded-2xl border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-slate-50 focus:bg-white" 
                  value={email} 
                  /* Fixed onChange handler to correctly update state */
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Sua Senha</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="w-full p-4 rounded-2xl border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-slate-50 focus:bg-white" 
                  value={password} 
                  /* Fixed onChange handler to correctly update state */
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
              </div>

              {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600">
                  <AlertCircle size={18} />
                  <p className="text-xs font-bold">{error}</p>
                </div>
              )}

              <button 
                disabled={authLoading} 
                className="w-full py-5 bg-primary-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-primary-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {authLoading ? <Loader2 className="animate-spin" /> : (isSignUp ? 'Criar Conta' : 'Acessar Painel')}
              </button>
            </form>

            <button 
              onClick={() => { setIsSignUp(!isSignUp); setError(''); }} 
              className="mt-8 w-full text-slate-400 font-bold text-sm hover:text-primary-600 transition-colors"
            >
              {isSignUp ? 'Já tem uma conta? Entre agora' : 'Não tem conta? Cadastre-se gratuitamente'}
            </button>
          </div>

          <p className="text-center mt-10 text-slate-500 text-[10px] font-bold uppercase tracking-widest opacity-50">
            AuriLog &copy; 2024 - Sistema Profissional
          </p>
        </div>
      </div>
    );
  }

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
        <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-240px)]">
          <MenuBtn icon={LayoutDashboard} label="Dashboard" active={currentView === AppView.DASHBOARD} onClick={() => setCurrentView(AppView.DASHBOARD)} />
          <MenuBtn icon={Truck} label="Viagens" active={currentView === AppView.TRIPS} onClick={() => setCurrentView(AppView.TRIPS)} />
          <MenuBtn icon={Settings} label="Veículos" active={currentView === AppView.VEHICLES} onClick={() => setCurrentView(AppView.VEHICLES)} />
          <MenuBtn icon={CheckSquare} label="Manutenções" active={currentView === AppView.MAINTENANCE} onClick={() => setCurrentView(AppView.MAINTENANCE)} />
          <MenuBtn icon={Wallet} label="Despesas" active={currentView === AppView.EXPENSES} onClick={() => setCurrentView(AppView.EXPENSES)} />
          <div className="h-px bg-slate-800 my-4"></div>
          <MenuBtn icon={Calculator} label="Frete ANTT" active={currentView === AppView.CALCULATOR} onClick={() => setCurrentView(AppView.CALCULATOR)} />
          <MenuBtn icon={Timer} label="Jornada" active={currentView === AppView.JORNADA} onClick={() => setCurrentView(AppView.JORNADA)} />
          <MenuBtn icon={Fuel} label="Postos Próximos" active={currentView === AppView.STATIONS} onClick={() => setCurrentView(AppView.STATIONS)} />
        </nav>
        
        <div className="absolute bottom-6 left-4 right-4 space-y-2">
          <button 
            onClick={handleShareOrPrint} 
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary-600/10 text-primary-400 hover:bg-primary-600/20 transition-all font-bold text-sm border border-primary-900/50"
          >
            <Share2 size={18} /> <span>Imprimir / Compartilhar</span>
          </button>
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-all font-bold text-sm"
          >
            <LogOut size={18} /> <span>Sair</span>
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
            <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative">
              <Bell size={22} />
              {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Loader2 className="animate-spin text-primary-600" size={48} />
              <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Carregando seus dados...</p>
            </div>
          ) : (
            <>
              {currentView === AppView.DASHBOARD && <Dashboard trips={trips} expenses={expenses} />}
              {currentView === AppView.TRIPS && (
                <TripManager 
                  trips={trips} 
                  vehicles={vehicles} 
                  onAddTrip={async (t) => { await supabase.from('trips').insert([{...t, user_id: session.user.id}]); fetchData(); }} 
                  onUpdateTrip={handleUpdateTrip}
                  onUpdateStatus={handleUpdateStatus}
                  onDeleteTrip={async (id) => { if(confirm("Excluir?")) {await supabase.from('trips').delete().eq('id', id); fetchData();} }} 
                  isSaving={isSaving}
                />
              )}
              {currentView === AppView.VEHICLES && (
                <VehicleManager 
                  vehicles={vehicles} 
                  onAddVehicle={handleAddVehicle} 
                  onUpdateVehicle={handleUpdateVehicle}
                  onDeleteVehicle={async (id) => { if(confirm("Excluir?")) {await supabase.from('vehicles').delete().eq('id', id); fetchData();} }}
                  isSaving={isSaving}
                />
              )}
              {currentView === AppView.MAINTENANCE && <MaintenanceManager maintenance={maintenance} vehicles={vehicles} onAddMaintenance={async (m) => {await supabase.from('maintenance').insert([{...m, user_id: session.user.id}]); fetchData();}} onDeleteMaintenance={async (id) => {await supabase.from('maintenance').delete().eq('id', id); fetchData();}} />}
              {currentView === AppView.EXPENSES && (
                <ExpenseManager 
                  expenses={expenses} 
                  trips={trips} 
                  onAddExpense={async (e) => { await supabase.from('expenses').insert([{...e, user_id: session.user.id}]); fetchData(); }} 
                  onDeleteExpense={async (id) => {await supabase.from('expenses').delete().eq('id', id); fetchData();}} 
                />
              )}
              {currentView === AppView.CALCULATOR && <FreightCalculator />}
              {currentView === AppView.JORNADA && (
                <JornadaManager 
                  mode={jornadaMode} 
                  startTime={jornadaStartTime} 
                  logs={jornadaLogs}
                  setMode={setJornadaMode}
                  setStartTime={setJornadaStartTime}
                  /* Fixed line 408: setLogs should use setJornadaLogs */
                  setLogs={setJornadaLogs}
                />
              )}
              {currentView === AppView.STATIONS && <StationLocator />}
              {currentView === AppView.BACKUP && <BackupManager data={{ trips, expenses, vehicles, maintenance }} onRestored={fetchData} />}
            </>
          )}
        </div>
      </main>
      {isMobileMenuOpen && <div className="fixed inset-0 bg-slate-900/60 z-30 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />}
    </div>
  );
};

const MenuBtn = ({ icon: Icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${active ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
    <Icon size={20} /> <span className="font-bold text-sm">{label}</span>
  </button>
);

export default App;
