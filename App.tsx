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
        if (tripsRes.error.code === 'PGRST116' || tripsRes.error.message.includes('schema cache')) {
           setDbError("As tabelas não foram encontradas no Supabase. Por favor, execute o script SQL de criação no painel do Supabase.");
        }
        throw tripsRes.error;
      }
      if (expensesRes.error) throw expensesRes.error;

      if (tripsRes.data) setTrips(tripsRes.data);
      if (expensesRes.data) setExpenses(expensesRes.data);
    } catch (err: any) {
      console.error('Erro ao buscar dados do Supabase:', err.message);
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
        setSuccessMsg('Conta criada! Verifique seu e-mail para confirmar.');
      } else {
        setSuccessMsg('Conta criada com sucesso!');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError('E-mail ou senha incorretos ou conta não confirmada.');
      }
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setTrips([]);
    setExpenses([]);
    setIsMobileMenuOpen(false);
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
      console.error("Erro ao salvar viagem:", err.message);
      alert("Falha no Banco de Dados: Verifique se as tabelas foram criadas no painel do Supabase.");
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
      alert("Falha no Banco de Dados: Verifique se as tabelas foram criadas no painel do Supabase.");
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
            <p className="text-slate-500">{isSignUp ? 'Crie sua conta gratuita' : 'Conecte-se à sua conta'}</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {error && <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-lg border border-rose-100">{error}</div>}
            {successMsg && <div className="p-3 bg-emerald-50 text-emerald-600 text-sm rounded-lg border border-emerald-100">{successMsg}</div>}
            
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">E-mail</label>
              <div className="relative">
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                <UserIcon className="absolute left-3 top-3.5 text-slate-400" size={18} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Senha</label>
              <div className="relative">
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
              </div>
            </div>
            <button disabled={authLoading} type="submit" className="w-full py-4 bg-primary-600 text-white font-bold rounded-xl shadow-lg hover:bg-primary-700 active:scale-95 transition-all flex items-center justify-center gap-2">
              {authLoading ? <Loader2 className="animate-spin" /> : (isSignUp ? 'Criar Conta' : 'Acessar Painel')}
            </button>
          </form>

          <div className="text-center">
            <button 
              onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccessMsg(''); }}
              className="text-sm text-primary-600 font-medium hover:underline"
            >
              {isSignUp ? 'Já tem uma conta? Entre aqui' : 'Não tem conta? Crie uma agora'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-slate-900 text-white z-50 px-4 py-3 flex justify-between items-center shadow-md safe-top">
        <h1 className="font-bold text-xl flex items-center gap-2">
          <Truck className="text-primary-500" /> Auri
        </h1>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
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
          <button onClick={() => { setCurrentView(AppView.DASHBOARD); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${currentView === AppView.DASHBOARD ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <LayoutDashboard size={22} /> <span className="font-medium">Visão Geral</span>
          </button>
          <button onClick={() => { setCurrentView(AppView.TRIPS); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${currentView === AppView.TRIPS ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <Truck size={22} /> <span className="font-medium">Minhas Viagens</span>
          </button>
          <button onClick={() => { setCurrentView(AppView.EXPENSES); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${currentView === AppView.EXPENSES ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <Wallet size={22} /> <span className="font-medium">Despesas</span>
          </button>
          <button onClick={() => { setCurrentView(AppView.CALCULATOR); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${currentView === AppView.CALCULATOR ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <Calculator size={22} /> <span className="font-medium">Calc. Frete ANTT</span>
          </button>
          <div className="pt-4 mt-4 border-t border-slate-800">
            <button onClick={() => { setCurrentView("AI_INSIGHTS" as any); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${currentView === ("AI_INSIGHTS" as any) ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <Sparkles size={22} /> <span className="font-medium">Inteligência Auri</span>
            </button>
          </div>
        </nav>

        <div className="mt-auto space-y-4">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all">
            <LogOut size={20} /> <span className="font-medium">Sair do App</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto h-full pt-16 md:pt-0 bg-[#f8fafc]">
        {dbError && (
          <div className="bg-amber-50 border-b border-amber-100 p-4 flex items-center gap-3 text-amber-800 sticky top-0 z-20">
            <AlertTriangle className="shrink-0" />
            <p className="text-sm font-medium">{dbError}</p>
          </div>
        )}
        
        <div className="p-4 md:p-8 max-w-7xl mx-auto safe-bottom">
          {currentView === AppView.DASHBOARD && <Dashboard trips={trips} expenses={expenses} />}
          {currentView === AppView.TRIPS && <TripManager trips={trips} onAddTrip={addTrip} onDeleteTrip={deleteTrip} />}
          {currentView === AppView.EXPENSES && <ExpenseManager expenses={expenses} trips={trips} onAddExpense={addExpense} onDeleteExpense={deleteExpense} />}
          {currentView === AppView.CALCULATOR && <FreightCalculator />}
          {currentView === ("AI_INSIGHTS" as any) && <AiAssistant trips={trips} expenses={expenses} />}
        </div>
      </main>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-30 md:hidden transition-opacity" onClick={() => setIsMobileMenuOpen(false)} />
      )}
    </div>
  );
};

export default App;