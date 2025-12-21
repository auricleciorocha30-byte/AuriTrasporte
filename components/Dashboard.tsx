import React, { useMemo } from 'react';
import { Trip, Expense, FinancialSummary } from '../types';
import { StatsCard } from './StatsCard';
import { TrendingUp, TrendingDown, DollarSign, Truck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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
    // Group by month (simplified for last 6 items/months or raw list)
    // For this demo, let's just map the last 5 trips vs avg expense
    const data = trips.slice(-5).map(t => ({
      name: t.destination.split(' ')[0], // City name
      receita: t.agreedPrice,
      lucro: t.agreedPrice * 0.4 // Mock profit estimation per trip for visual
    }));
    return data;
  }, [trips]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Receita Total" 
          value={formatCurrency(summary.totalRevenue)} 
          icon={TrendingUp} 
          color="green"
        />
        <StatsCard 
          title="Despesas Totais" 
          value={formatCurrency(summary.totalExpenses)} 
          icon={TrendingDown} 
          color="red"
        />
        <StatsCard 
          title="Lucro Líquido" 
          value={formatCurrency(summary.netProfit)} 
          icon={DollarSign} 
          color="blue" 
          trend={`Margem: ${summary.profitMargin.toFixed(1)}%`}
        />
        <StatsCard 
          title="Viagens Realizadas" 
          value={summary.tripCount.toString()} 
          icon={Truck} 
          color="yellow" 
        />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Performance Recente (Últimas 5 Viagens)</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `R$${value/1000}k`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="receita" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Receita Bruta" />
              <Bar dataKey="lucro" fill="#10b981" radius={[4, 4, 0, 0]} name="Lucro Est." />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
