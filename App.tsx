import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Truck, Wallet, Calculator, Menu, X, LogOut, Bell, Search, Database, CheckSquare, Settings, Lock, User as UserIcon, Loader2, AlertCircle, Smartphone } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { TripManager } from './components/TripManager';
import { ExpenseManager } from './components/ExpenseManager';
import { FreightCalculator } from './components/FreightCalculator';
import { VehicleManager } from './components/VehicleManager';
import { MaintenanceManager } from './components/MaintenanceManager';
import { BackupManager } from './components/BackupManager';
import { AppView, Trip, Expense, Vehicle, MaintenanceItem, TripStatus } from './types';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Auth States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [trips, setTrips] = useState<Trip[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceItem[]>([]);

  const [notifications, setNotifications] = useState<{title: string, msg: string, type: 'warning' | 'info'}[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showInstallTip, setShowInstallTip] = useState(true);

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
      const [tripsRes, expRes, vehRes, mainRes] = await Promise.all([
        supabase.from('trips').select('*').order('date', { ascending: false }),
        supabase.from('expenses').select('*').order('date', { ascending: false }),
        supabase.from('vehicles').select('*').order('plate', { ascending: true }),
        supabase.from('maintenance').select('*').order('purchase_date', { ascending: false })
      ]);
      if (tripsRes.data) setTrips(tripsRes.data);
      if (expRes.data) setExpenses(expRes.data);
      if (vehRes.data) setVehicles(vehRes.data);
      if (mainRes.data) setMaintenance(mainRes.data);
      
      checkNotifications(tripsRes.data || [], mainRes.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const checkNotifications = (currentTrips: Trip[], currentMain: MaintenanceItem[]) => {
    const alerts: any[] = [];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    currentTrips.forEach(t => {
      if (t.status === TripStatus.SCHEDULED && t.date === tomorrowStr) {
        alerts.push({ title: 'Viagem Amanhã', msg: `Viagem para ${t.destination} agendada para amanhã!`, type: 'info' });
      }
    });

    currentMain.forEach(m => {
      const pDate = new Date(m.purchase_date);
      const expiry = new Date(pDate.setMonth(pDate.getMonth() + m.warranty_months));
      if (expiry < new Date()) {
        alerts.push({ title: 'Garantia Vencida', msg: `A peça "${m.part_name}" saiu da garantia.`, type: 'warning' });
      }
    });

    setNotifications(alerts);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user && !data.session) {
          setSuccessMsg('Conta criada! Verifique seu e-mail para confirmar o cadastro.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao processar autenticação.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleViewChange = (view: AppView) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false); // Fecha o menu para a esquerda no mobile
  };

  const addTrip = async (trip: Omit<Trip, 'id'>) => {
    const { data, error } = await supabase.from('trips').insert([{ ...trip, user_id: session.user.id }]).select();
    if (data) setTrips([data[0], ...trips]);
  };

  const updateTripStatus = async (id: string, status: TripStatus) => {
    const { error } = await supabase.from('trips').update({ status }).eq('id', id);
    if (!error) setTrips(trips.map(t => t.id === id ? { ...t, status } : t));
  };

  const addVehicle = async (veh: Omit<Vehicle, 'id'>) => {
    const { data, error } = await supabase.from('vehicles').insert([{ ...veh, user_id: session.user.id }]).select();
    if (data) setVehicles([...vehicles, data[0]]);
  };

  const addMaintenance = async (item: Omit<MaintenanceItem, 'id'>) => {
    const { data, error } = await supabase.from('maintenance').insert([{ ...item, user_id: session.user.id }]).select();
    if (data) setMaintenance([data[0], ...maintenance]);
  };

  const filteredTrips = trips.filter(t => t.origin.toLowerCase().includes(searchTerm.toLowerCase()) || t.destination.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredExpenses = expenses.filter(e => e.description.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredVehicles = vehicles.filter(v => v.plate.toLowerCase().includes(searchTerm.toLowerCase()) || v.model.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-primary-600" size={40} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md animate-fade-in">
          <div className="text-center mb-8">
            <div className="bg-primary-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-lg mb-4">
              <Truck className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-black text-slate-900">AuriLog</h1>
            <p className="text-slate-500 font-medium">
              {isSignUp ? 'Crie sua conta de gestor' : 'Gestão de fretes inteligente'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {error && (
              <div className="p-4 bg-rose-50 text-rose-600 text-sm rounded-2xl border border-rose-100 flex items-start gap-3">
                <AlertCircle className="shrink-0" size={18} />
                <p>{error}</p>
              </div>
            )}
            {successMsg && (
              <div className="p-4 bg-emerald-50 text-emerald-600 text-sm rounded-2xl border border-emerald-100 flex items-start gap-3">
                <AlertCircle className="shrink-0" size={18} />
                <p>{successMsg}</p>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 ml-1">E-mail</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="seu@email.com" 
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" 
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input 
                  type="password" 
                  required 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" 
                />
              </div>
            </div>

            <button 
              disabled={authLoading} 
              type="submit" 
              className="w-full py-4 bg-primary-600 text-white font-black rounded-2xl shadow-xl hover:bg-primary-700 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {authLoading ? <Loader2 className="animate-spin" /> : (isSignUp ? 'Criar Conta Grátis' : 'Entrar no Painel')}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccessMsg(''); }}
              className="text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors"
            >
              {isSignUp ? 'Já tem uma conta? Acesse aqui' : 'Ainda não tem conta? Cadastre-se'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Sidebar - desliza para a esquerda ao fechar */}
      <aside className={`fixed md:relative z-40 w-64 h-full bg-slate-900 text-slate-300 p-4 transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex items-center justify-between mb-10 px-2">
          <div className="flex items-center gap-2">
            <Truck className="text-primary-500" size={28} />
            <span className="text-xl font-bold text-white uppercase tracking-tighter">AuriLog</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-1 text-slate-500">
            <X size={20} />
          </button>
        </div>
        <nav className="space-y-1">
          <MenuBtn icon={LayoutDashboard} label="Dashboard" active={currentView === AppView.DASHBOARD} onClick={() => handleViewChange(AppView.DASHBOARD)} />
          <MenuBtn icon={Truck} label="Viagens" active={currentView === AppView.TRIPS} onClick={() => handleViewChange(AppView.TRIPS)} />
          <MenuBtn icon={Settings} label="Veículos" active={currentView === AppView.VEHICLES} onClick={() => handleViewChange(AppView.VEHICLES)} />
          <MenuBtn icon={CheckSquare} label="Manutenções" active={currentView === AppView.MAINTENANCE} onClick={() => handleViewChange(AppView.MAINTENANCE)} />
          <MenuBtn icon={Wallet} label="Despesas" active={currentView === AppView.EXPENSES} onClick={() => handleViewChange(AppView.EXPENSES)} />
          <MenuBtn icon={Calculator} label="Frete ANTT" active={currentView === AppView.CALCULATOR} onClick={() => handleViewChange(AppView.CALCULATOR)} />
          <MenuBtn icon={Database} label="Backup" active={currentView === AppView.BACKUP} onClick={() => handleViewChange(AppView.BACKUP)} />
        </nav>

        <div className="absolute bottom-6 left-4 right-4">
          <button onClick={() => supabase.auth.signOut()} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-all font-bold">
            <LogOut size={20} /> <span>Sair do App</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-4">
             <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
               <Menu size={24} />
             </button>
             <div className="hidden md:block relative w-64 lg:w-96">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Pesquisar..." 
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full focus:ring-2 focus:ring-primary-500 transition-all text-sm"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
             </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative">
                <Bell size={22} />
                {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white shadow-2xl rounded-2xl border p-4 z-50">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold">Notificações</h4>
                    <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600"><X size={16}/></button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">Tudo em dia!</p> : notifications.map((n, i) => (
                      <div key={i} className={`p-3 rounded-xl text-xs ${n.type === 'warning' ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-800'}`}>
                        <p className="font-bold">{n.title}</p>
                        <p>{n.msg}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
          {/* Banner de Instalação no Celular */}
          {showInstallTip && currentView === AppView.DASHBOARD && (
            <div className="mb-6 bg-gradient-to-r from-primary-600 to-primary-800 p-4 rounded-2xl text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in">
              <div className="flex items-center gap-4 text-center md:text-left">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Smartphone size={24} />
                </div>
                <div>
                  <h4 className="font-bold">Instale o AuriLog no seu celular</h4>
                  <p className="text-xs text-primary-100">Abra o menu do navegador e selecione "Adicionar à Tela de Início" para usar como app.</p>
                </div>
              </div>
              <button onClick={() => setShowInstallTip(false)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all shrink-0">Entendi</button>
            </div>
          )}

          <div className="md:hidden mb-6">
            <div className="relative w-full">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Pesquisar no sistema..." 
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 transition-all text-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {currentView === AppView.DASHBOARD && <Dashboard trips={trips} expenses={expenses} />}
          {currentView === AppView.TRIPS && <TripManager trips={filteredTrips} vehicles={vehicles} onAddTrip={addTrip} onUpdateStatus={updateTripStatus} onDeleteTrip={id => {}} />}
          {currentView === AppView.VEHICLES && <VehicleManager vehicles={filteredVehicles} onAddVehicle={addVehicle} />}
          {currentView === AppView.MAINTENANCE && <MaintenanceManager maintenance={maintenance} vehicles={vehicles} onAddMaintenance={addMaintenance} />}
          {currentView === AppView.EXPENSES && <ExpenseManager expenses={filteredExpenses} trips={trips} onAddExpense={() => {}} onDeleteExpense={() => {}} />}
          {currentView === AppView.CALCULATOR && <FreightCalculator />}
          {currentView === AppView.BACKUP && <BackupManager data={{ trips, expenses, vehicles, maintenance }} />}
        </div>
      </main>

      {/* Overlay para fechar o menu ao clicar fora */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)} 
        />
      )}
    </div>
  );
};

const MenuBtn = ({ icon: Icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${active ? 'bg-primary-600 text-white shadow-lg scale-105 z-10' : 'text-slate-400 hover:bg-slate-800'}`}
  >
    <Icon size={20} /> <span className="font-bold text-sm">{label}</span>
  </button>
);

export default App;