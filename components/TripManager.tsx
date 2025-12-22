
import React, { useState } from 'react';
import { Trip, TripStatus, Vehicle } from '../types';
import { Plus, MapPin, Calendar, Truck, UserCheck, Percent, Navigation, RefreshCcw, X, Trash2, Loader2 } from 'lucide-react';

interface TripManagerProps {
  trips: Trip[];
  vehicles: Vehicle[];
  onAddTrip: (trip: Omit<Trip, 'id'>) => void;
  onUpdateStatus: (id: string, status: TripStatus) => void;
  onDeleteTrip: (id: string) => void;
  isSaving?: boolean;
}

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export const TripManager: React.FC<TripManagerProps> = ({ trips, vehicles, onAddTrip, onUpdateStatus, onDeleteTrip, isSaving }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingDist, setLoadingDist] = useState(false);
  
  const [originCity, setOriginCity] = useState('');
  const [originState, setOriginState] = useState('SP');
  const [destCity, setDestCity] = useState('');
  const [destState, setDestState] = useState('RJ');

  const [formData, setFormData] = useState<any>({
    distance_km: 0,
    agreed_price: 0,
    driver_commission_percentage: 10,
    cargo_type: 'Geral',
    date: new Date().toISOString().split('T')[0],
    vehicle_id: '',
    status: TripStatus.SCHEDULED
  });

  const calculateDistance = async () => {
    if (!originCity || !destCity) return alert("Informe a cidade de origem e destino.");
    setLoadingDist(true);
    setTimeout(() => {
      const simulatedDist = Math.floor(Math.random() * 800) + 100;
      setFormData({ ...formData, distance_km: simulatedDist });
      setLoadingDist(false);
    }, 1200);
  };

  const handleSave = async () => {
    if (!originCity || !destCity) {
      alert("Por favor, preencha origem e destino.");
      return;
    }
    const commValue = formData.agreed_price * (formData.driver_commission_percentage / 100);
    await onAddTrip({
      ...formData,
      origin: `${originCity} - ${originState}`,
      destination: `${destCity} - ${destState}`,
      driver_commission: commValue
    });
    setIsModalOpen(false);
    setOriginCity('');
    setDestCity('');
  };

  const commValue = (formData.agreed_price || 0) * ((formData.driver_commission_percentage || 0) / 100);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Viagens</h2>
        <button onClick={() => setIsModalOpen(true)} className="bg-primary-600 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 font-semibold shadow-lg active:scale-95 transition-all">
          <Plus size={20} /> Nova Viagem
        </button>
      </div>

      <div className="grid gap-4">
        {trips.map(trip => (
          <div key={trip.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between gap-4 relative group">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <select 
                  value={trip.status} 
                  onChange={e => onUpdateStatus(trip.id, e.target.value as TripStatus)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border-none outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer ${
                    trip.status === TripStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700' :
                    trip.status === TripStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {Object.values(TripStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <span className="text-sm text-slate-400 flex items-center gap-1"><Calendar size={14}/> {new Date(trip.date).toLocaleDateString('pt-BR')}</span>
              </div>
              <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <MapPin className="text-primary-500 shrink-0" size={18} /> 
                <span className="truncate">{trip.origin}</span> 
                <span className="text-slate-300">→</span> 
                <span className="truncate">{trip.destination}</span>
              </h3>
              <div className="mt-2 flex flex-wrap gap-4 text-xs font-medium text-slate-500">
                <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg"><Navigation size={14}/> {trip.distance_km}km</span>
                <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg"><Truck size={14}/> {vehicles.find(v => v.id === trip.vehicle_id)?.plate || 'N/A'}</span>
                <span className="text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded-lg">Comissão: R$ {trip.driver_commission?.toFixed(2)}</span>
              </div>
            </div>
            <div className="text-right flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-50 pt-4 md:pt-0 md:pl-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Valor do Frete</p>
              <p className="text-2xl font-black text-primary-600">R$ {trip.agreed_price.toLocaleString()}</p>
            </div>
            <button 
              onClick={() => onDeleteTrip(trip.id)}
              className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Registrar Viagem</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Data da Viagem</label>
                  <input type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Veículo</label>
                  <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={formData.vehicle_id} onChange={e => setFormData({...formData, vehicle_id: e.target.value})}>
                    <option value="">Opcional</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Origem</label>
                <div className="flex gap-2">
                  <input placeholder="Cidade" className="flex-[3] p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={originCity} onChange={e => setOriginCity(e.target.value)} />
                  <select className="flex-[1] p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold" value={originState} onChange={e => setOriginState(e.target.value)}>
                    {BRAZILIAN_STATES.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Destino</label>
                <div className="flex gap-2">
                  <input placeholder="Cidade" className="flex-[3] p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={destCity} onChange={e => setDestCity(e.target.value)} />
                  <select className="flex-[1] p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold" value={destState} onChange={e => setDestState(e.target.value)}>
                    {BRAZILIAN_STATES.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Distância e Frete</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex gap-2">
                    <input type="number" placeholder="KM" className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={formData.distance_km || ''} onChange={e => setFormData({...formData, distance_km: Number(e.target.value)})} />
                    <button onClick={calculateDistance} className="px-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200">
                      {loadingDist ? <RefreshCcw className="animate-spin" size={18} /> : <Navigation size={18} />}
                    </button>
                  </div>
                  <input type="number" placeholder="Valor Frete R$" className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" onChange={e => setFormData({...formData, agreed_price: Number(e.target.value)})} />
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl flex justify-between items-center font-bold text-amber-800 border border-amber-100">
                <div className="flex items-center gap-2">
                  <UserCheck size={18} />
                  <span>Comissão Motorista (10%)</span>
                </div>
                <span>R$ {commValue.toFixed(2)}</span>
              </div>

              <div className="flex gap-3 pt-4">
                <button disabled={isSaving} onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 font-bold text-slate-500 border border-slate-200 rounded-2xl">Cancelar</button>
                <button disabled={isSaving} onClick={handleSave} className="flex-1 py-3.5 font-black bg-primary-600 text-white rounded-2xl shadow-lg flex items-center justify-center gap-2">
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : 'Salvar Viagem'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
