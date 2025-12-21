export enum AppView {
  DASHBOARD = 'DASHBOARD',
  TRIPS = 'TRIPS',
  EXPENSES = 'EXPENSES',
  CALCULATOR = 'CALCULATOR'
}

export enum TripStatus {
  SCHEDULED = 'Agendada',
  IN_PROGRESS = 'Em Andamento',
  COMPLETED = 'Concluída',
  CANCELLED = 'Cancelada'
}

export interface Trip {
  id: string;
  origin: string;
  destination: string;
  distanceKm: number;
  agreedPrice: number;
  driverCommission: number; // Novo campo para comissão
  cargoType: string;
  date: string;
  status: TripStatus;
  notes?: string;
}

export enum ExpenseCategory {
  FUEL = 'Combustível',
  TOLL = 'Pedágio',
  MAINTENANCE = 'Manutenção',
  FOOD = 'Alimentação',
  LODGING = 'Hospedagem',
  OTHER = 'Outros'
}

export interface Expense {
  id: string;
  tripId?: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  totalCommissions: number; // Novo campo no resumo
  netProfit: number;
  tripCount: number;
  profitMargin: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface ANTTParams {
  distance: number;
  axles: number;
  cargoType: 'general' | 'bulk' | 'refrigerated' | 'dangerous' | 'neogranel';
  returnEmpty: boolean;
  tollCost: number;
  otherCosts: number;
  profitMargin: number;
}