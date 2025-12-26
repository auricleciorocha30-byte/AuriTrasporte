
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Truck, Wallet, Calculator, Menu, X, LogOut, Bell, Settings, CheckSquare, Timer, Fuel, Loader2, Mail, Key, UserPlus, LogIn, AlertCircle, Share2 } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { TripManager } from './components/TripManager';
import { ExpenseManager } from './components/ExpenseManager';
import { FreightCalculator } from './components/FreightCalculator';
import { VehicleManager } from './components/VehicleManager';
import { MaintenanceManager } from './components/MaintenanceManager';
import { JornadaManager } from './components/JornadaManager';
import { StationLocator } from './components/StationLocator';
import { AppView, Trip, Expense, Vehicle, MaintenanceItem, TripStatus, JornadaLog, ExpenseCategory } from './types';
import { supabase } from './lib/supabase';

const sanitizeTripPayload = (payload: any) => {
  const allowedKeys = ['origin', 'destination', 'distance_km', 'agreed_price', 'driver_commission_percentage', 'driver_commission', 'cargo_type', 'date', 'status', 'notes', 'vehicle_id', 'user_id', 'stops'];
  return Object.keys(payload).filter(key => allowedKeys.includes(key)).reduce((obj: any, key) => { obj[key] = payload[key]; return obj; }, {});
};

const sanitizeExpensePayload = (payload: any) => {
  const allowedKeys = ['trip_id', 'vehicle_id', 'description', 'amount', 'category', 'date', 'due_date', 'user_id'];
  return Object.keys(payload).filter(key => allowedKeys.includes(key)).reduce((obj: any, key) => { obj[key] = payload[key] || null; return obj; }, {});
};

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
  
  // Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');

  // Data
  const [trips, setTrips] = useState<Trip[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceItem[]>([]);
  const [jornadaLogs, setJornadaLogs] = useState<JornadaLog[]>([]);
  
  // Notifications & Jornada
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('aurilog_dismissed_notifications');
    return saved ? JSON.parse(saved) : [];
  });
  const [jornadaMode, setJornadaMode] = useState<'IDLE' | 'DRIVING' | 'RESTING'>(() => {
    return (localStorage.getItem('aurilog_jornada_mode') as any) || 'IDLE';
  });
  const [jornadaStartTime, setJornadaStartTime] = useState<number | null>(() => {
    const saved = localStorage.getItem('aurilog_jornada_start');
    return saved ? Number(saved) : null;
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tripsRes, expRes, vehRes, mainRes, jornRes] = await Promise.all([
        supabase.from('trips').select('*').order('date', { ascending: false }),
        supabase.from('expenses').select('*').order('date', { ascending: false }),
        supabase.from('vehicles').select('*').order('plate', { ascending: true }),
        supabase.from('maintenance').select('*').order('purchase_date', { ascending: false }),
        supabase.from('jornada_logs').select('*').order('created_at', { ascending: false })
      ]);
      
      const tData = tripsRes.data || [];
      const eData = expRes.data || [];
      const vData = vehRes.data || [];
      const mData = mainRes.data || [];
      
      setTrips(tData);
      setExpenses(eData);
      setVehicles(vData);
      setMaintenance(mData);
      setJornadaLogs(jornRes.data || []);
      
      checkSystemNotifications(tData, mData, vData, eData);
    } finally { setLoading(false); }
  };

  const checkSystemNotifications = (currentTrips: Trip[], currentMain: MaintenanceItem[], currentVehicles: Vehicle[], currentExpenses: Expense[]) => {
    const alerts: AppNotification[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    // Viagens Hoje
    currentTrips.forEach(t => {
      if (t.status === TripStatus.SCHEDULED && t.date === todayStr && !dismissedIds.includes(`trip-${t.id}`)) {
        alerts.push({ id: `trip-${t.id}`, title: 'Viagem Hoje!', msg: `Destino: ${t.destination}`, type: 'warning' });
      }
    });

    // Manutenções
    currentMain.forEach(m => {
      const v = currentVehicles.find(veh => veh.id === m.vehicle_id);
      if (v && v.current_km >= (m.km_at_purchase + m.warranty_km) && !dismissedIds.includes(`main-${m.id}`)) {
        alerts.push({ id: `main-${m.id}`, title: 'Manutenção Vencida', msg: `${m.part_name} - ${v.plate}`, type: 'warning' });
      }
    });

    // Contas a Pagar (Notificar hoje e vencimentos nos próximos 7 dias)
    currentExpenses.forEach(e => {
      if (e.due_date) {
        const dueDate = new Date(e.due_date + 'T12:00:00');
        dueDate.setHours(0, 0, 0, 0);
        
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays <= 7 && !dismissedIds.includes(`exp-${e.id}`)) {
          const title = diffDays === 0 ? 'Conta Vence HOJE' : `Conta Vence em ${diffDays} dias`;
          alerts.push({ id: `exp-${e.id}`, title, msg: `${e.description} (R$ ${e.amount})`, type: 'warning' });
        }
      }
    });

    setNotifications(alerts);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAuthLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Verifique seu e-mail!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) { setError(err.message); } finally { setAuthLoading(false); }
  };

  const handleAddExpense = async (e: Omit<Expense, 'id'>) => {
    setIsSaving(true);
    try {
      const payload = sanitizeExpensePayload({...e, user_id: session.user.id});
      const { error } = await supabase.from('expenses').insert([payload]);
      if (error) throw error;
      fetchData();
    } catch (err: any) { alert(err.message); } finally { setIsSaving(false); }
  };

  const handleUpdateExpense = async (id: string, e: Partial<Expense>) => {
    setIsSaving(true);
    try {
      const payload = sanitizeExpensePayload(e);
      const { error } = await supabase.from('expenses').update(payload).eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err: any) { alert(err.message); } finally { setIsSaving(false); }
  };

  const setStartTimeWithStorage = (time: number | null) => {
    setJornadaStartTime(time);
    if (time) localStorage.setItem('aurilog_jornada_start', time.toString());
    else localStorage.removeItem('aurilog_jornada_start');
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-primary-600" size={48} /></div>;

  if (!session) return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary-600 p-4 rounded-3xl shadow-lg mb-4"><Truck size={40} className="text-white" /></div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">AuriLog</h1>
          <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest">{isSignUp ? 'Criar conta' : 'Gestão de Fretes'}</p>
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-4 text-slate-400" size={20} />
              <input required type="email" placeholder="seu@email.com" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-primary-500 transition-all" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Senha</label>
            <div className="relative">
              <Key className="absolute left-4 top-4 text-slate-400" size={20} />
              <input required type="password" placeholder="••••••••" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-primary-500 transition-all" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
          </div>
          {error && <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold"><AlertCircle size={16} /> {error}</div>}
          <button disabled={authLoading} type="submit" className="w-full py-5 bg-primary-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-primary-700 active:scale-95 transition-all flex items-center justify-center gap-2">
            {authLoading ? <Loader2 className="animate-spin" /> : isSignUp ? <UserPlus size={20} /> : <LogIn size={20} />}
            {isSignUp ? 'Cadastrar' : 'Entrar'}
          </button>
        </form>
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <button onClick={() => {setIsSignUp(!isSignUp); setError('');}} className="text-primary-600 font-black text-sm uppercase hover:underline">
            {isSignUp ? 'Já tem conta? Entrar' : 'Não tem conta? Cadastrar'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className={`fixed md:relative z-40 w-64 h-full bg-slate-900 text-slate-300 p-4 transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex items-center justify-between mb-10 px-2">
          <div className="flex items-center gap-2"><Truck className="text-primary-500" size={28} /><span className="text-xl font-bold text-white tracking-tighter uppercase">AuriLog</span></div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-1 text-slate-500"><X size={20} /></button>
        </div>
        <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-200px)]">
          <MenuBtn icon={LayoutDashboard} label="Dashboard" active={currentView === AppView.DASHBOARD} onClick={() => {setCurrentView(AppView.DASHBOARD); setIsMobileMenuOpen(false);}} />
          <MenuBtn icon={Truck} label="Viagens" active={currentView === AppView.TRIPS} onClick={() => {setCurrentView(AppView.TRIPS); setIsMobileMenuOpen(false);}} />
          <MenuBtn icon={Settings} label="Veículos" active={currentView === AppView.VEHICLES} onClick={() => {setCurrentView(AppView.VEHICLES); setIsMobileMenuOpen(false);}} />
          <MenuBtn icon={CheckSquare} label="Manutenções" active={currentView === AppView.MAINTENANCE} onClick={() => {setCurrentView(AppView.MAINTENANCE); setIsMobileMenuOpen(false);}} />
          <MenuBtn icon={Wallet} label="Financeiro" active={currentView === AppView.EXPENSES} onClick={() => {setCurrentView(AppView.EXPENSES); setIsMobileMenuOpen(false);}} />
          <div className="h-px bg-slate-800 my-4"></div>
          <MenuBtn icon={Calculator} label="Frete ANTT" active={currentView === AppView.CALCULATOR} onClick={() => {setCurrentView(AppView.CALCULATOR); setIsMobileMenuOpen(false);}} />
          <MenuBtn icon={Timer} label="Jornada" active={currentView === AppView.JORNADA} onClick={() => {setCurrentView(AppView.JORNADA); setIsMobileMenuOpen(false);}} />
          <MenuBtn icon={Fuel} label="Postos Próximos" active={currentView === AppView.STATIONS} onClick={() => {setCurrentView(AppView.STATIONS); setIsMobileMenuOpen(false);}} />
        </nav>
        <div className="absolute bottom-6 left-4 right-4 space-y-2">
          <button onClick={() => window.print()} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary-600/10 text-primary-400 font-bold text-sm border border-primary-900/50"><Share2 size={18} /><span>Relatório</span></button>
          <button onClick={() => supabase.auth.signOut()} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 font-bold text-sm"><LogOut size={18} /> Sair</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0 z-10">
          <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-slate-600"><Menu size={24} /></button>
          <div className="relative">
            <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative">
              <Bell size={22} />
              {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 rounded-full border-2 border-white text-[10px] text-white flex items-center justify-center font-bold">{notifications.length}</span>}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
                <div className="p-4 border-b bg-slate-50 font-black text-xs uppercase text-slate-500">Notificações</div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? <div className="p-8 text-center text-slate-400 text-sm">Nenhum alerta.</div> : notifications.map(n => (
                    <div key={n.id} className="p-4 border-b group hover:bg-slate-50">
                      <h4 className="font-black text-xs text-slate-800 uppercase">{n.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">{n.msg}</p>
                      <button onClick={() => { setDismissedIds([...dismissedIds, n.id]); localStorage.setItem('aurilog_dismissed_notifications', JSON.stringify([...dismissedIds, n.id])); setNotifications(notifications.filter(x => x.id !== n.id)); }} className="text-[10px] font-black text-primary-600 mt-2 uppercase tracking-wider">Limpar</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
          {currentView === AppView.DASHBOARD && <Dashboard trips={trips} expenses={expenses} vehicles={vehicles} onSetView={setCurrentView} />}
          {currentView === AppView.TRIPS && <TripManager trips={trips} vehicles={vehicles} onAddTrip={async (t) => { await supabase.from('trips').insert([sanitizeTripPayload({...t, user_id: session.user.id})]); fetchData(); }} onUpdateStatus={async (id, s, km) => { await supabase.from('trips').update({status: s}).eq('id', id); if(km) await supabase.from('vehicles').update({current_km: km}).eq('id', trips.find(x => x.id === id)?.vehicle_id); fetchData(); }} onDeleteTrip={async (id) => { await supabase.from('trips').delete().eq('id', id); fetchData(); }} onUpdateTrip={async (id, t) => { await supabase.from('trips').update(sanitizeTripPayload(t)).eq('id', id); fetchData(); }} isSaving={isSaving} />}
          {currentView === AppView.VEHICLES && <VehicleManager vehicles={vehicles} onAddVehicle={async (v) => { await supabase.from('vehicles').insert([{...v, user_id: session.user.id}]); fetchData(); }} onUpdateVehicle={async (id, v) => { await supabase.from('vehicles').update(v).eq('id', id); fetchData(); }} onDeleteVehicle={async (id) => { await supabase.from('vehicles').delete().eq('id', id); fetchData(); }} isSaving={isSaving} />}
          {currentView === AppView.MAINTENANCE && <MaintenanceManager maintenance={maintenance} vehicles={vehicles} onAddMaintenance={async (m) => { await supabase.from('maintenance').insert([{...m, user_id: session.user.id}]); fetchData(); }} onDeleteMaintenance={async (id) => { await supabase.from('maintenance').delete().eq('id', id); fetchData(); }} isSaving={isSaving} />}
          {currentView === AppView.EXPENSES && <ExpenseManager expenses={expenses} trips={trips} vehicles={vehicles} onAddExpense={handleAddExpense} onUpdateExpense={handleUpdateExpense} onDeleteExpense={async (id) => { await supabase.from('expenses').delete().eq('id', id); fetchData(); }} isSaving={isSaving} />}
          {currentView === AppView.CALCULATOR && <FreightCalculator />}
          {currentView === AppView.JORNADA && <JornadaManager mode={jornadaMode} startTime={jornadaStartTime} logs={jornadaLogs} setMode={setJornadaMode} setStartTime={setStartTimeWithStorage} onSaveLog={async (l) => { await supabase.from('jornada_logs').insert([{...l, user_id: session.user.id}]); fetchData(); }} onDeleteLog={async (id) => { await supabase.from('jornada_logs').delete().eq('id', id); fetchData(); }} addGlobalNotification={(t, m, tp) => setNotifications([{id: Date.now().toString(), title: t, msg: m, type: tp || 'info'}, ...notifications])} />}
          {currentView === AppView.STATIONS && <StationLocator />}
        </div>
      </main>
    </div>
  );
};

const MenuBtn = ({ icon: Icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${active ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}><Icon size={20} /><span className="font-bold text-sm">{label}</span></button>
);

export default App;
