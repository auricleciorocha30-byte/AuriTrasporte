import React, { useMemo } from 'react';
import { Trip, Expense, FinancialSummary } from '../types';
import { StatsCard } from './StatsCard';
import { TrendingUp, TrendingDown, DollarSign, Truck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  trips: Trip[];
  expenses: Expense[];
}

export const Dashboard: React.FC<DashboardProps> = ({ trips, expenses }) => {
  
  const summary: FinancialSummary = useMemo(() => {
    const totalRevenue = trips.reduce((acc, t) => acc + t.agreedPrice, 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      tripCount: trips.length,
      profitMargin
    };
  }, [trips, expenses]);

  const chartData = useMemo(() => {
    const data = trips.slice(-5).map(t => ({
      name: t.destination.split(',')[0].slice(0, 8), // Abrevia nome da cidade
      receita: t.agreedPrice,
      lucro: t.agreedPrice * 0.4
    }));
    return data;
  }, [trips]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatsCard 
          title="Faturamento" 
          value={formatCurrency(summary.totalRevenue)} 
          icon={TrendingUp} 
          color="green"
        />
        <StatsCard 
          title="Despesas" 
          value={formatCurrency(summary.totalExpenses)} 
          icon={TrendingDown} 
          color="red"
        />
        <StatsCard 
          title="Lucro" 
          value={formatCurrency(summary.netProfit)} 
          icon={DollarSign} 
          color="blue" 
          trend={`M: ${summary.profitMargin.toFixed(0)}%`}
        />
        <StatsCard 
          title="Viagens" 
          value={summary.tripCount.toString()} 
          icon={Truck} 
          color="yellow" 
        />
      </div>

      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-6">Performance Financeira</h2>
        <div className="h-64 md:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(value) => `R$${value/1000}k`} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(value) => formatCurrency(Number(value))} 
              />
              <Bar dataKey="receita" fill="#0ea5e9" radius={[6, 6, 0, 0]} name="Receita" barSize={30} />
              <Bar dataKey="lucro" fill="#10b981" radius={[6, 6, 0, 0]} name="Lucro" barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};