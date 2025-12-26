
import React, { useState } from 'react';
import { Expense, ExpenseCategory, Trip, TripStatus, Vehicle } from '../types';
import { Plus, Trash2, MapPin, ChevronDown, Truck, AlertCircle, ShieldCheck, Clock, ReceiptText, Banknote, Loader2, Calendar, Edit2, CheckCircle2, Circle } from 'lucide-react';

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
    due_date: '',
    installments: 1,
    description: '',
    amount: 0,
    is_paid: false
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
      due_date: '', 
      installments: 1,
      description: '',
      amount: 0,
      is_paid: false
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
      due_date: expense.due_date || '',
      installments: 1,
      is_paid: expense.is_paid || false
    });
  };

  const handleTogglePaid = async (expense: Expense) => {
    if (onUpdateExpense) {
      await onUpdateExpense(expense.id, { is_paid: !expense.is_paid });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newExpense.description && newExpense.amount) {
      if (editingExpenseId && onUpdateExpense) {
        // Edição de um registro único
        const payload: Partial<Expense> = {
          description: newExpense.description,
          amount: Number(newExpense.amount),
          category: (newExpense.category as ExpenseCategory),
          date: newExpense.date,
          trip_id: modalType === 'TRIP' ? (newExpense.trip_id || null) : null,
          vehicle_id: newExpense.vehicle_id || null,
          due_date: modalType === 'FIXED' ? (newExpense.due_date || null) : null,
          is_paid: newExpense.is_paid
        };
        await onUpdateExpense(editingExpenseId, payload);
        resetForm();
      } else {
        // Criação de novos registros (pode incluir parcelas)
        const totalInstallments = modalType === 'FIXED' ? (newExpense.installments || 1) : 1;
        
        for (let i = 0; i < totalInstallments; i++) {
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
            due_date: dueDateStr,
            is_paid: newExpense.is_paid
          };
          
          await onAddExpense(expense);
        }
        resetForm();
      }
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
          <button onClick={() => {setModalType('TRIP'); setNewExpense({...newExpense, category: ExpenseCategory.FUEL, installments: 1, is_paid: true})}} className="flex-1 md:flex-none bg-slate-100 text-slate-700 px-6 py-3 rounded-2xl flex items-center justify-center gap-2 font-bold hover:bg-slate-200 transition-all text-sm border">
            <ReceiptText size={18} /> Gasto de Viagem
          </button>
          <button onClick={() => {setModalType('FIXED'); setNewExpense({...newExpense, category: ExpenseCategory.FINANCING, installments: 1, is_paid: false})}} className="flex-1 md:flex-none bg-primary-600 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg hover:bg-primary-700 active:scale-95 transition-all text-sm">
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
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">Data / Venc.</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase text-right">Valor / Status</th>
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
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full ${isFixedCategory(expense.category) ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-500">
                      {new Date(expense.date + 'T12:00:00').toLocaleDateString()}
                    </div>
                    {expense.due_date && (
                      <div className="text-[10px] font-black text-amber-600 uppercase mt-0.5">
                        Vence: {new Date(expense.due_date + 'T12:00:00').toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm font-black text-rose-600">
                      - R$ {expense.amount.toLocaleString()}
                    </div>
                    <div className="flex justify-end mt-1">
                      <button 
                        onClick={() => handleTogglePaid(expense)}
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded flex items-center gap-1 transition-all ${expense.is_paid ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}
                      >
                        {expense.is_paid ? <CheckCircle2 size={10}/> : <Circle size={10}/>}
                        {expense.is_paid ? 'Pago' : 'Pendente'}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleEdit(expense)} className="text-slate-300 hover:text-primary-600 transition-colors p-2"><Edit2 size={18} /></button>
                      <button onClick={() => onDeleteExpense(expense.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-2"><Trash2 size={18} /></button>
                    </div>
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
              <h3 className="text-2xl font-black">{editingExpenseId ? 'Editar Lançamento' : modalType === 'FIXED' ? 'Lançar Custo Fixo' : 'Gasto em Viagem'}</h3>
              <button onClick={resetForm} className="text-slate-400 p-2 hover:bg-slate-50 rounded-full transition-colors"><Plus size={28} className="rotate-45" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-slate-400 ml-1">Descrição</label>
                <input 
                  required 
                  type="text" 
                  placeholder={modalType === 'FIXED' ? "Ex: Parcela Scania R450" : "Ex: Diesel Posto Ipiranga"} 
                  className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold focus:ring-2 focus:ring-primary-500 outline-none" 
                  value={newExpense.description || ''} 
                  onChange={e => setNewExpense({...newExpense, description: e.target.value})} 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-slate-400 ml-1">Valor {modalType === 'FIXED' ? 'da Parcela' : ''} (R$)</label>
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
                  <label className="text-xs font-black uppercase text-slate-400 ml-1">Data Lançamento</label>
                  <input required type="date" value={newExpense.date} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" 
                    onChange={e => setNewExpense({...newExpense, date: e.target.value})} />
                </div>
                {modalType === 'FIXED' && !editingExpenseId ? (
                   <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-primary-600 ml-1">Qtd. Parcelas</label>
                    <input type="number" min="1" max="60" value={newExpense.installments} className="w-full p-4 bg-primary-50 border border-primary-200 rounded-2xl font-black" 
                      onChange={e => setNewExpense({...newExpense, installments: Number(e.target.value)})} />
                  </div>
                ) : (
                  <div className={`space-y-1 ${!editingExpenseId ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                    <label className="text-xs font-black uppercase text-slate-300 ml-1">Parcelas</label>
                    <input type="number" disabled value="1" className="w-full p-4 bg-slate-100 border border-slate-200 rounded-2xl font-bold" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {modalType === 'FIXED' && (
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-amber-600 ml-1 flex items-center gap-1"><Calendar size={14}/> Vencimento</label>
                    <input required type="date" value={newExpense.due_date} className="w-full p-4 bg-amber-50 border border-amber-200 rounded-2xl font-bold" 
                      onChange={e => setNewExpense({...newExpense, due_date: e.target.value})} />
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-slate-400 ml-1">Status de Pagamento</label>
                  <button 
                    type="button"
                    onClick={() => setNewExpense({...newExpense, is_paid: !newExpense.is_paid})}
                    className={`w-full p-4 rounded-2xl border font-black flex items-center justify-center gap-2 transition-all ${newExpense.is_paid ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-rose-50 border-rose-200 text-rose-600'}`}
                  >
                    {newExpense.is_paid ? <CheckCircle2 size={20}/> : <Circle size={20}/>}
                    {newExpense.is_paid ? 'Já está pago' : 'Pendente de pagamento'}
                  </button>
                </div>
              </div>

              <button disabled={isSaving} type="submit" className={`w-full py-5 text-white rounded-2xl font-black text-lg shadow-xl mt-4 transition-all flex items-center justify-center gap-2 ${modalType === 'FIXED' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary-600 hover:bg-primary-700'}`}>
                {isSaving ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20}/>}
                {isSaving ? 'Salvando...' : editingExpenseId ? 'Salvar Alterações' : modalType === 'FIXED' && newExpense.installments > 1 ? `Gerar ${newExpense.installments} Lançamentos` : 'Salvar Registro'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
