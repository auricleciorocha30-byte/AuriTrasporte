
import React, { useMemo } from 'react';
import { Trip, Expense, FinancialSummary, Vehicle, AppView, TripStatus, ExpenseCategory } from '../types';
import { StatsCard } from './StatsCard';
import { TrendingUp, TrendingDown, DollarSign, Truck, UserCheck, ChevronRight, Calendar, Wallet, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
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
        <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <BarChart3 size={16}/> Comparativo Financeiro
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Receita', valor: summary.totalRevenue },
                { name: 'Despesas', valor: summary.totalTripExpenses + summary.totalFixedExpenses + summary.totalCommissions },
                { name: 'Lucro', valor: summary.netProfit }
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800}} />
                <YAxis hide />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="valor" radius={[12, 12, 0, 0]} barSize={60}>
                  <Cell fill="#10b981" />
                  <Cell fill="#f43f5e" />
                  <Cell fill="#0ea5e9" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5">
            <PieChartIcon size={120} />
          </div>
          <div className="relative z-10">
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Saúde da Frota</h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">Análise de custos operacionais</p>
            
            <div className="space-y-6">
              <div className="flex justify-between items-end border-b border-slate-800 pb-4">
                 <div>
                   <p className="text-[10px] font-black text-slate-500 uppercase">Margem de Lucro</p>
                   <p className="text-3xl font-black text-emerald-400">{summary.profitMargin.toFixed(1)}%</p>
                 </div>
                 <div className="text-right">
                   <p className="text-[10px] font-black text-slate-500 uppercase">Ticket Médio/Viagem</p>
                   <p className="text-lg font-black">{formatCurrency(summary.tripCount > 0 ? summary.totalRevenue / summary.tripCount : 0)}</p>
                 </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-800/50 p-4 rounded-2xl">
                    <p className="text-[10px] font-black text-rose-400 uppercase mb-1">Custo Total</p>
                    <p className="text-xl font-black">{formatCurrency(summary.totalTripExpenses + summary.totalFixedExpenses)}</p>
                 </div>
                 <div className="bg-slate-800/50 p-4 rounded-2xl">
                    <p className="text-[10px] font-black text-primary-400 uppercase mb-1">Lucro Total</p>
                    <p className="text-xl font-black">{formatCurrency(summary.netProfit)}</p>
                 </div>
              </div>
            </div>

            <button onClick={() => onSetView?.(AppView.EXPENSES)} className="mt-10 w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-xs font-black uppercase tracking-widest transition-all">
              Acessar Financeiro Detalhado
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
