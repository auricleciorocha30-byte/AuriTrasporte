
import React, { useState } from 'react';
import { Expense, ExpenseCategory, Trip, TripStatus, Vehicle } from '../types';
import { Plus, Trash2, MapPin, ChevronDown, Truck, AlertCircle, ShieldCheck, Clock, ReceiptText, Banknote, Loader2, Calendar } from 'lucide-react';

interface ExpenseManagerProps {
  expenses: Expense[];
  trips: Trip[];
  vehicles: Vehicle[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
  isSaving?: boolean;
}

const getTodayLocal = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const ExpenseManager: React.FC<ExpenseManagerProps> = ({ expenses, trips, vehicles, onAddExpense, onDeleteExpense, isSaving }) => {
  const [modalType, setModalType] = useState<'TRIP' | 'FIXED' | null>(null);
  const [newExpense, setNewExpense] = useState<any>({
    category: ExpenseCategory.FUEL,
    date: getTodayLocal(),
    trip_id: '',
    vehicle_id: '',
    due_date: '',
    installments: 1,
    description: '',
    amount: 0
  });

  const isFixedCategory = (category: any) => 
    [ExpenseCategory.FINANCING, ExpenseCategory.INSURANCE, ExpenseCategory.TRACKER].includes(category);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newExpense.description && newExpense.amount) {
      const totalInstallments = modalType === 'FIXED' ? (newExpense.installments || 1) : 1;
      
      for (let i = 0; i < totalInstallments; i++) {
        // Calcular datas para parcelas
        const expenseDate = new Date(newExpense.date + 'T12:00:00');
        expenseDate.setMonth(expenseDate.getMonth() + i);
        
        let dueDateStr = null;
        if (modalType === 'FIXED' && newExpense.due_date) {
          const dueDate = new Date(newExpense.due_date + 'T12:00:00');
          dueDate.setMonth(dueDate.getMonth() + i);
          dueDateStr = dueDate.toISOString().split('T')[0];
        }

        const expense: Omit<Expense, 'id'> = {
          description: totalInstallments > 1 
            ? `${newExpense.description} (${i + 1}/${totalInstallments})` 
            : newExpense.description,
          amount: Number(newExpense.amount),
          category: (newExpense.category as ExpenseCategory) || ExpenseCategory.OTHER,
          date: expenseDate.toISOString().split('T')[0],
          trip_id: modalType === 'TRIP' ? (newExpense.trip_id || null) : null,
          vehicle_id: newExpense.vehicle_id || null,
          due_date: dueDateStr
        };
        
        await onAddExpense(expense);
      }

      setModalType(null);
      setNewExpense({ 
        category: ExpenseCategory.FUEL, 
        date: getTodayLocal(), 
        trip_id: '', 
        vehicle_id: '', 
        due_date: '', 
        installments: 1,
        description: '',
        amount: 0
      });
    }
  };

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Financeiro</h2>
          <p className="text-slate-400 font-bold text-sm">Gestão de saídas e lucros</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={() => {setModalType('TRIP'); setNewExpense({...newExpense, category: ExpenseCategory.FUEL, installments: 1})}} className="flex-1 md:flex-none bg-slate-100 text-slate-700 px-6 py-3 rounded-2xl flex items-center justify-center gap-2 font-bold hover:bg-slate-200 transition-all text-sm border">
            <ReceiptText size={18} /> Gasto de Viagem
          </button>
          <button onClick={() => {setModalType('FIXED'); setNewExpense({...newExpense, category: ExpenseCategory.FINANCING, installments: 1})}} className="flex-1 md:flex-none bg-primary-600 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg hover:bg-primary-700 active:scale-95 transition-all text-sm">
            <Banknote size={18} /> Custos Fixos
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden mx-2">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">Descrição / Vínculo</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">Categoria</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">Data</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase text-right">Valor</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-900">{expense.description}</div>
                    <div className="flex items-center gap-2 mt-1">
                      {expense.trip_id && <span className="text-[9px] font-black uppercase text-primary-600 bg-primary-50 px-2 rounded">Em Viagem</span>}
                      {expense.vehicle_id && <span className="text-[9px] font-black uppercase text-slate-500 bg-slate-100 px-2 rounded">Placa: {vehicles.find(v => v.id === expense.vehicle_id)?.plate || '---'}</span>}
                      {expense.due_date && <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-50 px-2 rounded">Vence: {new Date(expense.due_date + 'T12:00:00').toLocaleDateString()}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full ${isFixedCategory(expense.category) ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-500">
                    {new Date(expense.date + 'T12:00:00').toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-black text-rose-600">
                    - R$ {expense.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => onDeleteExpense(expense.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-2"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <AlertCircle className="mx-auto text-slate-200 mb-2" size={40} />
                    <p className="text-slate-400 font-bold">Nenhum lançamento financeiro.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalType && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl animate-fade-in my-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black">{modalType === 'FIXED' ? 'Lançar Custo Fixo' : 'Gasto em Viagem'}</h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 p-2 hover:bg-slate-50 rounded-full transition-colors"><Plus size={28} className="rotate-45" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-slate-400 ml-1">Descrição</label>
                <input required type="text" placeholder="Ex: Financiamento Scania" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold focus:ring-2 focus:ring-primary-500 outline-none" 
                  value={newExpense.description || ''} onChange={e => setNewExpense({...newExpense, description: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-slate-400 ml-1">Valor da Parcela (R$)</label>
                  <input required type="number" step="0.01" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 font-black text-xl" 
                    value={newExpense.amount || ''} onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-slate-400 ml-1">Categoria</label>
                  <select className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold outline-none"
                    value={newExpense.category}
                    onChange={e => setNewExpense({...newExpense, category: e.target.value as ExpenseCategory})}
                  >
                    {modalType === 'FIXED' ? (
                      <>
                        <option value={ExpenseCategory.FINANCING}>Prestação / Financiamento</option>
                        <option value={ExpenseCategory.INSURANCE}>Seguro</option>
                        <option value={ExpenseCategory.TRACKER}>Rastreador</option>
                        <option value={ExpenseCategory.OTHER}>Assinaturas / Outros</option>
                      </>
                    ) : (
                      Object.values(ExpenseCategory).filter(c => !isFixedCategory(c)).map(c => <option key={c} value={c}>{c}</option>)
                    )}
                  </select>
                </div>
              </div>

              {/* Vínculo de Veículo - Disponível para ambos os tipos de gasto agora */}
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-slate-400 ml-1">Vincular a um Veículo</label>
                <div className="relative">
                  <select className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold outline-none appearance-none"
                    value={newExpense.vehicle_id || ''}
                    onChange={e => setNewExpense({...newExpense, vehicle_id: e.target.value})}
                  >
                    <option value="">Nenhum veículo específico</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {modalType === 'TRIP' && (
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-slate-400 ml-1">Vincular à Viagem</label>
                  <select className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold outline-none"
                    value={newExpense.trip_id || ''}
                    onChange={e => setNewExpense({...newExpense, trip_id: e.target.value})}
                  >
                    <option value="">Nenhuma viagem específica</option>
                    {trips.filter(t => t.status !== TripStatus.CANCELLED).map(t => (
                      <option key={t.id} value={t.id}>{t.destination.split(' - ')[0]} ({t.date})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-slate-400 ml-1">Data Início</label>
                  <input required type="date" value={newExpense.date} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" 
                    onChange={e => setNewExpense({...newExpense, date: e.target.value})} />
                </div>
                {modalType === 'FIXED' ? (
                   <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-primary-600 ml-1">Qtd. Parcelas</label>
                    <input type="number" min="1" max="60" value={newExpense.installments} className="w-full p-4 bg-primary-50 border border-primary-200 rounded-2xl font-black" 
                      onChange={e => setNewExpense({...newExpense, installments: Number(e.target.value)})} />
                  </div>
                ) : (
                  <div className="space-y-1 opacity-50 grayscale pointer-events-none">
                    <label className="text-xs font-black uppercase text-slate-300 ml-1">Parcelas (Apenas Fixo)</label>
                    <input type="number" disabled value="1" className="w-full p-4 bg-slate-100 border border-slate-200 rounded-2xl font-bold" />
                  </div>
                )}
              </div>

              {modalType === 'FIXED' && (
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-amber-600 ml-1 flex items-center gap-1"><Calendar size={14}/> Vencimento (1ª Parcela)</label>
                  <input required type="date" value={newExpense.due_date} className="w-full p-4 bg-amber-50 border border-amber-200 rounded-2xl font-bold" 
                    onChange={e => setNewExpense({...newExpense, due_date: e.target.value})} />
                  <p className="text-[10px] font-bold text-slate-400 ml-1 uppercase">O sistema notificará você todo mês antes desta data.</p>
                </div>
              )}

              <button disabled={isSaving} type="submit" className={`w-full py-5 text-white rounded-2xl font-black text-lg shadow-xl mt-4 transition-all flex items-center justify-center gap-2 ${modalType === 'FIXED' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary-600 hover:bg-primary-700'}`}>
                {isSaving ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20}/>}
                {isSaving ? 'Salvando...' : modalType === 'FIXED' && newExpense.installments > 1 ? `Gerar ${newExpense.installments} Lançamentos` : 'Salvar Registro'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
