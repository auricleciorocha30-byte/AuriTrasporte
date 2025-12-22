import React, { useState, useEffect } from 'react';
import { Trip, TripStatus, Vehicle } from '../types';
import { Plus, MapPin, Calendar, Truck, UserCheck, Percent, Navigation, RefreshCcw } from 'lucide-react';

interface TripManagerProps {
  trips: Trip[];
  vehicles: Vehicle[];
  onAddTrip: (trip: Omit<Trip, 'id'>) => void;
  onUpdateStatus: (id: string, status: TripStatus) => void;
  onDeleteTrip: (id: string) => void;
}

export const TripManager: React.FC<TripManagerProps> = ({ trips, vehicles, onAddTrip, onUpdateStatus }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingDist, setLoadingDist] = useState(false);
  
  const [formData, setFormData] = useState<any>({
    origin: '',
    destination: '',
    distanceKm: 0,
    agreedPrice: 0,
    driverCommissionPercentage: 10,
    cargoType: 'Geral',
    date: new Date().toISOString().split('T')[0],
    vehicle_id: '',
    status: TripStatus.SCHEDULED
  });

  const calculateDistance = async () => {
    if (!formData.origin || !formData.destination) return alert("Informe origem e destino.");
    setLoadingDist(true);
    // Simulação de cálculo online (Em app real, chamaria API Google/OSRM)
    setTimeout(() => {
      const simulatedDist = Math.floor(Math.random() * 800) + 100;
      setFormData({ ...formData, distanceKm: simulatedDist });
      setLoadingDist(false);
    }, 1200);
  };

  const commValue = formData.agreedPrice * (formData.driverCommissionPercentage / 100);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Viagens</h2>
        <button onClick={() => setIsModalOpen(true)} className="bg-primary-600 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 font-semibold shadow-lg">
          <Plus size={20} /> Nova Viagem
        </button>
      </div>

      <div className="grid gap-4">
        {trips.map(trip => (
          <div key={trip.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <select 
                  value={trip.status} 
                  onChange={e => onUpdateStatus(trip.id, e.target.value as TripStatus)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border-none outline-none focus:ring-2 focus:ring-primary-500 ${
                    trip.status === TripStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700' :
                    trip.status === TripStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {Object.values(TripStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <span className="text-sm text-slate-400 flex items-center gap-1"><Calendar size={14}/> {trip.date}</span>
              </div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <MapPin className="text-primary-500" size={18} /> {trip.origin} → {trip.destination}
              </h3>
              <div className="mt-2 flex flex-wrap gap-4 text-xs font-medium text-slate-500">
                <span className="flex items-center gap-1"><Navigation size={14}/> {trip.distanceKm}km</span>
                <span className="flex items-center gap-1"><Truck size={14}/> {vehicles.find(v => v.id === trip.vehicle_id)?.plate || 'N/A'}</span>
                <span className="text-amber-600 font-bold">Comissão: R$ {trip.driverCommission?.toFixed(2)}</span>
              </div>
            </div>
            <div className="text-right flex flex-col justify-center">
              <p className="text-xs font-bold text-slate-400 uppercase">Valor do Frete</p>
              <p className="text-2xl font-black text-primary-600">R$ {trip.agreedPrice.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-6">Registrar Viagem</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Origem" className="p-3 bg-slate-50 border rounded-xl" value={formData.origin} onChange={e => setFormData({...formData, origin: e.target.value})} />
                <input placeholder="Destino" className="p-3 bg-slate-50 border rounded-xl" value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})} />
              </div>
              <div className="flex gap-2">
                <input type="number" placeholder="KM (Pode editar)" className="flex-1 p-3 bg-slate-50 border rounded-xl" value={formData.distanceKm} onChange={e => setFormData({...formData, distanceKm: Number(e.target.value)})} />
                <button onClick={calculateDistance} className="px-4 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors">
                  {loadingDist ? <RefreshCcw className="animate-spin" size={20} /> : <Navigation size={20} />}
                </button>
              </div>
              <select className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.vehicle_id} onChange={e => setFormData({...formData, vehicle_id: e.target.value})}>
                <option value="">Selecionar Veículo</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Frete R$" className="p-3 bg-slate-50 border rounded-xl" onChange={e => setFormData({...formData, agreedPrice: Number(e.target.value)})} />
                <div className="relative">
                  <input type="number" placeholder="Comissão %" className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.driverCommissionPercentage} onChange={e => setFormData({...formData, driverCommissionPercentage: Number(e.target.value)})} />
                  <Percent className="absolute right-3 top-3.5 text-slate-400" size={16}/>
                </div>
              </div>
              <div className="p-4 bg-amber-50 rounded-2xl flex justify-between items-center font-bold text-amber-800">
                <span>Total Comissão</span>
                <span>R$ {commValue.toFixed(2)}</span>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 font-bold border rounded-xl">Cancelar</button>
                <button onClick={() => { onAddTrip({...formData, driverCommission: commValue}); setIsModalOpen(false); }} className="flex-1 py-3 font-bold bg-primary-600 text-white rounded-xl">Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};