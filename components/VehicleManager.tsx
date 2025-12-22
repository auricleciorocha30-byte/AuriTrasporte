
import React, { useState } from 'react';
import { Vehicle } from '../types';
import { Plus, Settings, Truck, Trash2, Loader2 } from 'lucide-react';

interface VehicleManagerProps {
  vehicles: Vehicle[];
  onAddVehicle: (veh: Omit<Vehicle, 'id'>) => void;
  onDeleteVehicle: (id: string) => void;
  // Added isSaving to fix TypeScript error in App.tsx
  isSaving?: boolean;
}

export const VehicleManager: React.FC<VehicleManagerProps> = ({ vehicles, onAddVehicle, onDeleteVehicle, isSaving }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ plate: '', model: '', year: 2024, current_km: 0 });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Veículos</h2>
        <button onClick={() => setIsModalOpen(true)} className="bg-primary-600 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 font-semibold">
          <Plus size={20} /> Novo Veículo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map(v => (
          <div key={v.id} className="bg-white p-6 rounded-3xl border shadow-sm relative group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl"><Truck size={24}/></div>
              <div className="flex items-center gap-2">
                <span className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold uppercase">{v.plate}</span>
                <button 
                  onClick={() => onDeleteVehicle(v.id)}
                  className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <h3 className="text-xl font-bold">{v.model}</h3>
            <p className="text-sm text-slate-500 mb-4">{v.year}</p>
            <div className="p-3 bg-slate-50 rounded-xl flex justify-between text-xs font-bold">
              <span>KM Atual</span>
              <span>{v.current_km.toLocaleString()} km</span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl">
            <h3 className="text-xl font-bold mb-6">Cadastrar Veículo</h3>
            <div className="space-y-4">
              <input placeholder="Placa" className="w-full p-3 bg-slate-50 border rounded-xl uppercase" onChange={e => setFormData({...formData, plate: e.target.value})} />
              <input placeholder="Modelo" className="w-full p-3 bg-slate-50 border rounded-xl" onChange={e => setFormData({...formData, model: e.target.value})} />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Ano" className="p-3 bg-slate-50 border rounded-xl" onChange={e => setFormData({...formData, year: Number(e.target.value)})} />
                <input type="number" placeholder="KM Atual" className="p-3 bg-slate-50 border rounded-xl" onChange={e => setFormData({...formData, current_km: Number(e.target.value)})} />
              </div>
              <div className="flex gap-3 pt-4">
                {/* Fixed: Disabled buttons while isSaving is true */}
                <button disabled={isSaving} onClick={() => setIsModalOpen(false)} className="flex-1 py-3 font-bold border rounded-xl disabled:opacity-50">Cancelar</button>
                <button disabled={isSaving} onClick={async () => { await onAddVehicle(formData); setIsModalOpen(false); }} className="flex-1 py-3 font-bold bg-primary-600 text-white rounded-xl disabled:opacity-70 flex items-center justify-center gap-2">
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : 'Cadastrar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
