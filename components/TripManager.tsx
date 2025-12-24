
import React, { useState, useEffect } from 'react';
import { Trip, TripStatus, Vehicle, TripStop } from '../types';
import { Plus, MapPin, Calendar, Truck, UserCheck, Navigation, X, Trash2, Map as MapIcon, ChevronRight, Percent, Loader2, Edit2, DollarSign } from 'lucide-react';

interface TripManagerProps {
  trips: Trip[];
  vehicles: Vehicle[];
  onAddTrip: (trip: Omit<Trip, 'id'>) => void;
  onUpdateTrip: (id: string, trip: Partial<Trip>) => void;
  onUpdateStatus: (id: string, status: TripStatus) => void;
  onDeleteTrip: (id: string) => void;
  isSaving?: boolean;
}

const BRAZILIAN_STATES = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

// Função auxiliar para formatar data sem erro de fuso horário (ignora UTC)
const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

// Função para pegar a data de hoje no formato YYYY-MM-DD local
const getTodayLocal = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const TripManager: React.FC<TripManagerProps> = ({ trips, vehicles, onAddTrip, onUpdateTrip, onUpdateStatus, onDeleteTrip, isSaving }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  
  const [origin, setOrigin] = useState({ city: '', state: 'SP' });
  const [destination, setDestination] = useState({ city: '', state: 'SP' });
  const [stops, setStops] = useState<TripStop[]>([]);
  const [newStop, setNewStop] = useState({ city: '', state: 'SP' });

  const [formData, setFormData] = useState<any>({
    distance_km: 0,
    agreed_price: 0,
    driver_commission_percentage: 10,
    cargo_type: 'Geral',
    date: getTodayLocal(),
    vehicle_id: '',
    status: TripStatus.SCHEDULED,
    notes: ''
  });

  const calculatedCommission = (formData.agreed_price || 0) * ((formData.driver_commission_percentage || 0) / 100);

  const resetForm = () => {
    setEditingTripId(null);
    setStops([]);
    setOrigin({ city: '', state: 'SP' });
    setDestination({ city: '', state: 'SP' });
    setFormData({
      distance_km: 0,
      agreed_price: 0,
      driver_commission_percentage: 10,
      cargo_type: 'Geral',
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

  const openGoogleMapsRoute = () => {
    if (!origin.city || !destination.city) return alert("Preencha origem e destino!");
    const originStr = `${origin.city}, ${origin.state}, Brasil`;
    const destStr = `${destination.city}, ${destination.state}, Brasil`;
    let url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originStr)}&destination=${encodeURIComponent(destStr)}&travelmode=driving`;
    if (stops.length > 0) {
      const waypointsStr = stops.map(s => `${s.city}, ${s.state}, Brasil`).join('|');
      url += `&waypoints=${encodeURIComponent(waypointsStr)}`;
    }
    window.open(url, '_blank');
  };

  const handleAddStop = () => {
    if (newStop.city.trim()) {
      setStops([...stops, { ...newStop }]);
      setNewStop({ city: '', state: 'SP' });
    }
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
                      onChange={(e) => onUpdateStatus(trip.id, e.target.value as TripStatus)}
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl animate-fade-in relative mt-16 mb-10 overflow-hidden">
            <div className="flex justify-between items-center p-8 pb-4 border-b border-slate-50">
              <h3 className="text-2xl font-black">{editingTripId ? 'Editar Viagem' : 'Nova Viagem'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2"><X size={28} /></button>
            </div>
            
            <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Origem e Destino */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-slate-400 ml-1">Origem</label>
                  <div className="flex gap-2">
                    <input placeholder="Cidade" className="flex-1 p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold focus:bg-white outline-none" value={origin.city} onChange={e => setOrigin({...origin, city: e.target.value})} />
                    <select className="w-20 p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold" value={origin.state} onChange={e => setOrigin({...origin, state: e.target.value})}>
                      {BRAZILIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-slate-400 ml-1">Destino</label>
                  <div className="flex gap-2">
                    <input placeholder="Cidade" className="flex-1 p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold focus:bg-white outline-none" value={destination.city} onChange={e => setDestination({...destination, city: e.target.value})} />
                    <select className="w-20 p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold" value={destination.state} onChange={e => setDestination({...destination, state: e.target.value})}>
                      {BRAZILIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-slate-400 ml-1">Distância (KM)</label>
                  <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 font-black" value={formData.distance_km || ''} onChange={e => setFormData({...formData, distance_km: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-slate-400 ml-1">Data</label>
                  <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
              </div>

              {/* Seção de Frete e Comissão */}
              <div className="bg-slate-900 p-6 rounded-[2rem] text-white space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Valor Bruto do Frete</label>
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
                
                {/* Alinhamento visual da comissão em R$ */}
                <div className="pt-2 flex justify-between items-center border-t border-slate-800">
                  <p className="text-[10px] font-black uppercase text-slate-500">Valor da Comissão Calculado:</p>
                  <p className="text-xl font-black text-amber-500">R$ {calculatedCommission.toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-slate-400 ml-1">Veículo</label>
                <select className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold" value={formData.vehicle_id} onChange={e => setFormData({...formData, vehicle_id: e.target.value})}>
                  <option value="">Selecionar...</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>)}
                </select>
              </div>

              <button disabled={isSaving} onClick={handleSave} className="w-full py-5 bg-primary-600 text-white rounded-[1.5rem] font-black text-xl shadow-xl hover:bg-primary-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                 {isSaving ? <Loader2 className="animate-spin"/> : <Truck/>} {editingTripId ? 'Atualizar Viagem' : 'Salvar Viagem'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
