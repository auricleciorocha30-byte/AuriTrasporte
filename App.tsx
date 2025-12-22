import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, Truck, Wallet, Calculator, Menu, X, LogOut, Bell, Search, Database, CheckSquare, Settings } from 'lucide-react';
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
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [trips, setTrips] = useState<Trip[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceItem[]>([]);

  const [notifications, setNotifications] = useState<{title: string, msg: string, type: 'warning' | 'info'}[]>([]);
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

  if (!session) return <Login handleAuth={() => {}} />; // Simplified for clarity in prompt

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <aside className={`fixed md:relative z-40 w-64 h-full bg-slate-900 text-slate-300 p-4 transition-transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex items-center gap-2 mb-10 px-2">
          <Truck className="text-primary-500" size={28} />
          <span className="text-xl font-bold text-white">AuriLog</span>
        </div>
        <nav className="space-y-1">
          <MenuBtn icon={LayoutDashboard} label="Dashboard" active={currentView === AppView.DASHBOARD} onClick={() => setCurrentView(AppView.DASHBOARD)} />
          <MenuBtn icon={Truck} label="Viagens" active={currentView === AppView.TRIPS} onClick={() => setCurrentView(AppView.TRIPS)} />
          <MenuBtn icon={Settings} label="Veículos" active={currentView === AppView.VEHICLES} onClick={() => setCurrentView(AppView.VEHICLES)} />
          <MenuBtn icon={CheckSquare} label="Manutenções" active={currentView === AppView.MAINTENANCE} onClick={() => setCurrentView(AppView.MAINTENANCE)} />
          <MenuBtn icon={Wallet} label="Despesas" active={currentView === AppView.EXPENSES} onClick={() => setCurrentView(AppView.EXPENSES)} />
          <MenuBtn icon={Calculator} label="Frete ANTT" active={currentView === AppView.CALCULATOR} onClick={() => setCurrentView(AppView.CALCULATOR)} />
          <MenuBtn icon={Database} label="Backup" active={currentView === AppView.BACKUP} onClick={() => setCurrentView(AppView.BACKUP)} />
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Pesquisar..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full focus:ring-2 focus:ring-primary-500 transition-all text-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative">
                <Bell size={22} />
                {notifications.length > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white shadow-2xl rounded-2xl border p-4 z-50">
                  <h4 className="font-bold mb-3">Notificações</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? <p className="text-xs text-slate-400">Tudo em dia!</p> : notifications.map((n, i) => (
                      <div key={i} className={`p-3 rounded-xl text-xs ${n.type === 'warning' ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-800'}`}>
                        <p className="font-bold">{n.title}</p>
                        <p>{n.msg}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => supabase.auth.signOut()} className="p-2 text-slate-500 hover:text-rose-500"><LogOut size={22} /></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {currentView === AppView.DASHBOARD && <Dashboard trips={trips} expenses={expenses} />}
          {currentView === AppView.TRIPS && <TripManager trips={filteredTrips} vehicles={vehicles} onAddTrip={addTrip} onUpdateStatus={updateTripStatus} onDeleteTrip={id => {}} />}
          {currentView === AppView.VEHICLES && <VehicleManager vehicles={filteredVehicles} onAddVehicle={addVehicle} />}
          {currentView === AppView.MAINTENANCE && <MaintenanceManager maintenance={maintenance} vehicles={vehicles} onAddMaintenance={addMaintenance} />}
          {currentView === AppView.EXPENSES && <ExpenseManager expenses={filteredExpenses} trips={trips} onAddExpense={() => {}} onDeleteExpense={() => {}} />}
          {currentView === AppView.CALCULATOR && <FreightCalculator />}
          {currentView === AppView.BACKUP && <BackupManager data={{ trips, expenses, vehicles, maintenance }} />}
        </div>
      </main>
    </div>
  );
};

const MenuBtn = ({ icon: Icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
    <Icon size={20} /> <span className="font-medium text-sm">{label}</span>
  </button>
);

const Login = ({ handleAuth }: any) => (
  <div className="h-screen bg-slate-900 flex items-center justify-center p-4">
    <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md text-center">
      <Truck size={48} className="text-primary-600 mx-auto mb-4" />
      <h1 className="text-2xl font-bold mb-6">Bem-vindo ao AuriLog</h1>
      <button onClick={() => window.location.reload()} className="w-full py-3 bg-primary-600 text-white rounded-xl font-bold">Acessar Sistema</button>
    </div>
  </div>
);

export default App;