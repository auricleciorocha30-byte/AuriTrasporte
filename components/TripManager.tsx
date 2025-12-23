
import React, { useState } from 'react';
import { Trip, TripStatus, Vehicle } from '../types';
import { Plus, MapPin, Calendar, Truck, UserCheck, Navigation, RefreshCcw, X, Trash2, Loader2, Map as MapIcon, ChevronRight, Percent } from 'lucide-react';

interface TripManagerProps {
  trips: Trip[];
  vehicles: Vehicle[];
  onAddTrip: (trip: Omit<Trip, 'id'>) => void;
  onUpdateStatus: (id: string, status: TripStatus) => void;
  onDeleteTrip: (id: string) => void;
  isSaving?: boolean;
}

const BRAZILIAN_STATES = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

export const TripManager: React.FC<TripManagerProps> = ({ trips, vehicles, onAddTrip, onUpdateStatus, onDeleteTrip, isSaving }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingDist, setLoadingDist] = useState(false);
  
  const [origin, setOrigin] = useState({ city: '', state: 'SP' });
  const [destination, setDestination] = useState({ city: '', state: 'SP' });
  const [stops, setStops] = useState<string[]>([]);
  const [newStop, setNewStop] = useState('');

  const [formData, setFormData] = useState<any>({
    distance_km: 0,
    agreed_price: 0,
    driver_commission_percentage: 10,
    cargo_type: 'Geral',
    date: new Date().toISOString().split('T')[0],
    vehicle_id: '',
    status: TripStatus.SCHEDULED
  });

  const openGoogleMapsRoute = () => {
    if (!origin.city || !destination.city) return alert("Preencha origem e destino!");
    const originStr = `${origin.city}, ${origin.state}`;
    const destStr = `${destination.city}, ${destination.state}`;
    const waypoints = stops.join('|');
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originStr)}&destination=${encodeURIComponent(destStr)}&waypoints=${encodeURIComponent(waypoints)}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const handleAddStop = () => {
    if (newStop.trim()) {
      setStops([...stops, newStop.trim()]);
      setNewStop('');
    }
  };

  const estimateDistance = async () => {
    setLoadingDist(true);
    // Simulação de cálculo baseado na quantidade de paradas e estados
    setTimeout(() => {
      const base = 300;
      const stopExtra = stops.length * 120;
      const estimated = base + stopExtra + Math.floor(Math.random() * 150);
      setFormData({ ...formData, distance_km: estimated });
      setLoadingDist(false);
    }, 800);
  };

  const handleSave = async () => {
    if (!origin.city || !destination.city || !formData.distance_km || !formData.agreed_price) {
      alert("Por favor, preencha todos os campos obrigatórios (Origem, Destino, Distância e Preço).");
      return;
    }

    const commValue = formData.agreed_price * (formData.driver_commission_percentage / 100);
    await onAddTrip({
      ...formData,
      origin: `${origin.city} - ${origin.state}`,
      destination: `${destination.city} - ${destination.state}`,
      stops: stops,
      driver_commission: commValue
    });
    
    // Reset
    setIsModalOpen(false);
    setStops([]);
    setOrigin({ city: '', state: 'SP' });
    setDestination({ city: '', state: 'SP' });
    setFormData({
      distance_km: 0,
      agreed_price: 0,
      driver_commission_percentage: 10,
      cargo_type: 'Geral',
      date: new Date().toISOString().split('T')[0],
      vehicle_id: '',
      status: TripStatus.SCHEDULED
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black">Minhas Viagens</h2>
        <button onClick={() => setIsModalOpen(true)} className="bg-primary-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold shadow-lg active:scale-95 transition-all">
          <Plus size={20} /> Nova Viagem
        </button>
      </div>

      <div className="grid gap-4">
        {trips.map(trip => (
          <div key={trip.id} className="bg-white p-6 rounded-[2rem] border shadow-sm relative group animate-fade-in hover:border-primary-200 transition-colors">
            <div className="flex flex-col md:flex-row justify-between gap-6">
               <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${trip.status === TripStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{trip.status}</span>
                    <span className="text-sm font-bold text-slate-400">{new Date(trip.date).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 flex-wrap">
                    <MapPin className="text-primary-500" size={20}/> {trip.origin} 
                    <ChevronRight size={16} className="text-slate-300"/> 
                    {trip.destination}
                  </h3>
                  {trip.stops && trip.stops.length > 0 && (
                    <div className="mt-2 p-2 bg-slate-50 rounded-xl text-xs font-bold text-slate-500 flex gap-2 overflow-x-auto">
                      <span className="text-primary-600 shrink-0">Paradas:</span> {trip.stops.join(' → ')}
                    </div>
                  )}
                  <div className="mt-4 flex flex-wrap gap-4 items-center">
                    <div className="bg-slate-50 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 text-slate-600"><Navigation size={14}/> {trip.distance_km} KM</div>
                    <div className="bg-slate-50 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 text-slate-600"><Truck size={14}/> {vehicles.find(v => v.id === trip.vehicle_id)?.plate || 'S/V'}</div>
                    <div className="bg-amber-50 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 text-amber-700"><Percent size={14}/> {trip.driver_commission_percentage}% Comis.</div>
                  </div>
               </div>
               <div className="md:text-right border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-8 flex flex-col justify-center min-w-[150px]">
                  <p className="text-xs font-black text-slate-400 uppercase mb-1">Valor Frete</p>
                  <p className="text-2xl font-black text-primary-600">R$ {trip.agreed_price.toLocaleString()}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Lucro Bruto: R$ {(trip.agreed_price - (trip.driver_commission || 0)).toLocaleString()}</p>
               </div>
            </div>
            <button onClick={() => onDeleteTrip(trip.id)} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition-opacity opacity-0 group-hover:opacity-100"><Trash2 size={20}/></button>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-xl rounded-[3rem] p-8 shadow-2xl max-h-[90vh] overflow-y-auto animate-fade-in relative">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black">Registrar Nova Viagem</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2"><X size={28} /></button>
            </div>
            
            <div className="space-y-6">
              {/* Origem e Destino com Estado */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-slate-400 ml-1 flex items-center gap-1"><MapPin size={12}/> Origem (Cidade e Estado)</label>
                  <div className="flex gap-2">
                    <input placeholder="Ex: São Paulo" className="flex-1 p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary-500 font-bold" value={origin.city} onChange={e => setOrigin({...origin, city: e.target.value})} />
                    <select className="w-24 p-4 bg-slate-50 rounded-2xl border border-slate-200 font-black text-primary-700" value={origin.state} onChange={e => setOrigin({...origin, state: e.target.value})}>
                      {BRAZILIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-slate-400 ml-1 flex items-center gap-1"><MapPin size={12}/> Destino Final (Cidade e Estado)</label>
                  <div className="flex gap-2">
                    <input placeholder="Ex: Santos" className="flex-1 p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary-500 font-bold" value={destination.city} onChange={e => setDestination({...destination, city: e.target.value})} />
                    <select className="w-24 p-4 bg-slate-50 rounded-2xl border border-slate-200 font-black text-primary-700" value={destination.state} onChange={e => setDestination({...destination, state: e.target.value})}>
                      {BRAZILIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Paradas Intermediárias / Novos Destinos */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 ml-1">Paradas / Novos Destinos na Rota</label>
                <div className="flex gap-2">
                  <input placeholder="Ex: Campinas, SP" className="flex-1 p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none" value={newStop} onChange={e => setNewStop(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAddStop()} />
                  <button onClick={handleAddStop} className="p-4 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors text-primary-600"><Plus size={24}/></button>
                </div>
                {stops.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {stops.map((s, i) => (
                      <span key={i} className="bg-primary-50 text-primary-700 px-3 py-2 rounded-xl text-xs font-black flex items-center gap-2 border border-primary-100">
                        {s} <button onClick={() => setStops(stops.filter((_, idx) => idx !== i))} className="hover:text-rose-500"><X size={14}/></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Distância Manual e Botões de Rota */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-slate-400 ml-1">Distância Total (KM) - Manual</label>
                  <div className="relative">
                    <Navigation className="absolute left-4 top-4 text-slate-400" size={20}/>
                    <input type="number" placeholder="0" className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border border-slate-200 font-black text-xl outline-none" value={formData.distance_km || ''} onChange={e => setFormData({...formData, distance_km: Number(e.target.value)})} />
                  </div>
                </div>
                <div className="flex flex-col gap-2 justify-end">
                   <button onClick={estimateDistance} className="flex-1 p-3 bg-slate-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
                      {loadingDist ? <Loader2 className="animate-spin" size={18}/> : <Navigation size={18}/>} Sugerir Distância
                   </button>
                   <button onClick={openGoogleMapsRoute} className="flex-1 p-3 border-2 border-primary-600 text-primary-600 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-primary-50 transition-all">
                      <MapIcon size={18}/> Abrir Maps
                   </button>
                </div>
              </div>

              {/* Financeiro: Frete e Comissão */}
              <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-200 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-slate-400 ml-1">Valor do Frete (R$)</label>
                    <input type="number" placeholder="0.00" className="w-full p-4 bg-white rounded-2xl border border-slate-200 font-black text-xl text-primary-600 outline-none focus:ring-2 focus:ring-primary-500" value={formData.agreed_price || ''} onChange={e => setFormData({...formData, agreed_price: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-slate-400 ml-1">Comissão Motorista (%)</label>
                    <div className="relative">
                      <Percent className="absolute right-4 top-4 text-slate-400" size={20}/>
                      <input type="number" placeholder="10" className="w-full p-4 bg-white rounded-2xl border border-slate-200 font-black text-xl text-amber-600 outline-none focus:ring-2 focus:ring-amber-500" value={formData.driver_commission_percentage} onChange={e => setFormData({...formData, driver_commission_percentage: Number(e.target.value)})} />
                    </div>
                  </div>
                </div>
                {formData.agreed_price > 0 && (
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 px-2">
                    <span className="text-xs font-bold text-slate-500">Valor Comissão:</span>
                    <span className="text-sm font-black text-amber-700">R$ {(formData.agreed_price * (formData.driver_commission_percentage / 100)).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Veículo e Data */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-slate-400 ml-1">Veículo</label>
                  <select className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold outline-none" value={formData.vehicle_id} onChange={e => setFormData({...formData, vehicle_id: e.target.value})}>
                    <option value="">Selecionar...</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-slate-400 ml-1">Data de Saída</label>
                  <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
              </div>

              <button disabled={isSaving} onClick={handleSave} className="w-full py-5 bg-primary-600 text-white rounded-[2rem] font-black text-xl shadow-xl hover:bg-primary-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                 {isSaving ? <Loader2 className="animate-spin"/> : <Truck/>} Salvar Viagem e Iniciar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
