
import React, { useState } from 'react';
import { Expense, ExpenseCategory, Trip, TripStatus, Vehicle } from '../types';
import { Trash2, ChevronDown, ReceiptText, Banknote, Loader2, Edit2, CheckCircle2, X, AlertCircle, ShieldCheck, Wallet, Calendar, Truck, Circle } from 'lucide-react';

interface ExpenseManagerProps {
  expenses: Expense[];
  trips: Trip[];
  vehicles: Vehicle[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  onUpdateExpense?: (id: string, expense: Partial<Expense>) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
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
    due_date: getTodayLocal(),
    trip_id: '',
    vehicle_id: '',
    description: '',
    amount: 0,
    is_paid: true,
    installments: 1
  });

  const isFixedCategory = (category: any) => 
    [ExpenseCategory.FINANCING, ExpenseCategory.INSURANCE, ExpenseCategory.TRACKER].includes(category);

  const resetForm = () => {
    setModalType(null);
    setEditingExpenseId(null);
    setNewExpense({ 
      category: ExpenseCategory.FUEL, 
      date: getTodayLocal(), 
      due_date: getTodayLocal(),
      trip_id: '', 
      vehicle_id: '', 
      description: '',
      amount: 0,
      is_paid: true,
      installments: 1
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
      due_date: expense.due_date || expense.date,
      trip_id: expense.trip_id || '',
      vehicle_id: expense.vehicle_id || '',
      is_paid: expense.is_paid ?? true,
      installments: 1
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newExpense.description && newExpense.amount) {
      if (editingExpenseId && onUpdateExpense) {
        const payload = {
          description: newExpense.description,
          amount: Number(newExpense.amount),
          category: (newExpense.category as ExpenseCategory),
          date: newExpense.date,
          due_date: modalType === 'FIXED' ? newExpense.due_date : newExpense.date,
          trip_id: modalType === 'TRIP' ? (newExpense.trip_id || null) : null,
          vehicle_id: newExpense.vehicle_id || null,
          is_paid: newExpense.is_paid
        };
        await onUpdateExpense(editingExpenseId, payload);
      } else {
        const installmentsCount = modalType === 'FIXED' ? (newExpense.installments || 1) : 1;
        
        for (let i = 0; i < installmentsCount; i++) {
          const expenseDate = new Date(newExpense.date + 'T12:00:00');
          expenseDate.setMonth(expenseDate.getMonth() + i);
          
          const dueDate = new Date((newExpense.due_date || newExpense.date) + 'T12:00:00');
          dueDate.setMonth(dueDate.getMonth() + i);

          const payload = {
            description: installmentsCount > 1 ? `${newExpense.description} (${i + 1}/${installmentsCount})` : newExpense.description,
            amount: Number(newExpense.amount),
            category: (newExpense.category as ExpenseCategory),
            date: expenseDate.toISOString().split('T')[0],
            due_date: modalType === 'FIXED' ? dueDate.toISOString().split('T')[0] : expenseDate.toISOString().split('T')[0],
            trip_id: modalType === 'TRIP' ? (newExpense.trip_id || null) : null,
            vehicle_id: newExpense.vehicle_id || null,
            is_paid: modalType === 'TRIP' ? true : newExpense.is_paid
          };
          await onAddExpense(payload);
        }
      }
      resetForm();
    }
  };

  const togglePaidStatus = async (expense: Expense) => {
    if (onUpdateExpense) {
      await onUpdateExpense(expense.id, { is_paid: !expense.is_paid });
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-7xl mx-auto">
      {/* Header Centralizado Visualmente */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-2">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Gestão Financeira</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">Controle de saídas, vencimentos e parcelas</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={() => {setModalType('TRIP'); setNewExpense({...newExpense, category: ExpenseCategory.FUEL, is_paid: true, installments: 1})}} 
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-[11px] uppercase text-slate-600 hover:border-primary-500 hover:text-primary-600 transition-all shadow-sm active:scale-95"
          >
            <ReceiptText size={18} /> Gasto de Viagem
          </button>
          <button 
            onClick={() => {setModalType('FIXED'); setNewExpense({...newExpense, category: ExpenseCategory.FINANCING, is_paid: false, installments: 1})}} 
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase shadow-xl hover:bg-black active:scale-95 transition-all"
          >
            <Banknote size={18} /> Gasto Fixo / Parcelado
          </button>
        </div>
      </div>

      {/* Grid de Lançamentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
        {expenses.map((expense) => {
          const vehicle = vehicles.find(v => v.id === expense.vehicle_id);
          const trip = trips.find(t => t.id === expense.trip_id);
          const isOverdue = !expense.is_paid && expense.due_date && new Date(expense.due_date + 'T12:00:00') < new Date();
          
          return (
            <div key={expense.id} className={`bg-white p-6 rounded-[2.5rem] border shadow-sm relative group hover:border-primary-200 transition-all ${isOverdue ? 'ring-2 ring-rose-100' : ''}`}>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-4 rounded-[1.5rem] ${expense.trip_id ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                  {expense.trip_id ? <ReceiptText size={24}/> : <Wallet size={24}/>}
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black uppercase text-slate-400 mb-1">Valor do Lançamento</div>
                  <div className="text-2xl font-black text-rose-600">- R$ {expense.amount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-black text-slate-800 leading-tight truncate">{expense.description}</h3>
                
                <div className="flex flex-wrap gap-2">
                  <span className="text-[9px] font-black uppercase bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200">
                    {expense.category}
                  </span>
                  <button 
                    onClick={() => togglePaidStatus(expense)}
                    className={`text-[9px] font-black uppercase px-2 py-1 rounded-md border flex items-center gap-1 transition-all ${expense.is_paid ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse'}`}
                  >
                    {expense.is_paid ? <CheckCircle2 size={10}/> : <Circle size={10}/>}
                    {expense.is_paid ? 'Pago' : 'Pendente (Clique p/ Pagar)'}
                  </button>
                </div>

                <div className="h-px bg-slate-50 my-2"></div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase text-slate-400">Data Registro</p>
                    <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Calendar size={12} className="text-slate-300"/>
                      {new Date(expense.date + 'T12:00:00').toLocaleDateString()}
                    </p>
                  </div>
                  {expense.due_date && (
                    <div className="space-y-1 text-right">
                      <p className="text-[9px] font-black uppercase text-slate-400">Vencimento</p>
                      <p className={`text-xs font-black flex items-center justify-end gap-1.5 ${isOverdue ? 'text-rose-600' : 'text-slate-700'}`}>
                        <Calendar size={12} className={isOverdue ? 'text-rose-400' : 'text-slate-300'}/>
                        {new Date(expense.due_date + 'T12:00:00').toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {vehicle && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <Truck size={12} className="text-slate-300"/>
                    <span className="text-[10px] font-bold text-slate-500">Caminhão: {vehicle.plate}</span>
                  </div>
                )}

                {trip && (
                  <div className="mt-2 p-2 bg-blue-50/50 rounded-xl border border-blue-100">
                    <p className="text-[8px] font-black uppercase text-blue-400">Viagem Vinculada:</p>
                    <p className="text-[10px] font-bold text-blue-700 truncate">{trip.destination}</p>
                  </div>
                )}
              </div>

              <div className="absolute top-4 right-4 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-white/80 p-1 rounded-lg backdrop-blur-sm">
                <button onClick={() => handleEdit(expense)} className="p-2 text-slate-400 hover:text-primary-600 transition-all">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => onDeleteExpense(expense.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-all">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}

        {expenses.length === 0 && (
          <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <AlertCircle className="text-slate-300" size={32} />
            </div>
            <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Nenhum gasto registrado</p>
          </div>
        )}
      </div>

      {/* Modal Reformulado */}
      {modalType && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] overflow-y-auto">
          <div className="bg-white rounded-[3rem] w-full max-w-xl p-10 shadow-2xl animate-fade-in my-8 border border-white/20">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                  {editingExpenseId ? 'Editar Lançamento' : modalType === 'FIXED' ? 'Lançar Gasto Fixo' : 'Lançar Gasto Operacional'}
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Data Registro</label>
                  <input required type="date" value={newExpense.date} className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-2xl font-bold outline-none" 
                    onChange={e => setNewExpense({...newExpense, date: e.target.value})} />
                </div>
                {modalType === 'FIXED' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-primary-600 ml-1">Data Vencimento</label>
                    <input required type="date" value={newExpense.due_date} className="w-full p-5 bg-primary-50 border-2 border-primary-200 focus:border-primary-500 focus:bg-white rounded-2xl font-black outline-none" 
                      onChange={e => setNewExpense({...newExpense, due_date: e.target.value})} />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Caminhão</label>
                  <select className="w-full p-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-primary-500 focus:bg-white outline-none font-bold appearance-none"
                    value={newExpense.vehicle_id || ''}
                    onChange={e => setNewExpense({...newExpense, vehicle_id: e.target.value})}
                  >
                    <option value="">Sem veículo</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>
                    ))}
                  </select>
                </div>
                {modalType === 'FIXED' && !editingExpenseId ? (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Qtd Parcelas</label>
                    <input type="number" min="1" max="120" className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-2xl font-bold outline-none" 
                      value={newExpense.installments} 
                      onChange={e => setNewExpense({...newExpense, installments: Number(e.target.value)})} />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Status</label>
                    <button 
                      type="button"
                      onClick={() => setNewExpense({...newExpense, is_paid: !newExpense.is_paid})}
                      className={`w-full p-5 rounded-2xl font-black text-xs uppercase border-2 transition-all ${newExpense.is_paid ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}
                    >
                      {newExpense.is_paid ? 'Já está Pago' : 'Fica Pendente'}
                    </button>
                  </div>
                )}
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

              <button disabled={isSaving} type="submit" className={`w-full py-6 text-white rounded-[2rem] font-black text-xl shadow-2xl mt-6 transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${modalType === 'FIXED' ? 'bg-slate-900 hover:bg-black' : 'bg-primary-600 hover:bg-primary-700'}`}>
                {isSaving ? <Loader2 className="animate-spin" /> : <ShieldCheck size={24}/>}
                {isSaving ? 'Gravando...' : editingExpenseId ? 'Salvar Alterações' : 'Confirmar Lançamento'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
