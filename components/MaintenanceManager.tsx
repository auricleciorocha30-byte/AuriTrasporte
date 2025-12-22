import React, { useState } from 'react';
import { MaintenanceItem, Vehicle } from '../types';
import { Plus, CheckSquare, Calendar, ShieldCheck } from 'lucide-react';

interface MaintenanceManagerProps {
  maintenance: MaintenanceItem[];
  vehicles: Vehicle[];
  onAddMaintenance: (m: Omit<MaintenanceItem, 'id'>) => void;
}

export const MaintenanceManager: React.FC<MaintenanceManagerProps> = ({ maintenance, vehicles, onAddMaintenance }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({
    vehicle_id: '',
    part_name: '',
    km_at_purchase: 0,
    warranty_months: 12,
    purchase_date: new Date().toISOString().split('T')[0],
    cost: 0
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Checklist / Manutenção</h2>
        <button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 font-semibold">
          <Plus size={20} /> Nova Peça/Serviço
        </button>
      </div>

      <div className="bg-white rounded-3xl border overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b font-bold text-slate-500">
            <tr>
              <th className="px-6 py-4">Peça/Serviço</th>
              <th className="px-6 py-4">Veículo</th>
              <th className="px-6 py-4">Troca (KM)</th>
              <th className="px-6 py-4">Garantia</th>
              <th className="px-6 py-4">Custo</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {maintenance.map(m => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-bold text-slate-800">{m.part_name}</td>
                <td className="px-6 py-4">{vehicles.find(v => v.id === m.vehicle_id)?.plate}</td>
                <td className="px-6 py-4">{m.km_at_purchase.toLocaleString()} km</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    {m.warranty_months} meses
                  </div>
                </td>
                <td className="px-6 py-4 font-bold text-rose-600">R$ {m.cost.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <h3 className="text-xl font-bold mb-6">Lançar Manutenção</h3>
            <div className="space-y-4">
              <select className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.vehicle_id} onChange={e => setFormData({...formData, vehicle_id: e.target.value})}>
                <option value="">Selecionar Veículo</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>)}
              </select>
              <input placeholder="Peça ou Serviço" className="w-full p-3 bg-slate-50 border rounded-xl" onChange={e => setFormData({...formData, part_name: e.target.value})} />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="KM da Troca" className="p-3 bg-slate-50 border rounded-xl" onChange={e => setFormData({...formData, km_at_purchase: Number(e.target.value)})} />
                <input type="number" placeholder="Garantia (Meses)" className="p-3 bg-slate-50 border rounded-xl" value={formData.warranty_months} onChange={e => setFormData({...formData, warranty_months: Number(e.target.value)})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="date" className="p-3 bg-slate-50 border rounded-xl text-xs" value={formData.purchase_date} onChange={e => setFormData({...formData, purchase_date: e.target.value})} />
                <input type="number" placeholder="Custo R$" className="p-3 bg-slate-50 border rounded-xl" onChange={e => setFormData({...formData, cost: Number(e.target.value)})} />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 font-bold border rounded-xl">Cancelar</button>
                <button onClick={() => { onAddMaintenance(formData); setIsModalOpen(false); }} className="flex-1 py-3 font-bold bg-emerald-600 text-white rounded-xl">Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};