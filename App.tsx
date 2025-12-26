
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

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');

  // Estados da Jornada (Cronômetro)
  const [jornadaMode, setJornadaMode] = useState<'IDLE' | 'DRIVING' | 'RESTING'>('IDLE');
  const [jornadaStartTime, setJornadaStartTime] = useState<number | null>(null);

  const [trips, setTrips] = useState<Trip[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceItem[]>([]);
  const [jornadaLogs, setJornadaLogs] = useState<JornadaLog[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Recuperar estado da jornada do localStorage
    const savedMode = localStorage.getItem('aurilog_jornada_mode') as any;
    const savedStart = localStorage.getItem('aurilog_jornada_start_time');
    if (savedMode && ['DRIVING', 'RESTING'].includes(savedMode)) {
      setJornadaMode(savedMode);
      if (savedStart) setJornadaStartTime(Number(savedStart));
    }

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
      setTrips(tripsRes.data || []);
      setExpenses(expRes.data || []);
      setVehicles(vehRes.data || []);
      setMaintenance(mainRes.data || []);
      setJornadaLogs(jornRes.data || []);
    } finally { setLoading(false); }
  };

  const handleAddExpense = async (e: Omit<Expense, 'id'>) => {
    if (!session?.user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('expenses').insert([{...e, user_id: session.user.id}]);
      if (error) throw error;
      fetchData();
    } catch (err: any) { alert(err.message); } finally { setIsSaving(false); }
  };

  const handleUpdateExpense = async (id: string, e: Partial<Expense>) => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('expenses').update(e).eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err: any) { alert(err.message); } finally { setIsSaving(false); }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAuthLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Cadastro realizado! Verifique seu e-mail.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) { 
      setError(err.message); 
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-primary-600" size={48} /></div>;

  if (!session) return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 p-4" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-10 animate-fade-in border border-white/10">
        <div className="flex flex-col items-center mb-10">
          <div className="bg-primary-600 p-4 rounded-[1.5rem] shadow-lg mb-4 text-white">
            <Truck size={40} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none text-center">AuriLog</h1>
          <p className="text-slate-400 font-bold text-xs mt-2 uppercase tracking-widest">{isSignUp ? 'Criar nova conta' : 'Gestão Profissional de Fretes'}</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-4.5 text-slate-400" size={18} />
              <input required type="email" placeholder="seu@email.com" className="w-full pl-12 pr-4 py-4.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-primary-500 transition-all" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Senha</label>
            <div className="relative">
              <Key className="absolute left-4 top-4.5 text-slate-400" size={18} />
              <input required type="password" placeholder="••••••••" className="w-full pl-12 pr-4 py-4.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-primary-500 transition-all" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
          </div>
          {error && <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-rose-600 text-xs font-bold">{error}</div>}
          <button disabled={authLoading} type="submit" className="w-full py-5 bg-primary-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-primary-700 transition-all flex items-center justify-center gap-3">
            {authLoading ? <Loader2 className="animate-spin" /> : isSignUp ? <UserPlus size={20} /> : <LogIn size={20} />}
            {isSignUp ? 'Cadastrar agora' : 'Entrar no Sistema'}
          </button>
        </form>
        <button onClick={() => setIsSignUp(!isSignUp)} className="mt-8 w-full text-primary-600 font-black text-sm uppercase hover:underline">{isSignUp ? 'Já tem conta? Entre' : 'Não tem conta? Cadastre-se'}</button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className={`fixed md:relative z-40 w-64 h-full bg-slate-900 text-slate-300 p-4 transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`} style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}>
        <div className="flex items-center gap-2 mb-10 px-2"><Truck className="text-primary-500" size={28} /><span className="text-xl font-bold text-white tracking-tighter uppercase">AuriLog</span></div>
        <nav className="space-y-1">
          <MenuBtn icon={LayoutDashboard} label="Dashboard" active={currentView === AppView.DASHBOARD} onClick={() => {setCurrentView(AppView.DASHBOARD); setIsMobileMenuOpen(false);}} />
          <MenuBtn icon={Truck} label="Viagens" active={currentView === AppView.TRIPS} onClick={() => {setCurrentView(AppView.TRIPS); setIsMobileMenuOpen(false);}} />
          <MenuBtn icon={Wallet} label="Financeiro" active={currentView === AppView.EXPENSES} onClick={() => {setCurrentView(AppView.EXPENSES); setIsMobileMenuOpen(false);}} />
          <MenuBtn icon={Settings} label="Veículos" active={currentView === AppView.VEHICLES} onClick={() => {setCurrentView(AppView.VEHICLES); setIsMobileMenuOpen(false);}} />
          <MenuBtn icon={CheckSquare} label="Manutenções" active={currentView === AppView.MAINTENANCE} onClick={() => {setCurrentView(AppView.MAINTENANCE); setIsMobileMenuOpen(false);}} />
          <MenuBtn icon={Calculator} label="Frete ANTT" active={currentView === AppView.CALCULATOR} onClick={() => {setCurrentView(AppView.CALCULATOR); setIsMobileMenuOpen(false);}} />
          <MenuBtn icon={Timer} label="Jornada" active={currentView === AppView.JORNADA} onClick={() => {setCurrentView(AppView.JORNADA); setIsMobileMenuOpen(false);}} />
          <MenuBtn icon={Fuel} label="Postos Próximos" active={currentView === AppView.STATIONS} onClick={() => {setCurrentView(AppView.STATIONS); setIsMobileMenuOpen(false);}} />
        </nav>
        <button onClick={() => supabase.auth.signOut()} className="absolute bottom-6 left-4 right-4 flex items-center gap-3 px-4 py-3 text-rose-400 font-bold hover:bg-white/5 rounded-xl transition-colors"><LogOut size={18} /> Sair</button>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0 z-10" style={{ paddingTop: 'env(safe-area-inset-top)', height: 'calc(4rem + env(safe-area-inset-top))' }}>
          <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-slate-600"><Menu size={24} /></button>
          <div className="flex items-center gap-4">
            {jornadaMode !== 'IDLE' && (
              <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase flex items-center gap-2 animate-pulse ${jornadaMode === 'DRIVING' ? 'bg-primary-50 text-primary-600' : 'bg-emerald-50 text-emerald-600'}`}>
                <Timer size={14}/> {jornadaMode === 'DRIVING' ? 'Ao Volante' : 'Descanso'}
              </div>
            )}
            <div className="p-2 text-slate-500 hover:bg-slate-50 rounded-full cursor-pointer"><Bell size={22} /></div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {currentView === AppView.EXPENSES && (
            <ExpenseManager expenses={expenses} trips={trips} vehicles={vehicles} onAddExpense={handleAddExpense} onUpdateExpense={handleUpdateExpense} onDeleteExpense={async (id) => { if(window.confirm('Excluir?')) { await supabase.from('expenses').delete().eq('id', id); fetchData(); } }} isSaving={isSaving} />
          )}
          {currentView === AppView.TRIPS && (
            <TripManager trips={trips} vehicles={vehicles} onAddTrip={async (t) => { await supabase.from('trips').insert([{...t, user_id: session.user.id}]); fetchData(); }} onUpdateTrip={async (id, t) => { await supabase.from('trips').update(t).eq('id', id); fetchData(); }} onUpdateStatus={async (id, s, km) => { await supabase.from('trips').update({status: s}).eq('id', id); if(km) { const trip = trips.find(x => x.id === id); if(trip?.vehicle_id) await supabase.from('vehicles').update({current_km: km}).eq('id', trip.vehicle_id); } fetchData(); }} onDeleteTrip={async (id) => { if(window.confirm('Excluir?')) { await supabase.from('trips').delete().eq('id', id); fetchData(); } }} isSaving={isSaving} />
          )}
          {currentView === AppView.VEHICLES && (
            <VehicleManager vehicles={vehicles} onAddVehicle={async (v) => { await supabase.from('vehicles').insert([{...v, user_id: session.user.id}]); fetchData(); }} onUpdateVehicle={async (id, v) => { await supabase.from('vehicles').update(v).eq('id', id); fetchData(); }} onDeleteVehicle={async (id) => { if(window.confirm('Excluir?')) { await supabase.from('vehicles').delete().eq('id', id); fetchData(); } }} isSaving={isSaving} />
          )}
          {currentView === AppView.MAINTENANCE && (
            <MaintenanceManager maintenance={maintenance} vehicles={vehicles} onAddMaintenance={async (m) => { await supabase.from('maintenance').insert([{...m, user_id: session.user.id}]); fetchData(); }} onDeleteMaintenance={async (id) => { if(window.confirm('Excluir?')) { await supabase.from('maintenance').delete().eq('id', id); fetchData(); } }} isSaving={isSaving} />
          )}
          {currentView === AppView.CALCULATOR && <FreightCalculator />}
          {currentView === AppView.JORNADA && (
            <JornadaManager 
              mode={jornadaMode}
              startTime={jornadaStartTime}
              logs={jornadaLogs}
              setMode={setJornadaMode}
              setStartTime={setJornadaStartTime}
              onSaveLog={async (l) => { await supabase.from('jornada_logs').insert([{...l, user_id: session.user.id}]); fetchData(); }}
              onDeleteLog={async (id) => { await supabase.from('jornada_logs').delete().eq('id', id); fetchData(); }}
              addGlobalNotification={() => {}}
            />
          )}
          {currentView === AppView.STATIONS && <StationLocator />}
          {currentView === AppView.DASHBOARD && <Dashboard trips={trips} expenses={expenses} vehicles={vehicles} onSetView={setCurrentView} />}
        </div>
      </main>
    </div>
  );
};

const MenuBtn = ({ icon: Icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${active ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}><Icon size={20} /><span className="font-bold text-sm">{label}</span></button>
);

export default App;
