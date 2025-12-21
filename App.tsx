
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Truck, Wallet, Calculator, Menu, X, LogOut, Lock, User as UserIcon, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { TripManager } from './components/TripManager';
import { ExpenseManager } from './components/ExpenseManager';
import { FreightCalculator } from './components/FreightCalculator';
import { AiAssistant } from './components/AiAssistant';
import { AppView, Trip, Expense } from './types';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [trips, setTrips] = useState<Trip[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [dbError, setDbError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

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
    if (session?.user) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    setLoading(true);
    setDbError(null);
    try {
      const [tripsRes, expensesRes] = await Promise.all([
        supabase.from('trips').select('*').order('date', { ascending: false }),
        supabase.from('expenses').select('*').order('date', { ascending: false })
      ]);

      if (tripsRes.error) {
        if (tripsRes.error.message.includes('schema cache') || tripsRes.error.code === 'PGRST116') {
           setDbError("Tabelas não encontradas. Certifique-se de executar o script SQL de criação no Supabase.");
        }
        throw tripsRes.error;
      }
      if (expensesRes.error) throw expensesRes.error;

      if (tripsRes.data) setTrips(tripsRes.data);
      if (expensesRes.data) setExpenses(expensesRes.data);
    } catch (err: any) {
      console.error('Erro ao buscar dados:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError('');
    setSuccessMsg('');

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else if (data.user && !data.session) {
        setSuccessMsg('Verifique seu e-mail para confirmar a conta.');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError('Credenciais inválidas.');
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setTrips([]);
    setExpenses([]);
  };

  const addTrip = async (trip: Omit<Trip, 'id'>) => {
    try {
      const { data, error } = await supabase.from('trips').insert([{
        ...trip,
        user_id: session.user.id
      }]).select();
      
      if (error) throw error;
      if (data) setTrips([data[0], ...trips]);
    } catch (err: any) {
      console.error("Erro ao salvar:", err.message);
      alert("Erro ao salvar no banco. Verifique se o SQL foi executado corretamente no painel do Supabase.");
    }
  };

  const deleteTrip = async (id: string) => {
    const { error } = await supabase.from('trips').delete().eq('id', id);
    if (!error) setTrips(trips.filter(t => t.id !== id));
  };

  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    try {
      const { data, error } = await supabase.from('expenses').insert([{
        ...expense,
        user_id: session.user.id
      }]).select();
      
      if (error) throw error;
      if (data) setExpenses([data[0], ...expenses]);
    } catch (err: any) {
      console.error("Erro ao salvar despesa:", err.message);
      alert("Erro ao salvar despesa.");
    }
  };

  const deleteExpense = async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (!error) setExpenses(expenses.filter(e => e.id !== id));
  };

  if (loading && !session) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-primary-600" size={40} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-8 space-y-8 animate-fade-in">
          <div className="text-center space-y-2">
            <div className="bg-primary-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-lg mb-4">
              <Truck className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900">AuriTrasportes</h1>
            <p className="text-slate-500">Gestão inteligente de fretes</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {error && <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-lg border border-rose-100">{error}</div>}
            {successMsg && <div className="p-3 bg-emerald-50 text-emerald-600 text-sm rounded-lg border border-emerald-100">{successMsg}</div>}
            
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">E-mail</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Senha</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
            <button disabled={authLoading} type="submit" className="w-full py-4 bg-primary-600 text-white font-bold rounded-xl shadow-lg hover:bg-primary-700 active:scale-95 transition-all flex items-center justify-center gap-2">
              {authLoading ? <Loader2 className="animate-spin" /> : (isSignUp ? 'Criar Conta' : 'Acessar')}
            </button>
          </form>

          <button onClick={() => setIsSignUp(!isSignUp)} className="w-full text-center text-sm text-primary-600 font-medium">
            {isSignUp ? 'Já tem conta? Entre aqui' : 'Não tem conta? Crie uma'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <div className="md:hidden fixed top-0 w-full bg-slate-900 text-white z-50 px-4 py-3 flex justify-between items-center shadow-md">
        <h1 className="font-bold text-xl flex items-center gap-2">Auri</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}><Menu size={24} /></button>
      </div>

      <aside className={`fixed md:relative z-40 w-72 h-full bg-slate-900 text-slate-300 flex flex-col p-4 transition-transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} pt-20 md:pt-6`}>
        <div className="hidden md:flex items-center gap-2 px-4 mb-10">
          <Truck className="text-primary-500" size={26} />
          <span className="text-2xl font-bold text-white">AuriTrasportes</span>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { id: AppView.DASHBOARD, label: 'Visão Geral', icon: LayoutDashboard },
            { id: AppView.TRIPS, label: 'Minhas Viagens', icon: Truck },
            { id: AppView.EXPENSES, label: 'Despesas', icon: Wallet },
            { id: AppView.CALCULATOR, label: 'Calc. Frete ANTT', icon: Calculator },
            { id: "AI_INSIGHTS", label: 'Inteligência Auri', icon: Sparkles, color: 'text-purple-400' }
          ].map(item => (
            <button key={item.id} onClick={() => { setCurrentView(item.id as any); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${currentView === item.id ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'}`}>
              <item.icon size={22} className={item.color} /> <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <button onClick={handleLogout} className="mt-auto flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10"><LogOut size={20} /> <span className="font-medium">Sair</span></button>
      </aside>

      <main className="flex-1 overflow-y-auto h-full pt-16 md:pt-0 bg-[#f8fafc]">
        {dbError && (
          <div className="bg-amber-50 border-b border-amber-100 p-4 flex items-center gap-3 text-amber-800 sticky top-0 z-20">
            <AlertTriangle className="shrink-0" />
            <p className="text-sm font-medium">{dbError}</p>
          </div>
        )}
        
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {currentView === AppView.DASHBOARD && <Dashboard trips={trips} expenses={expenses} />}
          {currentView === AppView.TRIPS && <TripManager trips={trips} onAddTrip={addTrip} onDeleteTrip={deleteTrip} />}
          {currentView === AppView.EXPENSES && <ExpenseManager expenses={expenses} trips={trips} onAddExpense={addExpense} onDeleteExpense={deleteExpense} />}
          {currentView === AppView.CALCULATOR && <FreightCalculator />}
          {currentView === ("AI_INSIGHTS" as any) && <AiAssistant trips={trips} expenses={expenses} />}
        </div>
      </main>

      {isMobileMenuOpen && <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-30 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />}
    </div>
  );
};

export default App;
