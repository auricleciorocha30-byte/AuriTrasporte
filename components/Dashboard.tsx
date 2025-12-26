
import React, { useMemo } from 'react';
import { Trip, Expense, FinancialSummary, Vehicle, AppView, TripStatus } from '../types';
import { StatsCard } from './StatsCard';
import { TrendingUp, TrendingDown, DollarSign, Truck, Wallet, BarChart3, PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  trips: Trip[];
  expenses: Expense[];
  vehicles: Vehicle[];
  onSetView?: (view: AppView) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ trips, expenses, vehicles, onSetView }) => {
  
  const summary: FinancialSummary = useMemo(() => {
    const totalRevenue = trips.filter(t => t.status === TripStatus.COMPLETED).reduce((acc, t) => acc + (t.agreed_price || 0), 0);
    const totalCommissions = trips.filter(t => t.status === TripStatus.COMPLETED).reduce((acc, t) => acc + (t.driver_commission || 0), 0);
    const tripExpenses = expenses.filter(e => e.trip_id !== null).reduce((acc, e) => acc + (e.amount || 0), 0);
    const fixedExpenses = expenses.filter(e => e.trip_id === null).reduce((acc, e) => acc + (e.amount || 0), 0);
    const netProfit = totalRevenue - tripExpenses - fixedExpenses - totalCommissions;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return { totalRevenue, totalTripExpenses: tripExpenses, totalFixedExpenses: fixedExpenses, totalCommissions, netProfit, tripCount: trips.filter(t => t.status === TripStatus.COMPLETED).length, profitMargin };
  }, [trips, expenses]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      <div className="px-4">
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Dashboard</h2>
        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-2">Visão geral do seu negócio</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-4">
        <StatsCard title="Receita Bruta" value={formatCurrency(summary.totalRevenue)} icon={ArrowUpRight} color="blue" />
        <StatsCard title="Despesas Totais" value={formatCurrency(summary.totalTripExpenses + summary.totalFixedExpenses)} icon={ArrowDownRight} color="red" />
        <StatsCard title="Lucro Líquido" value={formatCurrency(summary.netProfit)} icon={DollarSign} color="green" trend={`${summary.profitMargin.toFixed(1)}% margem`} />
        <StatsCard title="Viagens" value={summary.tripCount.toString()} icon={Truck} color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4">
        <div className="bg-white p-10 rounded-[3.5rem] border shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
              <BarChart3 size={18}/> Fluxo de Caixa Estimado
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Receita', valor: summary.totalRevenue },
                  { name: 'Custos', valor: summary.totalTripExpenses + summary.totalFixedExpenses },
                  { name: 'Lucro', valor: summary.netProfit }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 800, fill: '#64748b'}} />
                  <YAxis hide />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)'}} />
                  <Bar dataKey="valor" radius={[16, 16, 0, 0]} barSize={70}>
                    <Cell fill="#6366f1" />
                    <Cell fill="#f43f5e" />
                    <Cell fill="#10b981" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-slate-950 p-12 rounded-[4rem] text-white flex flex-col justify-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12">
            <PieChartIcon size={180} />
          </div>
          <div className="relative z-10">
            <h3 className="text-3xl font-black uppercase tracking-tighter mb-4 leading-none">Margem Operacional</h3>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-12">Eficiência do seu frete</p>
            
            <div className="space-y-8">
              <div className="flex justify-between items-end border-b border-white/5 pb-8">
                 <div>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Aproveitamento</p>
                   <p className="text-5xl font-black text-emerald-400 mt-2">{summary.profitMargin.toFixed(1)}%</p>
                 </div>
                 <div className="text-right">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Valor p/ Viagem</p>
                   <p className="text-xl font-black mt-2">{formatCurrency(summary.tripCount > 0 ? summary.totalRevenue / summary.tripCount : 0)}</p>
                 </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                 <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                    <p className="text-[10px] font-black text-rose-400 uppercase mb-2">Custos Fixos</p>
                    <p className="text-2xl font-black">{formatCurrency(summary.totalFixedExpenses)}</p>
                 </div>
                 <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                    <p className="text-[10px] font-black text-primary-400 uppercase mb-2">Comissões</p>
                    <p className="text-2xl font-black">{formatCurrency(summary.totalCommissions)}</p>
                 </div>
              </div>
            </div>

            <button onClick={() => onSetView?.(AppView.EXPENSES)} className="mt-12 w-full py-6 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all">
              Gerenciar Parcelas e Gastos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
