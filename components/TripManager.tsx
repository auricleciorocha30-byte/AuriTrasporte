
import React, { useState, useEffect, useMemo } from 'react';
import { Trip, TripStatus, Vehicle, TripStop } from '../types';
import { Plus, MapPin, Calendar, Truck, UserCheck, Navigation, X, Trash2, Map as MapIcon, ChevronRight, Percent, Loader2, Edit2, DollarSign, MessageSquare, Sparkles, Wand2, PlusCircle, ExternalLink, CheckSquare, Gauge, Utensils, Construction, MapPinPlus, ShieldCheck, ChevronDown, AlignLeft, CheckCircle2 } from 'lucide-react';
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

  // Ordenar viagens: mais recentes no topo usando timestamp para comparação segura
  const sortedTrips = useMemo(() => {
    return [...trips].sort((a, b) => {
      const dateA = new Date(a.date + 'T12:00:00').getTime();
      const dateB = new Date(b.date + 'T12:00:00').getTime();
      return dateB - dateA;
    });
  }, [trips]);

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
    if (!pendingStatusUpdate) return;
    await onUpdateStatus(pendingStatusUpdate.id, pendingStatusUpdate.status, newVehicleKm);
    setIsKmModalOpen(false);
    setPendingStatusUpdate(null);
  };

  const addStop = () => {
    if (!newStop.city) return;
    setStops([...stops, { ...newStop }]);
    setNewStop({ city: '', state: 'SP' });
  };

  const removeStop = (index: number) => {
    setStops(stops.filter((_, i) => i !== index));
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
      stops: stops
    };
    if (editingTripId) { await onUpdateTrip(editingTripId, payload); }
    else { await onAddTrip(payload); }
    setIsModalOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      <div className="flex justify-between items-center px-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Minhas Viagens</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Controle de rotas e ganhos</p>
        </div>
        <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-primary-600 text-white px-8 py-5 rounded-[2rem] flex items-center gap-2 font-black uppercase text-xs shadow-xl shadow-primary-200 active:scale-95 transition-all">
          <Plus size={20} /> Lançar Nova
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
        {sortedTrips.map(trip => {
          const vehicle = vehicles.find(v => v.id === trip.vehicle_id);
          return (
            <div key={trip.id} className="bg-white p-8 rounded-[3rem] border border-slate-50 shadow-sm relative group animate-fade-in hover:border-primary-500 transition-all">
              <div className="flex flex-col gap-6">
                 <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <select 
                        value={trip.status} 
                        onChange={(e) => handleStatusChange(trip, e.target.value as TripStatus)}
                        className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-full border-none cursor-pointer focus:ring-2 focus:ring-primary-500 ${
                          trip.status === TripStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700' : 
                          trip.status === TripStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' :
                          trip.status === TripStatus.CANCELLED ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {Object.values(TripStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <span className="text-[10px] font-black text-slate-400 flex items-center gap-1 uppercase">
                        <Calendar size={12} /> {formatDateDisplay(trip.date)}
                      </span>
                    </div>
                    
                    <div className="space-y-1 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                        <h3 className="text-lg font-black text-slate-800 tracking-tighter truncate uppercase">{trip.origin}</h3>
                      </div>
                      <div className="ml-1 w-px h-4 bg-slate-100"></div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                        <h3 className="text-lg font-black text-slate-800 tracking-tighter truncate uppercase">{trip.destination}</h3>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-6">
                      <Truck size={14} className="text-slate-400" />
                      <span className="text-[10px] font-black uppercase bg-slate-50 text-slate-500 px-3 py-1 rounded-lg">
                        {vehicle ? `${vehicle.plate} • ${vehicle.model}` : 'Sem veículo'}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-2xl">
                          <p className="text-[9px] font-black text-slate-400 uppercase">Distância</p>
                          <p className="text-lg font-black text-slate-800">{trip.distance_km} KM</p>
                        </div>
                        <div className="bg-primary-50 p-4 rounded-2xl">
                          <p className="text-[9px] font-black text-primary-400 uppercase">Valor Frete</p>
                          <p className="text-lg font-black text-primary-700">R$ {trip.agreed_price.toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100/50">
                        <p className="text-[9px] font-black text-amber-600 uppercase flex items-center gap-1">
                          <Percent size={10} /> Comissão ({trip.driver_commission_percentage}%)
                        </p>
                        <p className="text-xl font-black text-amber-700">R$ {trip.driver_commission.toLocaleString()}</p>
                      </div>
                    </div>

                    {trip.notes && (
                      <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                         <p className="text-[9px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1"><AlignLeft size={10}/> Notas</p>
                         <p className="text-xs text-slate-600 font-medium line-clamp-2 italic">{trip.notes}</p>
                      </div>
                    )}
                 </div>
              </div>

              <div className="mt-6 flex gap-2">
                <button onClick={() => window.open(getMapsUrl(trip.origin, trip.destination, trip.stops), '_blank')} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-black transition-all">
                  <MapIcon size={14}/> Ver Rota
                </button>
              </div>

              <div className="absolute top-6 right-6 flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(trip)} className="p-3 bg-white shadow-md rounded-full text-slate-400 hover:text-primary-600 transition-colors"><Edit2 size={16}/></button>
                <button onClick={() => { if(confirm('Excluir?')) onDeleteTrip(trip.id) }} className="p-3 bg-white shadow-md rounded-full text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL PRINCIPAL DE VIAGEM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-6 z-[100] animate-fade-in" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="bg-white w-full max-w-2xl rounded-t-[4rem] md:rounded-[3rem] shadow-2xl animate-slide-up relative h-[92vh] md:h-auto overflow-y-auto pb-10">
            <div className="flex justify-between items-center p-6 md:p-10 pb-4">
              <div>
                <span className="text-xs font-black uppercase text-primary-600 tracking-widest">Viagem & Rota</span>
                <h3 className="text-3xl font-black uppercase tracking-tighter mt-1 leading-none">{editingTripId ? 'Alterar Viagem' : 'Novo Lançamento'}</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="bg-slate-100 p-4 md:p-5 rounded-full text-slate-400 hover:text-slate-900 transition-all"><X size={28} /></button>
            </div>

            <div className="p-5 md:p-10 space-y-8">
              <div className="space-y-4 bg-slate-50 p-4 md:p-8 rounded-[3rem] border border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Origem (Cidade/UF)</label>
                    <div className="flex gap-2">
                      <input placeholder="Cidade" className="flex-1 p-4 md:p-5 bg-white rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-primary-500" value={origin.city} onChange={e => setOrigin({...origin, city: e.target.value})} />
                      <select className="w-20 md:w-24 p-4 md:p-5 bg-white rounded-2xl border-none font-bold outline-none" value={origin.state} onChange={e => setOrigin({...origin, state: e.target.value})}>
                        {BRAZILIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Destino (Cidade/UF)</label>
                    <div className="flex gap-2">
                      <input placeholder="Cidade" className="flex-1 p-4 md:p-5 bg-white rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-primary-500" value={destination.city} onChange={e => setDestination({...destination, city: e.target.value})} />
                      <select className="w-20 md:w-24 p-4 md:p-5 bg-white rounded-2xl border-none font-bold outline-none" value={destination.state} onChange={e => setDestination({...destination, state: e.target.value})}>
                        {BRAZILIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-200">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2 mb-3">
                    <MapPinPlus size={14}/> Paradas / Escalas (Opcional)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {stops.map((stop, idx) => (
                      <div key={idx} className="bg-white px-3 py-2 rounded-xl flex items-center gap-2 border border-slate-200 animate-fade-in shadow-sm">
                        <span className="text-[10px] font-bold text-slate-700">{stop.city} - {stop.state}</span>
                        <button onClick={() => removeStop(idx)} className="text-rose-400 hover:text-rose-600"><X size={14}/></button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-1 md:gap-2">
                    <input placeholder="Cidade parada" className="flex-1 p-4 bg-white rounded-2xl border-none text-sm font-bold outline-none" value={newStop.city} onChange={e => setNewStop({...newStop, city: e.target.value})} />
                    <select className="w-16 md:w-20 p-4 bg-white rounded-2xl border-none font-bold outline-none" value={newStop.state} onChange={e => setNewStop({...newStop, state: e.target.value})}>
                      {BRAZILIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={addStop} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all shrink-0">
                      <Plus size={20}/>
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2">
                  <Truck size={14} className="text-primary-500"/> Associar Veículo para Viagem
                </label>
                <div className="relative">
                  <select 
                    className="w-full p-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-primary-500 font-bold appearance-none outline-none transition-all"
                    value={formData.vehicle_id}
                    onChange={e => setFormData({...formData, vehicle_id: e.target.value})}
                  >
                    <option value="">Selecione um Veículo</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Data Viagem</label>
                  <input type="date" className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Distância KM</label>
                  <input type="number" className="w-full p-5 bg-slate-50 rounded-2xl font-black text-2xl outline-none" value={formData.distance_km || ''} onChange={e => setFormData({...formData, distance_km: e.target.value === '' ? 0 : Number(e.target.value)})} />
                </div>
              </div>

              <div className="bg-slate-950 p-6 md:p-10 rounded-[3rem] text-white space-y-6">
                <div className="flex justify-between items-center">
                   <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Valores e Comissões</span>
                   <button onClick={suggestANTTPrice} className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-xl hover:bg-emerald-500/20 transition-all uppercase">Simular ANTT</button>
                </div>
                <div className="grid grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase text-slate-600">Frete Negociado</p>
                    <input type="number" className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl font-black text-2xl text-primary-400 outline-none" value={formData.agreed_price || ''} onChange={e => setFormData({...formData, agreed_price: e.target.value === '' ? 0 : Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase text-slate-600">Comissão %</p>
                    <input type="number" className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl font-black text-2xl text-amber-400 outline-none" value={formData.driver_commission_percentage || ''} onChange={e => setFormData({...formData, driver_commission_percentage: e.target.value === '' ? 0 : Number(e.target.value)})} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1"><AlignLeft size={14}/> Observações</label>
                <textarea 
                  placeholder="Detalhes da carga, local de descarga, contatos..." 
                  rows={3}
                  className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-primary-500 rounded-3xl font-bold outline-none transition-all resize-none" 
                  value={formData.notes} 
                  onChange={e => setFormData({...formData, notes: e.target.value})} 
                />
              </div>

              <div className="flex flex-col gap-4">
                <button onClick={previewCurrentRoute} className="w-full py-5 bg-slate-100 text-slate-700 rounded-[2rem] font-black text-xs uppercase flex items-center justify-center gap-3 hover:bg-slate-200 transition-all">
                  <MapIcon size={20}/> Visualizar Trajeto no Google Maps
                </button>
                <button disabled={isSaving} onClick={handleSave} className="w-full py-8 bg-primary-600 text-white rounded-[2.5rem] font-black text-2xl shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all">
                  {isSaving ? <Loader2 className="animate-spin" /> : <ShieldCheck size={32}/>}
                  {isSaving ? 'Salvando...' : 'Confirmar Viagem'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {isKmModalOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-6 z-[120] animate-fade-in">
          <div className="bg-white rounded-[3.5rem] w-full max-w-md p-10 md:p-12 shadow-2xl text-center">
            <div className="bg-emerald-100 text-emerald-600 p-8 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 size={48} />
            </div>
            
            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4 leading-none">Concluir Viagem</h3>
            <p className="text-slate-500 font-bold text-sm mb-10">Para finalizar, atualize o odômetro (KM) final do veículo associado.</p>
            
            <div className="space-y-6 mb-12">
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Odômetro Final (KM)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    className="w-full p-6 bg-slate-50 border-2 border-emerald-500/20 rounded-3xl font-black text-3xl text-slate-900 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                    value={newVehicleKm || ''}
                    onChange={(e) => setNewVehicleKm(e.target.value === '' ? 0 : Number(e.target.value))}
                  />
                  <Gauge className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-200" size={32} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => { setIsKmModalOpen(false); setPendingStatusUpdate(null); }} 
                className="py-5 bg-slate-100 text-slate-600 rounded-3xl font-black uppercase text-xs hover:bg-slate-200 transition-all"
              >
                Voltar
              </button>
              <button 
                onClick={confirmKmUpdate} 
                className="py-5 bg-emerald-600 text-white rounded-3xl font-black uppercase text-xs shadow-2xl shadow-emerald-200 hover:bg-emerald-700 transition-all"
              >
                Salvar e Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
