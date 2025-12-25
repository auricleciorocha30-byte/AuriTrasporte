
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

  const [formData, setFormData] = useState<any>({
    distance_km: 0,
    agreed_price: 0,
    driver_commission_percentage: 10,
    cargo_type: 'geral',
    date: getTodayLocal(),
    vehicle_id: '',
    status: TripStatus.SCHEDULED,
    notes: '',
    planned_toll_cost: 0,
    planned_daily_cost: 0,
    planned_extra_costs: 0,
    return_empty: false
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

    // Sincronizado com os parâmetros extras
    const result = calculateANTT(
      formData.distance_km, 
      vehicle.axles || 5, 
      vehicle.cargo_type || 'geral',
      {
        toll: formData.planned_toll_cost,
        daily: formData.planned_daily_cost,
        other: formData.planned_extra_costs,
        returnEmpty: formData.return_empty
      }
    );
    setFormData({ ...formData, agreed_price: Math.ceil(result.total) });
  };

  const getMapsUrl = (originText: string, destText: string, tripStops: TripStop[] = []) => {
    const originStr = `${originText}, Brasil`.replace(' - ', ', ');
    const destStr = `${destText}, Brasil`.replace(' - ', ', ');
    let url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originStr)}&destination=${encodeURIComponent(destStr)}&travelmode=driving`;
    if (tripStops.length > 0) {
      const waypointsStr = tripStops.map(s => `${s.city}, ${s.state}, Brasil`).join('|');
      url += `&waypoints=${encodeURIComponent(waypointsStr)}`;
    }
    return url;
  };

  const resetForm = () => {
    setEditingTripId(null);
    setStops([]);
    setOrigin({ city: '', state: 'SP' });
    setDestination({ city: '', state: 'SP' });
    setFormData({
      distance_km: 0,
      agreed_price: 0,
      driver_commission_percentage: 10,
      cargo_type: 'geral',
      date: getTodayLocal(),
      vehicle_id: '',
      status: TripStatus.SCHEDULED,
      notes: '',
      planned_toll_cost: 0,
      planned_daily_cost: 0,
      planned_extra_costs: 0,
      return_empty: false
    });
  };

  const handleEdit = (trip: Trip) => {
    setEditingTripId(trip.id);
    const [origCity, origState] = trip.origin.split(' - ');
    const [destCity, destState] = trip.destination.split(' - ');
    
    setOrigin({ city: origCity, state: origState || 'SP' });
    setDestination({ city: destCity, state: destState || 'SP' });
    setStops(trip.stops || []);
    setFormData({
      distance_km: trip.distance_km,
      agreed_price: trip.agreed_price,
      driver_commission_percentage: trip.driver_commission_percentage,
      cargo_type: trip.cargo_type,
      date: trip.date,
      vehicle_id: trip.vehicle_id || '',
      status: trip.status,
      notes: trip.notes || '',
      planned_toll_cost: trip.planned_toll_cost || 0,
      planned_daily_cost: trip.planned_daily_cost || 0,
      planned_extra_costs: trip.planned_extra_costs || 0,
      return_empty: trip.return_empty || false
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!origin.city || !destination.city || !formData.distance_km || !formData.agreed_price) {
      alert("Por favor, preencha os campos obrigatórios.");
      return;
    }

    const payload = {
      ...formData,
      origin: `${origin.city} - ${origin.state}`,
      destination: `${destination.city} - ${destination.state}`,
      stops: stops,
      driver_commission: calculatedCommission
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
                  {trip.stops && trip.stops.length > 0 && (
                    <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 shrink-0">Paradas:</span>
                      {trip.stops.map((s, idx) => (
                        <div key={idx} className="bg-slate-100 px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 whitespace-nowrap">
                          {s.city}/{s.state}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2 items-center">
                    <div className="bg-slate-50 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 text-slate-600"><Navigation size={14}/> {trip.distance_km} KM</div>
                    <div className="bg-amber-50 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 text-amber-700">
                      <Percent size={14}/> {trip.driver_commission_percentage}% (R$ {trip.driver_commission?.toLocaleString()})
                    </div>
                    <button 
                      onClick={() => window.open(getMapsUrl(trip.origin, trip.destination, trip.stops), '_blank')}
                      className="bg-primary-50 px-3 py-2 rounded-xl text-xs font-black flex items-center gap-2 text-primary-600 hover:bg-primary-100 transition-colors"
                    >
                      <MapIcon size={14}/> Ver Rota
                    </button>
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

      {/* Modal para Atualizar KM do Veículo */}
      {isKmModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 animate-fade-in text-center">
            <div className="bg-emerald-100 text-emerald-600 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Gauge size={32} />
            </div>
            <h3 className="text-xl font-black mb-2">Viagem Concluída!</h3>
            <p className="text-slate-500 text-sm font-bold mb-6">Informe o KM atual do veículo para atualizar o sistema:</p>
            
            <div className="space-y-4">
              <input 
                type="number" 
                autoFocus
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-3xl text-center outline-none focus:ring-4 focus:ring-emerald-500/20"
                value={newVehicleKm}
                onChange={e => setNewVehicleKm(Number(e.target.value))}
              />
              <button 
                onClick={confirmKmUpdate}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all"
              >
                Confirmar e Salvar
              </button>
              <button 
                onClick={() => setIsKmModalOpen(false)}
                className="w-full text-slate-400 font-bold text-sm"
              >
                Pular atualização de KM
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl animate-fade-in relative mt-16 mb-10 overflow-hidden">
            <div className="flex justify-between items-center p-8 pb-4 border-b border-slate-50">
              <h3 className="text-2xl font-black">{editingTripId ? 'Editar Viagem' : 'Nova Viagem'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2"><X size={28} /></button>
            </div>
            
            <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {/* Rota - Origem e Destino */}
              <div className="space-y-4 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Origem (Cidade e UF)</label>
                    <div className="flex gap-2">
                      <input placeholder="Ex: Santos" className="flex-1 p-4 bg-white rounded-2xl border border-slate-200 font-bold focus:ring-2 focus:ring-primary-500 outline-none" value={origin.city} onChange={e => setOrigin({...origin, city: e.target.value})} />
                      <select className="w-20 p-4 bg-white rounded-2xl border border-slate-200 font-bold" value={origin.state} onChange={e => setOrigin({...origin, state: e.target.value})}>
                        {BRAZILIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Destino (Cidade e UF)</label>
                    <div className="flex gap-2">
                      <input placeholder="Ex: Cuiabá" className="flex-1 p-4 bg-white rounded-2xl border border-slate-200 font-bold focus:ring-2 focus:ring-primary-500 outline-none" value={destination.city} onChange={e => setDestination({...destination, city: e.target.value})} />
                      <select className="w-20 p-4 bg-white rounded-2xl border border-slate-200 font-bold" value={destination.state} onChange={e => setDestination({...destination, state: e.target.value})}>
                        {BRAZILIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Paradas Intermediárias</label>
                  </div>
                  
                  {stops.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {stops.map((stop, i) => (
                        <div key={i} className="bg-primary-50 text-primary-700 px-3 py-2 rounded-xl text-xs font-black flex items-center gap-2 animate-fade-in">
                          <MapPin size={12}/> {stop.city}/{stop.state}
                          <button onClick={() => removeStop(i)} className="hover:text-rose-500 transition-colors"><X size={14}/></button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input 
                      placeholder="Cidade da parada" 
                      className="flex-1 p-3 bg-white rounded-xl border border-slate-200 text-sm font-bold outline-none" 
                      value={newStop.city} 
                      onChange={e => setNewStop({...newStop, city: e.target.value})}
                      onKeyPress={e => e.key === 'Enter' && addStop()}
                    />
                    <select className="w-16 p-3 bg-white rounded-xl border border-slate-200 text-xs font-bold" value={newStop.state} onChange={e => setNewStop({...newStop, state: e.target.value})}>
                      {BRAZILIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={addStop} className="p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all"><PlusCircle size={20}/></button>
                  </div>
                </div>
              </div>

              {/* Custos Operacionais Previstos (Novos campos adicionados aqui) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1"><Construction size={12}/> Pedágio (R$)</label>
                  <input type="number" className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold outline-none" value={formData.planned_toll_cost || ''} onChange={e => setFormData({...formData, planned_toll_cost: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1"><Utensils size={12}/> Diárias/Ref. (R$)</label>
                  <input type="number" className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold outline-none" value={formData.planned_daily_cost || ''} onChange={e => setFormData({...formData, planned_daily_cost: Number(e.target.value)})} />
                </div>
                <div className="space-y-1 flex flex-col justify-center pt-2">
                   <span className="text-[10px] font-black uppercase text-slate-400 ml-1 mb-2">Retorno Vazio?</span>
                   <button 
                      type="button"
                      onClick={() => setFormData({...formData, return_empty: !formData.return_empty})}
                      className={`w-full py-3 rounded-2xl font-black text-xs transition-all ${formData.return_empty ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}
                    >
                      {formData.return_empty ? 'SIM' : 'NÃO'}
                   </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Veículo Utilizado</label>
                  <select className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold" value={formData.vehicle_id} onChange={e => setFormData({...formData, vehicle_id: e.target.value})}>
                    <option value="">Selecione o caminhão...</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} - {v.model} ({v.axles} Eixos)</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Distância (KM)</label>
                  <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 font-black text-xl" value={formData.distance_km || ''} onChange={e => setFormData({...formData, distance_km: Number(e.target.value)})} />
                </div>
              </div>

              <div className="bg-slate-900 p-6 rounded-[2rem] text-white space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Valor Bruto do Frete (Agreed)</label>
                      {formData.vehicle_id && formData.distance_km > 0 && (
                        <button onClick={suggestANTTPrice} className="text-[10px] font-black text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-900/40 px-2 py-1 rounded-lg">
                          <Sparkles size={10}/> Sugerir Cálculo ANTT
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-4 text-slate-400 font-black">R$</span>
                      <input type="number" className="w-full p-4 pl-12 bg-slate-800 rounded-2xl border border-slate-700 font-black text-xl text-primary-400 outline-none" value={formData.agreed_price || ''} onChange={e => setFormData({...formData, agreed_price: Number(e.target.value)})} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Comissão do Motorista (%)</label>
                    <div className="relative">
                      <span className="absolute right-4 top-4 text-slate-400 font-black">%</span>
                      <input type="number" className="w-full p-4 pr-12 bg-slate-800 rounded-2xl border border-slate-700 font-black text-xl text-amber-400 outline-none" value={formData.driver_commission_percentage} onChange={e => setFormData({...formData, driver_commission_percentage: Number(e.target.value)})} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Data da Viagem</label>
                  <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1"><MessageSquare size={14}/> Observações Gerais</label>
                  <textarea className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold outline-none" rows={1} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                </div>
              </div>

              <button disabled={isSaving} onClick={handleSave} className="w-full py-5 bg-primary-600 text-white rounded-[1.5rem] font-black text-xl shadow-xl hover:bg-primary-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                 {isSaving ? <Loader2 className="animate-spin"/> : <CheckSquare/>} {editingTripId ? 'Atualizar Viagem' : 'Salvar Viagem'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
