import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Truck, Wallet, Calculator, Menu, X, LogOut, Bell, Search, Database, CheckSquare, Settings, Lock, User as UserIcon, Loader2, AlertCircle } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { TripManager } from './components/TripManager';
import { ExpenseManager } from './components/ExpenseManager';
import { FreightCalculator } from './components/FreightCalculator';
import { VehicleManager } from './components/VehicleManager';
import { MaintenanceManager } from './components/MaintenanceManager';
import { BackupManager } from './components/BackupManager';
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
  const [successMsg, setSuccessMsg] = useState('');

  const [trips, setTrips] = useState<Trip[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceItem[]>([]);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

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
      
      if (tripsRes.error) throw tripsRes.error;
      if (expRes.error) throw expRes.error;
      if (vehRes.error) throw vehRes.error;
      if (mainRes.error) throw mainRes.error;

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
    
    // 1. Notificação de Viagens Programadas (1 dia antes)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    currentTrips.forEach(t => {
      if (t.status === TripStatus.SCHEDULED && t.date === tomorrowStr) {
        alerts.push({ 
          id: `trip-${t.id}`,
          title: 'Viagem Programada', 
          msg: `Viagem para ${t.destination} marcada para amanhã!`, 
          type: 'info' 
        });
      }
    });

    // 2. Notificação de Garantias de Manutenção (Meses e KM)
    currentMain.forEach(m => {
      const pDate = new Date(m.purchase_date);
      const expiryDate = new Date(pDate.setMonth(pDate.getMonth() + m.warranty_months));
      const isTimeExpired = expiryDate < new Date();
      
      const vehicle = currentVehicles.find(v => v.id === m.vehicle_id);
      const isKmExpired = vehicle && m.warranty_km > 0 && vehicle.current_km > (m.km_at_purchase + m.warranty_km);

      if (isTimeExpired) {
        alerts.push({ 
          id: `main-time-${m.id}`,
          title: 'Garantia Vencida (Tempo)', 
          msg: `A garantia de "${m.part_name}" no ${vehicle?.plate} expirou.`, 
          type: 'warning' 
        });
      } else if (isKmExpired) {
        alerts.push({ 
          id: `main-km-${m.id}`,
          title: 'Garantia Vencida (KM)', 
          msg: `Garantia de "${m.part_name}" no ${vehicle?.plate} expirou por KM.`, 
          type: 'warning' 
        });
      }
    });

    setNotifications(alerts);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
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
    setIsMobileMenuOpen(false);
  };

  const addTrip = async (trip: Omit<Trip, 'id'>) => {
    setIsSaving(true);
    try {
      const sanitizedTrip = {
        ...trip,
        vehicle_id: trip.vehicle_id === "" ? null : trip.vehicle_id,
        user_id: session.user.id
      };
      const { data, error } = await supabase.from('trips').insert([sanitizedTrip]).select();
      if (error) throw error;
      if (data) setTrips([data[0], ...trips]);
    } catch (err: any) {
      alert("Erro ao salvar viagem: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTrip = async (id: string) => {
    if (!confirm('Excluir esta viagem permanentemente?')) return;
    const { error } = await supabase.from('trips').delete().eq('id', id);
    if (error) {
      alert("Erro ao excluir: " + error.message);
      return;
    }
    setTrips(trips.filter(t => t.id !== id));
  };

  const updateTripStatus = async (id: string, status: TripStatus) => {
    const { error } = await supabase.from('trips').update({ status }).eq('id', id);
    if (error) {
      alert("Erro ao atualizar status: " + error.message);
      return;
    }
    setTrips(trips.map(t => t.id === id ? { ...t, status } : t));
  };

  const addVehicle = async (veh: Omit<Vehicle, 'id'>) => {
    setIsSaving(true);
    try {
      const { data, error } = await supabase.from('vehicles').insert([{ ...veh, user_id: session.user.id }]).select();
      if (error) throw error;
      if (data) setVehicles([...vehicles, data[0]]);
    } catch (err: any) {
      alert("Erro ao salvar veículo: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteVehicle = async (id: string) => {
    if (!confirm('Excluir este veículo? Isso também afetará viagens vinculadas.')) return;
    const { error } = await supabase.from('vehicles').delete().eq('id', id);
    if (error) {
      alert("Erro ao excluir veículo: " + error.message);
      return;
    }
    setVehicles(vehicles.filter(v => v.id !== id));
  };

  const addMaintenance = async (item: Omit<MaintenanceItem, 'id'>) => {
    setIsSaving(true);
    try {
      const sanitizedItem = {
        ...item,
        vehicle_id: item.vehicle_id === "" ? null : item.vehicle_id,
        user_id: session.user.id
      };
      const { data, error } = await supabase.from('maintenance').insert([sanitizedItem]).select();
      if (error) throw error;
      if (data) setMaintenance([data[0], ...maintenance]);
    } catch (err: any) {
      alert("Erro ao salvar manutenção: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteMaintenance = async (id: string) => {
    if (!confirm('Excluir registro de manutenção?')) return;
    const { error } = await supabase.from('maintenance').delete().eq('id', id);
    if (error) {
      alert("Erro ao excluir: " + error.message);
      return;
    }
    setMaintenance(maintenance.filter(m => m.id !== id));
  };

  const addExpense = async (exp: Omit<Expense, 'id'>) => {
    setIsSaving(true);
    try {
      const sanitizedExp = {
        ...exp,
        trip_id: exp.trip_id === "" ? null : exp.trip_id,
        user_id: session.user.id
      };
      const { data, error } = await supabase.from('expenses').insert([sanitizedExp]).select();
      if (error) throw error;
      if (data) setExpenses([data[0], ...expenses]);
    } catch (err: any) {
      alert("Erro ao salvar despesa: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteExpense = async (id: string) => {
    if (!confirm('Excluir esta despesa?')) return;
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) {
      alert("Erro ao excluir: " + error.message);
      return;
    }
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const filteredTrips = trips.filter(t => t.origin.toLowerCase().includes(searchTerm.toLowerCase()) || t.destination.toLowerCase().includes(searchTerm.toLowerCase()));

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
            <p className="text-slate-500 font-medium">Gestão de fretes inteligente</p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            {error && <div className="p-4 bg-rose-50 text-rose-600 text-sm rounded-2xl flex items-start gap-3"><AlertCircle className="shrink-0" size={18} /><p>{error}</p></div>}
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 ml-1">E-mail</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
              </div>
            </div>
            <button disabled={authLoading} type="submit" className="w-full py-4 bg-primary-600 text-white font-black rounded-2xl shadow-xl hover:bg-primary-700 active:scale-95 transition-all flex items-center justify-center gap-2">
              {authLoading ? <Loader2 className="animate-spin" /> : (isSignUp ? 'Criar Conta' : 'Entrar')}
            </button>
          </form>
          <div className="mt-8 text-center">
            <button onClick={() => { setIsSignUp(!isSignUp); setError(''); }} className="text-sm font-bold text-primary-600">
              {isSignUp ? 'Já tem conta? Entre aqui' : 'Não tem conta? Cadastre-se'}
            </button>
          </div>
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
            <span className="text-xl font-bold text-white uppercase tracking-tighter">AuriLog</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-1 text-slate-500"><X size={20} /></button>
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
            <LogOut size={20} /> <span>Sair</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-4">
             <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-slate-600 rounded-lg"><Menu size={24} /></button>
             <div className="hidden md:block relative w-64 lg:w-96">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input type="text" placeholder="Pesquisar..." className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full focus:ring-2 focus:ring-primary-500 transition-all text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
             </div>
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
                    <h4 className="font-bold text-slate-900 text-lg tracking-tight">Notificações</h4>
                    <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600"><X size={18}/></button>
                  </div>
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <div className="text-center py-8">
                        <Bell className="mx-auto text-slate-200 mb-2" size={36} />
                        <p className="text-sm text-slate-400">Sem notificações no momento.</p>
                      </div>
                    ) : notifications.map((n) => (
                      <div key={n.id} className={`p-4 rounded-2xl relative group border transition-all hover:shadow-sm ${n.type === 'warning' ? 'bg-amber-50 text-amber-900 border-amber-100' : 'bg-blue-50 text-blue-900 border-blue-100'}`}>
                        <p className="font-black text-[10px] uppercase opacity-50 tracking-widest mb-1.5 pr-6">{n.title}</p>
                        <p className="text-base font-bold leading-tight">{n.msg}</p>
                        <button 
                          onClick={() => dismissNotification(n.id)}
                          className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-900 hover:bg-white/50 rounded-lg transition-all"
                          title="Apagar"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                  {notifications.length > 0 && (
                    <button 
                      onClick={() => setNotifications([])}
                      className="w-full mt-4 py-2.5 text-xs font-black text-slate-400 hover:text-primary-600 transition-colors uppercase tracking-widest border-t border-slate-50"
                    >
                      Limpar Tudo
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
          {currentView === AppView.DASHBOARD && <Dashboard trips={trips} expenses={expenses} />}
          {currentView === AppView.TRIPS && <TripManager trips={filteredTrips} vehicles={vehicles} onAddTrip={addTrip} onUpdateStatus={updateTripStatus} onDeleteTrip={deleteTrip} isSaving={isSaving} />}
          {currentView === AppView.VEHICLES && <VehicleManager vehicles={vehicles} onAddVehicle={addVehicle} onDeleteVehicle={deleteVehicle} isSaving={isSaving} />}
          {currentView === AppView.MAINTENANCE && <MaintenanceManager maintenance={maintenance} vehicles={vehicles} onAddMaintenance={addMaintenance} onDeleteMaintenance={deleteMaintenance} isSaving={isSaving} />}
          {currentView === AppView.EXPENSES && <ExpenseManager expenses={expenses} trips={trips} onAddExpense={addExpense} onDeleteExpense={deleteExpense} isSaving={isSaving} />}
          {currentView === AppView.CALCULATOR && <FreightCalculator />}
          {currentView === AppView.BACKUP && <BackupManager data={{ trips, expenses, vehicles, maintenance }} />}
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