
export enum AppView {
  DASHBOARD = 'DASHBOARD',
  TRIPS = 'TRIPS',
  EXPENSES = 'EXPENSES',
  CALCULATOR = 'CALCULATOR',
  VEHICLES = 'VEHICLES',
  MAINTENANCE = 'MAINTENANCE',
  BACKUP = 'BACKUP'
}

export enum TripStatus {
  SCHEDULED = 'Agendada',
  IN_PROGRESS = 'Em Andamento',
  COMPLETED = 'Concluída',
  CANCELLED = 'Cancelada'
}

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  year: number;
  current_km: number;
  user_id?: string;
}

export interface MaintenanceItem {
  id: string;
  vehicle_id: string;
  part_name: string;
  km_at_purchase: number;
  warranty_months: number;
  purchase_date: string;
  cost: number;
  user_id?: string;
}

export interface Trip {
  id: string;
  origin: string;
  destination: string;
  distanceKm: number;
  agreedPrice: number;
  driverCommissionPercentage: number;
  driverCommission: number;
  cargoType: string;
  date: string;
  status: TripStatus;
  notes?: string;
  vehicle_id?: string;
  user_id?: string;
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
  user_id?: string;
}

// Fix: Added missing ANTTParams interface required by geminiService and FreightCalculator
export interface ANTTParams {
  distance: number;
  axles: number;
  cargoType: 'general' | 'bulk' | 'refrigerated' | 'dangerous' | 'neogranel';
  returnEmpty: boolean;
  tollCost: number;
  otherCosts: number;
  profitMargin: number;
}

// Fix: Added missing FinancialSummary interface required by the Dashboard component
export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  totalCommissions: number;
  netProfit: number;
  tripCount: number;
  profitMargin: number;
}
