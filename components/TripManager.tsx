
import React, { useState, useEffect } from 'react';
import { Trip, TripStatus, Vehicle, TripStop } from '../types';
import { Plus, MapPin, Calendar, Truck, UserCheck, Navigation, X, Trash2, Map as MapIcon, ChevronRight, Percent, Loader2, Edit2, DollarSign, MessageSquare, Sparkles, Wand2, PlusCircle, ExternalLink, CheckSquare, Gauge, Utensils, Construction } from 'lucide-react';
import { calculateANTT } from '../services/anttService';

interface TripManagerProps {
  trips: Trip[];
  vehicles: Vehicle[];
  onAddTrip: (trip: Omit<Trip, 'id'>) => Promise<void>;
  onUpdateTrip: (id: string, trip: Partial<Trip>) => Promise<void>;
  onUpdateStatus: (id: string, status: TripStatus, newVehicleKm?: number) => Promise<void>;
  onDeleteTrip: (id: string) => Promise<void>;
  isSaving?: boolean;
}

const BRAZILIAN_STATES = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

const getTodayLocal = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const TripManager: React.FC<TripManagerProps> = ({ trips, vehicles, onAddTrip, onUpdateTrip, onUpdateStatus, onDeleteTrip, isSaving }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isKmModalOpen, setIsKmModalOpen] = useState(false);
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{id: string, status: TripStatus, vehicleId?: string} | null>(null);
  const [newVehicleKm, setNewVehicleKm] = useState<number>(0);
  
  const [origin, setOrigin] = useState({ city: '', state: 'SP' });
  const [destination, setDestination] = useState({ city: '', state: 'SP' });
  const [stops, setStops] = useState<TripStop[]>([]);
  const [newStop, setNewStop] = useState({ city: '', state: 'SP' });

  // Campos de cálculo mantidos localmente para não quebrar o banco
  const [calcParams, setCalcParams] = useState({
    planned_toll_cost: 0,
    planned_daily_cost: 0,
    planned_extra_costs: 0,
    return_empty: false
  });

  const [formData, setFormData] = useState<any>({
    distance_km: 0,
    agreed_price: 0,
    driver_commission_percentage: 10,
    cargo_type: 'geral',
    date: getTodayLocal(),
    vehicle_id: '',
    status: TripStatus.SCHEDULED,
    notes: ''
  });

  const calculatedCommission = (formData.agreed_price || 0) * ((formData.driver_commission_percentage || 0) / 100);

  const handleStatusChange = (trip: Trip, newStatus: TripStatus) => {
    if (newStatus === TripStatus.COMPLETED && trip.vehicle_id) {
      const vehicle = vehicles.find(v => v.id === trip.vehicle_id);
      setNewVehicleKm(vehicle?.current_km || 0);
      setPendingStatusUpdate({ id: trip.id, status: newStatus, vehicleId: trip.vehicle_id });
      setIsKmModalOpen(true);
    } else {
      onUpdateStatus(trip.id, newStatus);
    }
  };

  const confirmKmUpdate = async () => {
    if (pendingStatusUpdate) {
      await onUpdateStatus(pendingStatusUpdate.id, pendingStatusUpdate.status, newVehicleKm);
      setIsKmModalOpen(false);
      setPendingStatusUpdate(null);
    }
  };

  const addStop = () => {
    if (!newStop.city) return;
    setStops([...stops, { ...newStop }]);
    setNewStop({ city: '', state: 'SP' });
  };

  const removeStop = (index: number) => {
    setStops(stops.filter((_, i) => i !== index));
  };

  const suggestANTTPrice = () => {
    if (!formData.vehicle_id || !formData.distance_km) {
      alert("Selecione um veículo e informe a distância primeiro.");
      return;
    }
    const vehicle = vehicles.find(v => v.id === formData.vehicle_id);
    if (!vehicle) return;

    const result = calculateANTT(
      formData.distance_km, 
      vehicle.axles || 5, 
      vehicle.cargo_type || 'geral',
      {
        toll: calcParams.planned_toll_cost,
        daily: calcParams.planned_daily_cost,
        other: calcParams.planned_extra_costs,
        returnEmpty: calcParams.return_empty
      }
    );
    setFormData({ ...formData, agreed_price: Math.ceil(result.total) });
  };

  const resetForm = () => {
    setEditingTripId(null);
    setStops([]);
    setOrigin({ city: '', state: 'SP' });
    setDestination({ city: '', state: 'SP' });
    setCalcParams({
      planned_toll_cost: 0,
      planned_daily_cost: 0,
      planned_extra_costs: 0,
      return_empty: false
    });
    setFormData({
      distance_km: 0,
      agreed_price: 0,
      driver_commission_percentage: 10,
      cargo_type: 'geral',
      date: getTodayLocal(),
      vehicle_id: '',
      status: TripStatus.SCHEDULED,
      notes: ''
    });
  };

  const handleEdit = (trip: Trip) => {
    setEditingTripId(trip.id);
    const [origCity, origState] = trip.origin.split(' - ');
    const [destCity, destState] = trip.destination.split(' - ');
    
    setOrigin({ city: origCity, state: origState || 'SP' });
    setDestination({ city: destCity, state: destState || 'SP' });
    setStops(trip.stops || []);
    
    // Tenta extrair dados de cálculo das notas se existirem
    setCalcParams({
      planned_toll_cost: trip.planned_toll_cost || 0,
      planned_daily_cost: trip.planned_daily_cost || 0,
      planned_extra_costs: trip.planned_extra_costs || 0,
      return_empty: trip.return_empty || false
    });

    setFormData({
      distance_km: trip.distance_km,
      agreed_price: trip.agreed_price,
      driver_commission_percentage: trip.driver_commission_percentage,
      cargo_type: trip.cargo_type,
      date: trip.date,
      vehicle_id: trip.vehicle_id || '',
      status: trip.status,
      notes: trip.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!origin.city || !destination.city || !formData.distance_km || !formData.agreed_price) {
      alert("Por favor, preencha os campos obrigatórios.");
      return;
    }

    // Geramos um log de cálculo para as observações para não perder a informação
    const calcLog = `[Calculado: Pedágio R$${calcParams.planned_toll_cost}, Diária R$${calcParams.planned_daily_cost}${calcParams.return_empty ? ', Retorno Vazio' : ''}]`;
    const finalNotes = formData.notes.includes('[Calculado:') 
      ? formData.notes.replace(/\[Calculado:.*?\]/, calcLog) 
      : `${formData.notes} ${calcLog}`.trim();

    // Payload limpo apenas com o que o banco aceita
    const payload = {
      origin: `${origin.city} - ${origin.state}`,
      destination: `${destination.city} - ${destination.state}`,
      distance_km: Number(formData.distance_km),
      agreed_price: Number(formData.agreed_price),
      driver_commission_percentage: Number(formData.driver_commission_percentage),
      driver_commission: Number(calculatedCommission),
      cargo_type: formData.cargo_type,
      date: formData.date,
      vehicle_id: formData.vehicle_id,
      status: formData.status,
      notes: finalNotes,
      stops: stops
    };

    if (editingTripId) {
      await onUpdateTrip(editingTripId, payload);
    } else {
      await onAddTrip(payload);
    }
    
    setIsModalOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-2">
        <h2 className="text-2xl font-black text-slate-900">Minhas Viagens</h2>
        <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-primary-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold shadow-lg active:scale-95 transition-all">
          <Plus size={20} /> Nova Viagem
        </button>
      </div>

      <div className="grid gap-4 px-2">
        {trips.map(trip => (
          <div key={trip.id} className="bg-white p-6 rounded-[2rem] border shadow-sm relative group animate-fade-in hover:border-primary-200 transition-colors">
            <div className="flex flex-col md:flex-row justify-between gap-6">
               <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <select 
                      value={trip.status} 
                      onChange={(e) => handleStatusChange(trip, e.target.value as TripStatus)}
                      className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border-none cursor-pointer focus:ring-2 focus:ring-primary-500 ${
                        trip.status === TripStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700' : 
                        trip.status === TripStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' :
                        trip.status === TripStatus.CANCELLED ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {Object.values(TripStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <span className="text-sm font-bold text-slate-400 flex items-center gap-1">
                      <Calendar size={14} /> {formatDateDisplay(trip.date)}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 flex-wrap">
                    <MapPin className="text-primary-500" size={20}/> {trip.origin} 
                    <ChevronRight size={16} className="text-slate-300"/> 
                    {trip.destination}
                  </h3>
                  <div className="mt-4 flex flex-wrap gap-2 items-center">
                    <div className="bg-slate-50 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 text-slate-600"><Navigation size={14}/> {trip.distance_km} KM</div>
                    <div className="bg-amber-50 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 text-amber-700">
                      <Percent size={14}/> {trip.driver_commission_percentage}% (R$ {trip.driver_commission?.toLocaleString()})
                    </div>
                  </div>
               </div>
               <div className="md:text-right border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-8 flex flex-col justify-center min-w-[150px]">
                  <p className="text-xs font-black text-slate-400 uppercase mb-1">Valor Frete</p>
                  <p className="text-2xl font-black text-primary-600">R$ {trip.agreed_price.toLocaleString()}</p>
               </div>
            </div>
            
            <div className="absolute top-4 right-4 flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleEdit(trip)} className="p-2 text-slate-400 hover:text-primary-600 transition-colors">
                <Edit2 size={18}/>
              </button>
              <button onClick={() => onDeleteTrip(trip.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                <Trash2 size={18}/>
              </button>
            </div>
          </div>
        ))}
      </div>

      {isKmModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 animate-fade-in text-center">
            <div className="bg-emerald-100 text-emerald-600 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Gauge size={32} />
            </div>
            <h3 className="text-xl font-black mb-2">Viagem Concluída!</h3>
            <p className="text-slate-500 text-sm font-bold mb-6">Informe o KM atual do veículo:</p>
            <div className="space-y-4">
              <input 
                type="number" 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-3xl text-center outline-none"
                value={newVehicleKm}
                onChange={e => setNewVehicleKm(Number(e.target.value))}
              />
              <button onClick={confirmKmUpdate} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-lg">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl animate-fade-in relative mt-16 mb-10 overflow-hidden">
            <div className="flex justify-between items-center p-8 pb-4 border-b">
              <h3 className="text-2xl font-black">{editingTripId ? 'Editar Viagem' : 'Nova Viagem'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400"><X size={28} /></button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Origem" className="p-4 bg-slate-50 rounded-2xl border font-bold" value={origin.city} onChange={e => setOrigin({...origin, city: e.target.value})} />
                <input placeholder="Destino" className="p-4 bg-slate-50 rounded-2xl border font-bold" value={destination.city} onChange={e => setDestination({...destination, city: e.target.value})} />
              </div>

              {/* Custos Operacionais locais para Cálculo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-[2rem] border">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Pedágio Estimado</label>
                  <input type="number" className="w-full p-4 bg-white border rounded-2xl font-bold" value={calcParams.planned_toll_cost || ''} onChange={e => setCalcParams({...calcParams, planned_toll_cost: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Diárias Estimadas</label>
                  <input type="number" className="w-full p-4 bg-white border rounded-2xl font-bold" value={calcParams.planned_daily_cost || ''} onChange={e => setCalcParams({...calcParams, planned_daily_cost: Number(e.target.value)})} />
                </div>
                <div className="space-y-1 pt-4">
                   <button 
                      type="button"
                      onClick={() => setCalcParams({...calcParams, return_empty: !calcParams.return_empty})}
                      className={`w-full py-3 rounded-2xl font-black text-xs ${calcParams.return_empty ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}
                    >
                      {calcParams.return_empty ? 'COM RETORNO VAZIO' : 'SEM RETORNO VAZIO'}
                   </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <select className="p-4 bg-slate-50 rounded-2xl border font-bold" value={formData.vehicle_id} onChange={e => setFormData({...formData, vehicle_id: e.target.value})}>
                  <option value="">Selecione o veículo...</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} ({v.axles} eixos)</option>)}
                </select>
                <input type="number" placeholder="KM Total" className="p-4 bg-slate-50 rounded-2xl border font-black" value={formData.distance_km || ''} onChange={e => setFormData({...formData, distance_km: Number(e.target.value)})} />
              </div>

              <div className="bg-slate-900 p-6 rounded-[2rem] text-white">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-xs font-black uppercase text-slate-400">Preço do Frete</label>
                  <button onClick={suggestANTTPrice} className="text-xs font-black text-emerald-400 bg-emerald-900/40 px-3 py-1 rounded-lg flex items-center gap-2">
                    <Sparkles size={14}/> Calcular c/ ANTT
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" className="p-4 bg-slate-800 rounded-2xl border border-slate-700 font-black text-xl text-primary-400" value={formData.agreed_price || ''} onChange={e => setFormData({...formData, agreed_price: Number(e.target.value)})} />
                  <input type="number" placeholder="Comissão %" className="p-4 bg-slate-800 rounded-2xl border border-slate-700 font-black text-xl text-amber-400" value={formData.driver_commission_percentage} onChange={e => setFormData({...formData, driver_commission_percentage: Number(e.target.value)})} />
                </div>
              </div>

              <textarea placeholder="Observações..." className="w-full p-4 bg-slate-50 rounded-2xl border font-bold" rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />

              <button disabled={isSaving} onClick={handleSave} className="w-full py-5 bg-primary-600 text-white rounded-2xl font-black text-xl shadow-xl flex items-center justify-center gap-3">
                 {isSaving ? <Loader2 className="animate-spin"/> : <CheckSquare/>} Salvar Viagem
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
