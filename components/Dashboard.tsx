import React, { useMemo } from 'react';
import { Trip, Expense, FinancialSummary } from '../types';
import { StatsCard } from './StatsCard';
import { TrendingUp, TrendingDown, DollarSign, Truck, UserCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DashboardProps {
  trips: Trip[];
  expenses: Expense[];
}

export const Dashboard: React.FC<DashboardProps> = ({ trips, expenses }) => {
  
  const summary: FinancialSummary = useMemo(() => {
    const totalRevenue = trips.reduce((acc, t) => acc + (t.agreed_price || 0), 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
    const totalCommissions = trips.reduce((acc, t) => acc + (t.driver_commission || 0), 0);
    
    const netProfit = totalRevenue - totalExpenses - totalCommissions;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalExpenses,
      totalCommissions,
      netProfit,
      tripCount: trips.length,
      profitMargin
    };
  }, [trips, expenses]);

  const chartData = useMemo(() => {
    return trips.slice(0, 6).reverse().map(t => {
      const tripExpenses = expenses.filter(e => e.trip_id === t.id).reduce((acc, curr) => acc + curr.amount, 0);
      const totalCosts = (t.driver_commission || 0) + tripExpenses;
      return {
        name: t.destination.split(' - ')[0].slice(0, 10),
        receita: t.agreed_price,
        custos: totalCosts,
        lucro: t.agreed_price - totalCosts
      };
    });
  }, [trips, expenses]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
        <StatsCard title="Faturamento" value={formatCurrency(summary.totalRevenue)} icon={TrendingUp} color="green" />
        <StatsCard title="Despesas GERAIS" value={formatCurrency(summary.totalExpenses)} icon={TrendingDown} color="red" />
        <StatsCard title="Comissões" value={formatCurrency(summary.totalCommissions)} icon={UserCheck} color="yellow" />
        <StatsCard title="Lucro Líquido" value={formatCurrency(summary.netProfit)} icon={DollarSign} color="blue" trend={`M: ${summary.profitMargin.toFixed(0)}%`} />
        <StatsCard title="Total Viagens" value={summary.tripCount.toString()} icon={Truck} color="blue" />
      </div>

      <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
           Desempenho por Viagem <span className="text-xs font-normal text-slate-400">(Últimas 6)</span>
        </h2>
        <div className="h-64 md:h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(value) => `R$${value/1000}k`} />
              <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} formatter={(value) => formatCurrency(Number(value))} />
              <Legend verticalAlign="top" height={36}/>
              <Bar dataKey="receita" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Faturamento" />
              <Bar dataKey="custos" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Custos+Comis." />
              <Bar dataKey="lucro" fill="#10b981" radius={[4, 4, 0, 0]} name="Lucro Real" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};