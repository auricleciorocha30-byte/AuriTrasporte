
import React, { useMemo } from 'react';
import { Trip, Expense, FinancialSummary, MaintenanceItem, Vehicle, AppView, TripStatus } from '../types';
import { StatsCard } from './StatsCard';
import { TrendingUp, TrendingDown, DollarSign, Truck, UserCheck, AlertCircle, ChevronRight, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DashboardProps {
  trips: Trip[];
  expenses: Expense[];
  maintenance?: MaintenanceItem[];
  vehicles?: Vehicle[];
  onSetView?: (view: AppView) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ trips, expenses, maintenance = [], vehicles = [], onSetView }) => {
  
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

  const upcomingTrips = useMemo(() => {
    const today = new Date();
    const getLocalYMD = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const todayStr = getLocalYMD(today);
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = getLocalYMD(tomorrow);

    return trips
      .filter(t => t.status === TripStatus.SCHEDULED && (t.date === todayStr || t.date === tomorrowStr))
      .map(t => ({
        ...t,
        isToday: t.date === todayStr
      }));
  }, [trips]);

  const criticalMaintenance = useMemo(() => {
    const today = new Date();
    return maintenance.filter(m => {
      const vehicle = vehicles.find(v => v.id === m.vehicle_id);
      if (!vehicle) return false;

      const pDate = new Date(m.purchase_date);
      const expiryDate = new Date(pDate);
      expiryDate.setMonth(pDate.getMonth() + (m.warranty_months || 0));

      const kmLimit = m.km_at_purchase + (m.warranty_km || 0);
      
      const isTimeExpired = m.warranty_months > 0 && expiryDate < today;
      const isKmExpired = m.warranty_km > 0 && vehicle.current_km >= kmLimit;

      return isTimeExpired || isKmExpired;
    });
  }, [maintenance, vehicles]);

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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mx-2">
        {/* Alertas Críticos de Manutenção */}
        {criticalMaintenance.length > 0 && (
          <div className="bg-rose-50 border-2 border-rose-200 p-6 rounded-[2rem] flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-rose-500 text-white p-3 rounded-2xl shadow-lg">
                <AlertCircle size={28} />
              </div>
              <div>
                <h3 className="text-lg font-black text-rose-900 uppercase tracking-tighter">Manutenções!</h3>
                <p className="text-sm font-bold text-rose-700">{criticalMaintenance.length} itens vencidos.</p>
              </div>
            </div>
            <button onClick={() => onSetView && onSetView(AppView.MAINTENANCE)} className="bg-white text-rose-600 p-3 rounded-xl shadow-sm hover:bg-rose-100 transition-all"><ChevronRight size={20}/></button>
          </div>
        )}

        {/* Agenda de Viagens (Notificação Visual 1 dia antes/Hoje) */}
        {upcomingTrips.length > 0 && (
          <div className="bg-primary-50 border-2 border-primary-200 p-6 rounded-[2rem] flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-primary-600 text-white p-3 rounded-2xl shadow-lg">
                <Calendar size={28} />
              </div>
              <div>
                <h3 className="text-lg font-black text-primary-900 uppercase tracking-tighter">Agenda Próxima</h3>
                <p className="text-sm font-bold text-primary-700">{upcomingTrips.length} viagem(ns) em breve.</p>
              </div>
            </div>
            <div className="flex -space-x-2">
              {upcomingTrips.map((t, idx) => (
                <div key={idx} className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black ${t.isToday ? 'bg-rose-500 text-white' : 'bg-primary-500 text-white'}`}>
                  {t.isToday ? 'H' : 'A'}
                </div>
              ))}
              <button onClick={() => onSetView && onSetView(AppView.TRIPS)} className="w-8 h-8 bg-white border-2 border-primary-200 rounded-full flex items-center justify-center text-primary-600 hover:bg-primary-50 ml-2 transition-all"><ChevronRight size={16}/></button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
        <StatsCard title="Faturamento" value={formatCurrency(summary.totalRevenue)} icon={TrendingUp} color="green" />
        <StatsCard title="Despesas GERAIS" value={formatCurrency(summary.totalExpenses)} icon={TrendingDown} color="red" />
        <StatsCard title="Comissões" value={formatCurrency(summary.totalCommissions)} icon={UserCheck} color="yellow" />
        <StatsCard title="Lucro Líquido" value={formatCurrency(summary.netProfit)} icon={DollarSign} color="blue" trend={`M: ${summary.profitMargin.toFixed(0)}%`} />
        <StatsCard title="Total Viagens" value={summary.tripCount.toString()} icon={Truck} color="blue" />
      </div>

      {/* Lista de Viagens Agendadas (Visibilidade imediata) */}
      {upcomingTrips.length > 0 && (
        <div className="bg-white p-6 rounded-[2rem] border shadow-sm mx-2">
           <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
             <Calendar size={16} className="text-primary-500"/> Próximas Saídas
           </h3>
           <div className="space-y-3">
             {upcomingTrips.map(trip => (
               <div key={trip.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-primary-200 transition-all cursor-pointer" onClick={() => onSetView && onSetView(AppView.TRIPS)}>
                 <div className="flex items-center gap-4">
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${trip.isToday ? 'bg-rose-100 text-rose-600' : 'bg-primary-100 text-primary-600'}`}>
                      {trip.isToday ? 'HOJE' : 'AMANHÃ'}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{trip.destination}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{trip.origin} • {trip.distance_km} KM</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="text-xs font-black text-primary-600">R$ {trip.agreed_price.toLocaleString()}</p>
                 </div>
               </div>
             ))}
           </div>
        </div>
      )}

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
