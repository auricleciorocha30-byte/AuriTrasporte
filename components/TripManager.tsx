
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
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
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

  const getMapsUrl = (originText: string, destText: string, tripStops: TripStop[] = []) => {
    if (!originText || !destText) return "";
    const originStr = `${originText}, Brasil`.replace(' - ', ', ');
    const destStr = `${destText}, Brasil`.replace(' - ', ', ');
    let url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originStr)}&destination=${encodeURIComponent(destStr)}&travelmode=driving`;
    if (tripStops.length > 0) {
      const waypointsStr = tripStops.map(s => `${s.city}, ${s.state}, Brasil`).join('|');
      url += `&waypoints=${encodeURIComponent(waypointsStr)}`;
    }
    return url;
  };

  const previewCurrentRoute = () => {
    if (!origin.city || !destination.city) {
      alert("Informe ao menos a cidade de origem e destino para ver a rota.");
      return;
    }
    const url = getMapsUrl(`${origin.city} - ${origin.state}`, `${destination.city} - ${destination.state}`, stops);
    window.open(url, '_blank');
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
    const originParts = trip.origin.split(' - ');
    const destParts = trip.destination.split(' - ');
    
    setOrigin({ city: originParts[0], state: originParts[1] || 'SP' });
    setDestination({ city: destParts[0], state: destParts[1] || 'SP' });
    setStops(trip.stops || []);
    
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
      alert("Preencha campos obrigatórios.");
      return;
    }

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
      notes: formData.notes.trim(),
      stops: stops,
      planned_toll_cost: Number(calcParams.planned_toll_cost),
      planned_daily_cost: Number(calcParams.planned_daily_cost),
      planned_extra_costs: Number(calcParams.planned_extra_costs),
      return_empty: calcParams.return_empty
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
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center px-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Minhas Viagens</h2>
          <p className="text-slate-400 font-bold text-[10px] uppercase">Controle de rotas e comissões</p>
        </div>
        <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-primary-600 text-white px-6 py-4 rounded-2xl flex items-center gap-2 font-black uppercase text-xs shadow-xl shadow-primary-200 active:scale-95 transition-all">
          <Plus size={18} /> Nova
        </button>
      </div>

      <div className="grid gap-4 px-4">
        {trips.map(trip => {
          const vehicle = vehicles.find(v => v.id === trip.vehicle_id);
          return (
            <div key={trip.id} className="bg-white p-6 rounded-[2rem] border shadow-sm relative group animate-fade-in hover:border-primary-200 transition-colors">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                 <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <select 
                        value={trip.status} 
                        onChange={(e) => handleStatusChange(trip, e.target.value as TripStatus)}
                        className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border-none cursor-pointer focus:ring-2 focus:ring-primary-500 ${
                          trip.status === TripStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700' : 
                          trip.status === TripStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' :
                          trip.status === TripStatus.CANCELLED ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {Object.values(TripStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase">
                        <Calendar size={12} /> {formatDateDisplay(trip.date)}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 flex-wrap mb-1 tracking-tighter">
                      <MapPin className="text-primary-500" size={18}/> {trip.origin} 
                      <ChevronRight size={14} className="text-slate-300"/> 
                      {trip.destination}
                    </h3>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <Truck size={14} className="text-slate-400" />
                      <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        {vehicle ? `${vehicle.plate} • ${vehicle.model}` : 'Sem veículo'}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 items-center">
                      <div className="bg-slate-50 px-3 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 text-slate-600"><Navigation size={14}/> {trip.distance_km} KM</div>
                      <div className="bg-amber-50 px-3 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 text-amber-700">
                        <Percent size={14}/> {trip.driver_commission_percentage}%
                      </div>
                      <button onClick={() => window.open(getMapsUrl(trip.origin, trip.destination, trip.stops), '_blank')} className="bg-primary-50 px-3 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 text-primary-600">
                        <MapIcon size={14}/> Rota
                      </button>
                    </div>
                 </div>
                 <div className="md:text-right border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-8 flex flex-col justify-center min-w-[150px]">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Valor Frete</p>
                    <p className="text-2xl font-black text-primary-600">R$ {trip.agreed_price.toLocaleString()}</p>
                 </div>
              </div>
              <div className="absolute top-4 right-4 flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(trip)} className="p-2 text-slate-300 hover:text-primary-600 transition-colors"><Edit2 size={16}/></button>
                <button onClick={() => onDeleteTrip(trip.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4 z-[100] overflow-y-auto" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="bg-white w-full max-w-2xl rounded-t-[3rem] md:rounded-[3rem] shadow-2xl animate-fade-in relative h-[90vh] md:h-auto overflow-y-auto pb-20">
            <div className="flex justify-between items-center p-8 pb-4 border-b">
              <h3 className="text-2xl font-black uppercase tracking-tighter">{editingTripId ? 'Alterar Viagem' : 'Lançar Viagem'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 p-2"><X size={28} /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-4 bg-slate-50 p-6 rounded-[2.5rem] border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Origem (Cidade/UF)</label>
                    <div className="flex gap-2">
                      <input placeholder="Cidade" className="flex-1 p-4 bg-white rounded-2xl border font-bold" value={origin.city} onChange={e => setOrigin({...origin, city: e.target.value})} />
                      <select className="w-20 p-4 bg-white rounded-2xl border font-bold" value={origin.state} onChange={e => setOrigin({...origin, state: e.target.value})}>
                        {BRAZILIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Destino (Cidade/UF)</label>
                    <div className="flex gap-2">
                      <input placeholder="Cidade" className="flex-1 p-4 bg-white rounded-2xl border font-bold" value={destination.city} onChange={e => setDestination({...destination, city: e.target.value})} />
                      <select className="w-20 p-4 bg-white rounded-2xl border font-bold" value={destination.state} onChange={e => setDestination({...destination, state: e.target.value})}>
                        {BRAZILIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Data Viagem</label>
                  <input type="date" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Distância KM</label>
                  <input type="number" className="w-full p-4 bg-slate-50 border rounded-2xl font-black" value={formData.distance_km || ''} onChange={e => setFormData({...formData, distance_km: Number(e.target.value)})} />
                </div>
              </div>

              <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase text-slate-400">Preço e Comissão</label>
                  <button onClick={suggestANTTPrice} className="text-[10px] font-black text-emerald-400 bg-emerald-950 px-3 py-1 rounded-lg">Cálculo ANTT</button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[8px] uppercase font-black text-slate-500">Valor Frete</span>
                    <input type="number" className="w-full p-4 bg-slate-800 rounded-2xl border border-slate-700 font-black text-xl text-primary-400" value={formData.agreed_price || ''} onChange={e => setFormData({...formData, agreed_price: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] uppercase font-black text-slate-500">Comissão %</span>
                    <input type="number" className="w-full p-4 bg-slate-800 rounded-2xl border border-slate-700 font-black text-xl text-amber-400" value={formData.driver_commission_percentage} onChange={e => setFormData({...formData, driver_commission_percentage: Number(e.target.value)})} />
                  </div>
                </div>
              </div>

              <button disabled={isSaving} onClick={handleSave} className="w-full py-6 bg-primary-600 text-white rounded-[2rem] font-black text-xl shadow-xl flex items-center justify-center gap-3">
                 {isSaving ? <Loader2 className="animate-spin"/> : <CheckSquare/>} Salvar Viagem
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
