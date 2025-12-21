import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Truck, Wallet, Calculator, Menu, X, LogOut, Lock, User as UserIcon } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { TripManager } from './components/TripManager';
import { ExpenseManager } from './components/ExpenseManager';
import { FreightCalculator } from './components/FreightCalculator';
import { AppView, Trip, Expense, TripStatus, ExpenseCategory, User } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [trips, setTrips] = useState<Trip[]>(() => {
    const saved = localStorage.getItem('trips');
    return saved ? JSON.parse(saved) : [
      { id: '1', origin: 'São Paulo, SP', destination: 'Curitiba, PR', distanceKm: 408, agreedPrice: 3500, driverCommission: 350, cargoType: 'Peças', date: '2023-10-15', status: TripStatus.COMPLETED },
      { id: '2', origin: 'Santos, SP', destination: 'Uberlândia, MG', distanceKm: 650, agreedPrice: 5200, driverCommission: 520, cargoType: 'Fertilizante', date: '2023-10-20', status: TripStatus.IN_PROGRESS }
    ];
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('expenses');
    return saved ? JSON.parse(saved) : [
      { id: '1', description: 'Diesel Posto Graal', amount: 800, category: ExpenseCategory.FUEL, date: '2023-10-15', tripId: '1' },
      { id: '2', description: 'Pedágio Régis', amount: 120, category: ExpenseCategory.TOLL, date: '2023-10-15', tripId: '1' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('trips', JSON.stringify(trips));
  }, [trips]);

  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const addTrip = (trip: Trip) => setTrips([...trips, trip]);
  const deleteTrip = (id: string) => setTrips(trips.filter(t => t.id !== id));

  const addExpense = (expense: Expense) => setExpenses([...expenses, expense]);
  const deleteExpense = (id: string) => setExpenses(expenses.filter(e => e.id !== id));

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Login simulado
    setUser({ id: '1', name: 'Admin Transportes', email: 'admin@auritransportes.com' });
  };

  const handleLogout = () => {
    setUser(null);
    setIsMobileMenuOpen(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-8 space-y-8">
          <div className="text-center space-y-2">
            <div className="bg-primary-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-lg mb-4">
              <Truck className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900">AuriTrasportes</h1>
            <p className="text-slate-500">Gestão completa para seu transporte</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">E-mail</label>
              <div className="relative">
                <input type="email" required placeholder="seu@email.com" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                <UserIcon className="absolute left-3 top-3.5 text-slate-400" size={18} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Senha</label>
              <div className="relative">
                <input type="password" required placeholder="••••••••" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
              </div>
            </div>
            <button type="submit" className="w-full py-4 bg-primary-600 text-white font-bold rounded-xl shadow-lg hover:bg-primary-700 active:scale-95 transition-all">
              Acessar Painel
            </button>
          </form>

          <div className="text-center">
            <a href="#" className="text-sm text-primary-600 hover:underline">Esqueceu a senha?</a>
          </div>
        </div>
      </div>
    );
  }

  const NavItem = ({ view, icon: Icon, label }: { view: AppView, icon: any, label: string }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        setIsMobileMenuOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all active:scale-95 ${
        currentView === view 
          ? 'bg-primary-600 text-white shadow-md' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon size={22} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-slate-900 text-white z-50 px-4 py-3 flex justify-between items-center shadow-md safe-top">
        <h1 className="font-bold text-xl flex items-center gap-2">
          <Truck className="text-primary-500" /> Auri
        </h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed md:relative z-40 w-72 h-full bg-slate-900 text-slate-300 flex flex-col p-4 transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        pt-24 md:pt-6
      `}>
        <div className="hidden md:flex items-center gap-2 px-4 mb-10">
          <div className="bg-primary-600 p-2.5 rounded-xl shadow-lg shadow-primary-900/20">
            <Truck className="text-white" size={26} />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">AuriTrasportes</span>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto">
          <NavItem view={AppView.DASHBOARD} icon={LayoutDashboard} label="Visão Geral" />
          <NavItem view={AppView.TRIPS} icon={Truck} label="Minhas Viagens" />
          <NavItem view={AppView.EXPENSES} icon={Wallet} label="Despesas" />
          <NavItem view={AppView.CALCULATOR} icon={Calculator} label="Calc. Frete ANTT" />
        </nav>

        <div className="mt-auto space-y-4">
          <div className="px-4 py-3 bg-slate-800/50 rounded-xl flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center font-bold text-white">
               {user.name.charAt(0)}
             </div>
             <div className="flex-1 min-w-0">
               <p className="text-sm font-bold text-white truncate">{user.name}</p>
               <p className="text-xs text-slate-500 truncate">{user.email}</p>
             </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium">Sair do App</span>
          </button>
          <div className="px-4 py-2 text-[10px] text-slate-500 text-center border-t border-slate-700/30">
            &copy; 2024 AuriTrasportes
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto h-full pt-16 md:pt-0 bg-[#f8fafc]">
        <header className="hidden md:flex bg-white shadow-sm border-b border-gray-100 px-8 py-5 justify-between items-center sticky top-0 z-10">
          <h2 className="text-2xl font-bold text-gray-800">
            {currentView === AppView.DASHBOARD && 'Painel de Controle'}
            {currentView === AppView.TRIPS && 'Gerenciamento de Viagens'}
            {currentView === AppView.EXPENSES && 'Controle Financeiro'}
            {currentView === AppView.CALCULATOR && 'Calculadora de Frete'}
          </h2>
          <div className="flex items-center gap-4">
             <div className="text-right">
                <p className="text-sm font-bold text-slate-900">{user.name}</p>
                <p className="text-xs text-slate-500">Gestor de Frota</p>
             </div>
             <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold border border-primary-200">
               {user.name.charAt(0)}
             </div>
          </div>
        </header>

        <div className="md:hidden px-4 pt-6 pb-2">
           <h2 className="text-2xl font-bold text-gray-900">
            {currentView === AppView.DASHBOARD && 'Painel'}
            {currentView === AppView.TRIPS && 'Viagens'}
            {currentView === AppView.EXPENSES && 'Despesas'}
            {currentView === AppView.CALCULATOR && 'ANTT'}
          </h2>
        </div>

        <div className="p-4 md:p-8 max-w-7xl mx-auto safe-bottom">
          {currentView === AppView.DASHBOARD && <Dashboard trips={trips} expenses={expenses} />}
          {currentView === AppView.TRIPS && <TripManager trips={trips} onAddTrip={addTrip} onDeleteTrip={deleteTrip} />}
          {currentView === AppView.EXPENSES && <ExpenseManager expenses={expenses} trips={trips} onAddExpense={addExpense} onDeleteExpense={deleteExpense} />}
          {currentView === AppView.CALCULATOR && <FreightCalculator />}
        </div>
      </main>

      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-30 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default App;