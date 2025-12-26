
import React, { useMemo } from 'react';
import { Trip, Expense, FinancialSummary, Vehicle, AppView, TripStatus, ExpenseCategory } from '../types';
import { StatsCard } from './StatsCard';
import { TrendingUp, TrendingDown, DollarSign, Truck, UserCheck, ChevronRight, Calendar, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, PieChart, Pie } from 'recharts';

interface DashboardProps {
  trips: Trip[];
  expenses: Expense[];
  vehicles: Vehicle[];
  onSetView?: (view: AppView) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ trips, expenses, vehicles, onSetView }) => {
  
  const summary: FinancialSummary = useMemo(() => {
    const totalRevenue = trips
      .filter(t => t.status === TripStatus.COMPLETED)
      .reduce((acc, t) => acc + (t.agreed_price || 0), 0);

    const totalCommissions = trips
      .filter(t => t.status === TripStatus.COMPLETED)
      .reduce((acc, t) => acc + (t.driver_commission || 0), 0);

    const tripExpenses = expenses
      .filter(e => e.trip_id !== null)
      .reduce((acc, e) => acc + (e.amount || 0), 0);

    const fixedExpenses = expenses
      .filter(e => e.trip_id === null)
      .reduce((acc, e) => acc + (e.amount || 0), 0);
    
    const netProfit = totalRevenue - tripExpenses - fixedExpenses - totalCommissions;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalTripExpenses: tripExpenses,
      totalFixedExpenses: fixedExpenses,
      totalCommissions,
      netProfit,
      tripCount: trips.filter(t => t.status === TripStatus.COMPLETED).length,
      profitMargin
    };
  }, [trips, expenses]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="px-2">
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Painel de Resultados</h2>
        <p className="text-slate-400 font-bold text-sm">Resumo financeiro da sua operação</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatsCard title="Faturamento" value={formatCurrency(summary.totalRevenue)} icon={TrendingUp} color="green" />
        <StatsCard title="Custos Viagem" value={formatCurrency(summary.totalTripExpenses)} icon={TrendingDown} color="red" />
        <StatsCard title="Custos Fixos" value={formatCurrency(summary.totalFixedExpenses)} icon={Wallet} color="yellow" />
        <StatsCard title="Lucro Líquido" value={formatCurrency(summary.netProfit)} icon={DollarSign} color="blue" trend={`${summary.profitMargin.toFixed(1)}% de Margem`} />
        <StatsCard title="Viagens" value={summary.tripCount.toString()} icon={Truck} color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-2">
        {/* Gráfico de Barras: Comparativo */}
        <div className="bg-white p-6 rounded-[2.5rem] border shadow-sm">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Comparativo Financeiro</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Receita', valor: summary.totalRevenue },
                { name: 'Despesas', valor: summary.totalTripExpenses + summary.totalFixedExpenses + summary.totalCommissions },
                { name: 'Lucro', valor: summary.netProfit }
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="valor" radius={[10, 10, 0, 0]}>
                  <Cell fill="#10b981" />
                  <Cell fill="#f43f5e" />
                  <Cell fill="#0ea5e9" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Notificações Próximas */}
        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-primary-600 p-3 rounded-2xl">
              <Calendar size={28} />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tighter">Agenda Financeira</h3>
              <p className="text-slate-400 text-xs font-bold uppercase">Compromissos pendentes</p>
            </div>
          </div>
          
          <div className="space-y-3">
             {expenses.filter(e => e.due_date).slice(0, 2).map(e => (
               <div key={e.id} className="bg-slate-800 p-4 rounded-2xl flex justify-between items-center border border-slate-700">
                  <div>
                    <p className="text-[10px] font-black text-amber-500 uppercase">{e.category}</p>
                    <p className="font-bold text-sm">{e.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-rose-400">R$ {e.amount.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-500">Vence {new Date(e.due_date!).toLocaleDateString()}</p>
                  </div>
               </div>
             ))}
             {expenses.filter(e => e.due_date).length === 0 && (
               <p className="text-slate-500 text-sm italic py-4">Nenhum vencimento próximo.</p>
             )}
          </div>
          <button onClick={() => onSetView?.(AppView.EXPENSES)} className="mt-6 w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all">Ver Tudo</button>
        </div>
      </div>
    </div>
  );
};
