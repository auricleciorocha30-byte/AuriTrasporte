import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Truck, Wallet, Calculator, BrainCircuit, Menu, X } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { TripManager } from './components/TripManager';
import { ExpenseManager } from './components/ExpenseManager';
import { FreightCalculator } from './components/FreightCalculator';
import { AiAssistant } from './components/AiAssistant';
import { AppView, Trip, Expense, TripStatus, ExpenseCategory } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Persistent State (Mock DB)
  const [trips, setTrips] = useState<Trip[]>(() => {
    const saved = localStorage.getItem('trips');
    return saved ? JSON.parse(saved) : [
      { id: '1', origin: 'São Paulo, SP', destination: 'Curitiba, PR', distanceKm: 408, agreedPrice: 3500, cargoType: 'Peças', date: '2023-10-15', status: 'Concluída' },
      { id: '2', origin: 'Santos, SP', destination: 'Uberlândia, MG', distanceKm: 650, agreedPrice: 5200, cargoType: 'Fertilizante', date: '2023-10-20', status: 'Em Andamento' }
    ];
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('expenses');
    return saved ? JSON.parse(saved) : [
      { id: '1', description: 'Diesel Posto Graal', amount: 800, category: 'Combustível', date: '2023-10-15', tripId: '1' },
      { id: '2', description: 'Pedágio Régis', amount: 120, category: 'Pedágio', date: '2023-10-15', tripId: '1' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('trips', JSON.stringify(trips));
  }, [trips]);

  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [expenses]);

  const addTrip = (trip: Trip) => setTrips([...trips, trip]);
  const deleteTrip = (id: string) => setTrips(trips.filter(t => t.id !== id));

  const addExpense = (expense: Expense) => setExpenses([...expenses, expense]);
  const deleteExpense = (id: string) => setExpenses(expenses.filter(e => e.id !== id));

  const NavItem = ({ view, icon: Icon, label }: { view: AppView, icon: any, label: string }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        setIsMobileMenuOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        currentView === view 
          ? 'bg-primary-600 text-white shadow-md' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-slate-900 text-white z-50 px-4 py-3 flex justify-between items-center shadow-md">
        <h1 className="font-bold text-xl flex items-center gap-2"><Truck className="text-primary-500" /> AuriTrasportes</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed md:relative z-40 w-64 h-full bg-slate-900 text-slate-300 flex flex-col p-4 transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        pt-20 md:pt-4
      `}>
        <div className="hidden md:flex items-center gap-2 px-4 mb-8">
          <div className="bg-primary-600 p-2 rounded-lg">
            <Truck className="text-white" size={24} />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">AuriTrasportes</span>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem view={AppView.DASHBOARD} icon={LayoutDashboard} label="Visão Geral" />
          <NavItem view={AppView.TRIPS} icon={Truck} label="Minhas Viagens" />
          <NavItem view={AppView.EXPENSES} icon={Wallet} label="Despesas" />
          <NavItem view={AppView.CALCULATOR} icon={Calculator} label="Calc. Frete ANTT" />
          <div className="pt-4 mt-4 border-t border-slate-700">
            <NavItem view={AppView.AI_INSIGHTS} icon={BrainCircuit} label="Inteligência Artificial" />
          </div>
        </nav>

        <div className="mt-auto px-4 py-4 text-xs text-slate-500 text-center">
          &copy; 2024 AuriTrasportes AI
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-full pt-16 md:pt-0">
        <header className="bg-white shadow-sm border-b border-gray-100 px-8 py-5 flex justify-between items-center sticky top-0 z-10 md:static">
          <h2 className="text-2xl font-bold text-gray-800">
            {currentView === AppView.DASHBOARD && 'Painel de Controle'}
            {currentView === AppView.TRIPS && 'Gerenciamento de Viagens'}
            {currentView === AppView.EXPENSES && 'Controle Financeiro'}
            {currentView === AppView.CALCULATOR && 'Calculadora de Frete'}
            {currentView === AppView.AI_INSIGHTS && 'Consultor Virtual'}
          </h2>
          <div className="hidden md:flex items-center gap-4">
             {/* Example Profile/User area */}
             <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold">
               AT
             </div>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {currentView === AppView.DASHBOARD && <Dashboard trips={trips} expenses={expenses} />}
          {currentView === AppView.TRIPS && <TripManager trips={trips} onAddTrip={addTrip} onDeleteTrip={deleteTrip} />}
          {currentView === AppView.EXPENSES && <ExpenseManager expenses={expenses} trips={trips} onAddExpense={addExpense} onDeleteExpense={deleteExpense} />}
          {currentView === AppView.CALCULATOR && <FreightCalculator />}
          {currentView === AppView.AI_INSIGHTS && <AiAssistant trips={trips} expenses={expenses} />}
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default App;