
export enum AppView {
  DASHBOARD = 'DASHBOARD',
  TRIPS = 'TRIPS',
  EXPENSES = 'EXPENSES',
  CALCULATOR = 'CALCULATOR',
  VEHICLES = 'VEHICLES',
  MAINTENANCE = 'MAINTENANCE',
  BACKUP = 'BACKUP',
  JORNADA = 'JORNADA',
  STATIONS = 'STATIONS',
  AI_ASSISTANT = 'AI_ASSISTANT'
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
  axles: number;
  cargo_type: string;
  user_id?: string;
}

export interface MaintenanceItem {
  id: string;
  vehicle_id: string;
  part_name: string;
  km_at_purchase: number;
  warranty_months: number;
  warranty_km: number;
  purchase_date: string;
  cost: number;
  user_id?: string;
}

export interface TripStop {
  city: string;
  state: string;
}

export interface Trip {
  id: string;
  origin: string;
  destination: string;
  stops?: TripStop[]; 
  distance_km: number;
  agreed_price: number;
  driver_commission_percentage: number;
  driver_commission: number;
  cargo_type: string;
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
  trip_id?: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  user_id?: string;
}

export interface ANTTParams {
  distance: number;
  axles: number;
  cargoType: string;
  isComposition: boolean;
  isHighPerformance: boolean;
  returnEmpty: boolean;
  tollCost?: number;
  otherCosts?: number;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  totalCommissions: number;
  netProfit: number;
  tripCount: number;
  profitMargin: number;
}
