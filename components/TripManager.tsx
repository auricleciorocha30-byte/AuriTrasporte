import React, { useState } from 'react';
import { Trip, TripStatus } from '../types';
import { Plus, MapPin, Calendar, DollarSign, Package, Trash2, Truck, UserCheck } from 'lucide-react';

interface TripManagerProps {
  trips: Trip[];
  onAddTrip: (trip: Trip) => void;
  onDeleteTrip: (id: string) => void;
}

const BRAZIL_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export const TripManager: React.FC<TripManagerProps> = ({ trips, onAddTrip, onDeleteTrip }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [originCity, setOriginCity] = useState('');
  const [originState, setOriginState] = useState('SP');
  const [destCity, setDestCity] = useState('');
  const [destState, setDestState] = useState('SP');

  const [newTrip, setNewTrip] = useState<Partial<Trip>>({
    status: TripStatus.SCHEDULED,
    date: new Date().toISOString().split('T')[0],
    driverCommission: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (originCity && destCity && newTrip.agreedPrice) {
      const trip: Trip = {
        id: Math.random().toString(36).substr(2, 9),
        origin: `${originCity}, ${originState}`,
        destination: `${destCity}, ${destState}`,
        distanceKm: Number(newTrip.distanceKm) || 0,
        agreedPrice: Number(newTrip.agreedPrice) || 0,
        driverCommission: Number(newTrip.driverCommission) || 0,
        cargoType: newTrip.cargoType || 'Geral',
        date: newTrip.date || new Date().toISOString(),
        status: (newTrip.status as TripStatus) || TripStatus.SCHEDULED,
        notes: newTrip.notes || ''
      };
      onAddTrip(trip);
      setIsModalOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setNewTrip({ status: TripStatus.SCHEDULED, date: new Date().toISOString().split('T')[0], driverCommission: 0 });
    setOriginCity('');
    setOriginState('SP');
    setDestCity('');
    setDestState('SP');
  };

  const getStatusColor = (status: TripStatus) => {
    switch (status) {
      case TripStatus.COMPLETED: return 'bg-green-100 text-green-700';
      case TripStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-700';
      case TripStatus.CANCELLED: return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Minhas Viagens</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={20} />
          Nova Viagem
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {trips.map((trip) => (
          <div key={trip.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:border-primary-200">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(trip.status)}`}>
                  {trip.status}
                </span>
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Calendar size={14} />
                  {new Date(trip.date).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                <MapPin size={18} className="text-primary-500" />
                {trip.origin} <span className="text-gray-300">→</span> {trip.destination}
              </div>
              <div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-4">
                <span className="flex items-center gap-1"><Package size={14}/> {trip.cargoType}</span>
                <span className="flex items-center gap-1"><Truck size={14}/> {trip.distanceKm} km</span>
                <span className="flex items-center gap-1 text-amber-600 font-medium">
                  <UserCheck size={14}/> Comiss: {formatCurrency(trip.driverCommission)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Valor do Frete</p>
                <p className="text-xl font-bold text-primary-600">
                  {formatCurrency(trip.agreedPrice)}
                </p>
              </div>
              <button 
                onClick={() => onDeleteTrip(trip.id)}
                className="text-gray-400 hover:text-red-500 transition-colors p-2"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
        
        {trips.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <Truck className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-500">Nenhuma viagem registrada ainda.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl my-8">
            <h3 className="text-xl font-bold mb-4">Registrar Nova Viagem</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Origem</label>
                <div className="flex gap-2">
                  <input required type="text" placeholder="Cidade" className="flex-1 p-3 bg-slate-50 border rounded-xl outline-none" value={originCity} onChange={e => setOriginCity(e.target.value)} />
                  <select className="w-24 p-3 bg-slate-50 border rounded-xl outline-none" value={originState} onChange={e => setOriginState(e.target.value)}>
                    {BRAZIL_STATES.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destino</label>
                <div className="flex gap-2">
                  <input required type="text" placeholder="Cidade" className="flex-1 p-3 bg-slate-50 border rounded-xl outline-none" value={destCity} onChange={e => setDestCity(e.target.value)} />
                  <select className="w-24 p-3 bg-slate-50 border rounded-xl outline-none" value={destState} onChange={e => setDestState(e.target.value)}>
                    {BRAZIL_STATES.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Distância (km)</label>
                  <input required type="number" className="w-full p-3 bg-slate-50 border rounded-xl outline-none" onChange={e => setNewTrip({...newTrip, distanceKm: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Carga</label>
                  <input type="text" placeholder="Ex: Grãos" className="w-full p-3 bg-slate-50 border rounded-xl outline-none" onChange={e => setNewTrip({...newTrip, cargoType: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Frete (R$)</label>
                  <input required type="number" className="w-full p-3 bg-slate-50 border rounded-xl outline-none" onChange={e => setNewTrip({...newTrip, agreedPrice: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Comissão (R$)</label>
                  <input required type="number" className="w-full p-3 bg-slate-50 border rounded-xl border-amber-200 outline-none focus:ring-2 focus:ring-amber-500" value={newTrip.driverCommission} onChange={e => setNewTrip({...newTrip, driverCommission: Number(e.target.value)})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                  <input required type="date" value={newTrip.date} className="w-full p-3 bg-slate-50 border rounded-xl outline-none" onChange={e => setNewTrip({...newTrip, date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select className="w-full p-3 bg-slate-50 border rounded-xl outline-none" value={newTrip.status} onChange={e => setNewTrip({...newTrip, status: e.target.value as TripStatus})}>
                    {Object.values(TripStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="flex-1 py-3 px-4 border rounded-xl hover:bg-gray-50 font-semibold">Cancelar</button>
                <button type="submit" className="flex-1 py-3 px-4 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold">Salvar Viagem</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};