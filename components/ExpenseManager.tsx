
import React, { useState } from 'react';
import { Expense, ExpenseCategory, Trip, TripStatus, Vehicle } from '../types';
import { Plus, Trash2, ChevronDown, ReceiptText, Banknote, Loader2, Calendar, Edit2, CheckCircle2, Circle, X, AlertCircle, ShieldCheck } from 'lucide-react';

interface ExpenseManagerProps {
  expenses: Expense[];
  trips: Trip[];
  vehicles: Vehicle[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onUpdateExpense?: (id: string, expense: Partial<Expense>) => void;
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

export const ExpenseManager: React.FC<ExpenseManagerProps> = ({ expenses, trips, vehicles, onAddExpense, onUpdateExpense, onDeleteExpense, isSaving }) => {
  const [modalType, setModalType] = useState<'TRIP' | 'FIXED' | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [newExpense, setNewExpense] = useState<any>({
    category: ExpenseCategory.FUEL,
    date: getTodayLocal(),
    trip_id: '',
    vehicle_id: '',
    description: '',
    amount: 0,
    is_paid: true
  });

  const isFixedCategory = (category: any) => 
    [ExpenseCategory.FINANCING, ExpenseCategory.INSURANCE, ExpenseCategory.TRACKER].includes(category);

  const resetForm = () => {
    setModalType(null);
    setEditingExpenseId(null);
    setNewExpense({ 
      category: ExpenseCategory.FUEL, 
      date: getTodayLocal(), 
      trip_id: '', 
      vehicle_id: '', 
      description: '',
      amount: 0,
      is_paid: true
    });
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpenseId(expense.id);
    const type = expense.trip_id ? 'TRIP' : 'FIXED';
    setModalType(type);
    setNewExpense({
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
      trip_id: expense.trip_id || '',
      vehicle_id: expense.vehicle_id || '',
      is_paid: true
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newExpense.description && newExpense.amount) {
      if (editingExpenseId && onUpdateExpense) {
        const payload: Partial<Expense> = {
          description: newExpense.description,
          amount: Number(newExpense.amount),
          category: (newExpense.category as ExpenseCategory),
          date: newExpense.date,
          trip_id: modalType === 'TRIP' ? (newExpense.trip_id || null) : null,
          vehicle_id: newExpense.vehicle_id || null,
          is_paid: true
        };
        await onUpdateExpense(editingExpenseId, payload);
        resetForm();
      } else {
        const expense: Omit<Expense, 'id'> = {
          description: newExpense.description,
          amount: Number(newExpense.amount),
          category: (newExpense.category as ExpenseCategory) || ExpenseCategory.OTHER,
          date: newExpense.date,
          trip_id: modalType === 'TRIP' ? (newExpense.trip_id || null) : null,
          vehicle_id: newExpense.vehicle_id || null,
          is_paid: true
        };
        await onAddExpense(expense);
        resetForm();
      }
    }
  };

  return (
    <div className="space-y-6 pb-10 animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-2">
        <div className="space-y-1">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Financeiro</h2>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Lançamentos de Despesas</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button 
            onClick={() => {setModalType('TRIP'); setNewExpense({...newExpense, category: ExpenseCategory.FUEL})}} 
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-xs uppercase text-slate-600 hover:border-primary-500 hover:text-primary-600 transition-all shadow-sm"
          >
            <ReceiptText size={18} /> Gasto Viagem
          </button>
          <button 
            onClick={() => {setModalType('FIXED'); setNewExpense({...newExpense, category: ExpenseCategory.FINANCING})}} 
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-primary-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-primary-700 active:scale-95 transition-all"
          >
            <Banknote size={18} /> Gasto Fixo
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden mx-2">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/3">Descrição / Detalhes</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Lançamento</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="text-sm font-black text-slate-800">{expense.description}</div>
                    <div className="flex items-center gap-2 mt-1.5">
                      {expense.trip_id ? (
                        <span className="text-[9px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">Viagem</span>
                      ) : (
                        <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Fixo</span>
                      )}
                      {expense.vehicle_id && (
                        <span className="text-[9px] font-black uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Placa: {vehicles.find(v => v.id === expense.vehicle_id)?.plate || '---'}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 uppercase whitespace-nowrap">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-sm font-bold text-slate-500">
                      {new Date(expense.date + 'T12:00:00').toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="text-sm font-black text-rose-600">- R$ {expense.amount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                    <span className="inline-flex items-center gap-1 mt-2 text-[9px] font-black uppercase px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 cursor-default">
                      <CheckCircle2 size={12}/> Pago
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(expense)} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => onDeleteExpense(expense.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-slate-200">
                      <AlertCircle className="text-slate-300" size={32} />
                    </div>
                    <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Nenhum lançamento registrado</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalType && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] overflow-y-auto">
          <div className="bg-white rounded-[3rem] w-full max-w-xl p-10 shadow-2xl animate-fade-in my-8 border border-white/20">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                  {editingExpenseId ? 'Editar Gasto' : modalType === 'FIXED' ? 'Lançar Gasto Fixo' : 'Lançar Gasto Viagem'}
                </h3>
              </div>
              <button onClick={resetForm} className="bg-slate-50 p-4 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Descrição</label>
                <input 
                  required 
                  type="text" 
                  placeholder="Ex: Combustível, Parcela Caminhão, Manutenção..." 
                  className="w-full p-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-primary-500 focus:bg-white outline-none font-bold transition-all placeholder:text-slate-300" 
                  value={newExpense.description || ''} 
                  onChange={e => setNewExpense({...newExpense, description: e.target.value})} 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Valor (R$)</label>
                  <input required type="number" step="0.01" className="w-full p-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-primary-500 focus:bg-white outline-none font-black text-2xl text-slate-900" 
                    value={newExpense.amount || ''} onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Categoria</label>
                  <div className="relative">
                    <select className="w-full p-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-primary-500 focus:bg-white outline-none font-bold appearance-none"
                      value={newExpense.category}
                      onChange={e => setNewExpense({...newExpense, category: e.target.value as ExpenseCategory})}
                    >
                      {modalType === 'FIXED' ? (
                        <>
                          <option value={ExpenseCategory.FINANCING}>Financiamento / Prestação</option>
                          <option value={ExpenseCategory.INSURANCE}>Seguro Frota</option>
                          <option value={ExpenseCategory.TRACKER}>Rastreador</option>
                          <option value={ExpenseCategory.OTHER}>Outros Fixos</option>
                        </>
                      ) : (
                        Object.values(ExpenseCategory).filter(c => !isFixedCategory(c)).map(c => <option key={c} value={c}>{c}</option>)
                      )}
                    </select>
                    <ChevronDown className="absolute right-5 top-6 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Caminhão</label>
                  <select className="w-full p-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-primary-500 focus:bg-white outline-none font-bold appearance-none"
                    value={newExpense.vehicle_id || ''}
                    onChange={e => setNewExpense({...newExpense, vehicle_id: e.target.value})}
                  >
                    <option value="">Sem veículo específico</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Data</label>
                  <input required type="date" value={newExpense.date} className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-2xl font-bold outline-none" 
                    onChange={e => setNewExpense({...newExpense, date: e.target.value})} />
                </div>
              </div>

              {modalType === 'TRIP' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Vincular à Viagem</label>
                  <select className="w-full p-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-primary-500 focus:bg-white outline-none font-bold appearance-none"
                    value={newExpense.trip_id || ''}
                    onChange={e => setNewExpense({...newExpense, trip_id: e.target.value})}
                  >
                    <option value="">Gasto avulso</option>
                    {trips.filter(t => t.status !== TripStatus.CANCELLED).map(t => (
                      <option key={t.id} value={t.id}>{t.destination.split(' - ')[0]} ({new Date(t.date + 'T12:00:00').toLocaleDateString()})</option>
                    ))}
                  </select>
                </div>
              )}

              <button disabled={isSaving} type="submit" className={`w-full py-6 text-white rounded-[2rem] font-black text-xl shadow-2xl mt-4 transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${modalType === 'FIXED' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary-600 hover:bg-primary-700'}`}>
                {isSaving ? <Loader2 className="animate-spin" /> : <ShieldCheck size={24}/>}
                {isSaving ? 'Gravando...' : 'Confirmar Lançamento'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
