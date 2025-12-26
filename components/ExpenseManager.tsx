
import React, { useState } from 'react';
import { Expense, ExpenseCategory, Trip, TripStatus, Vehicle } from '../types';
import { Trash2, ChevronDown, ReceiptText, Banknote, Loader2, Edit2, CheckCircle2, X, AlertCircle, ShieldCheck, Wallet, Calendar, Truck, Circle, ArrowRightCircle, Check, OctagonX } from 'lucide-react';

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
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export const ExpenseManager: React.FC<ExpenseManagerProps> = ({ expenses, trips, vehicles, onAddExpense, onUpdateExpense, onDeleteExpense, isSaving }) => {
  const [modalType, setModalType] = useState<'TRIP' | 'FIXED' | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [confirmPaymentId, setConfirmPaymentId] = useState<string | null>(null);
  
  const [newExpense, setNewExpense] = useState<any>({
    category: ExpenseCategory.FUEL,
    date: getTodayLocal(),
    due_date: getTodayLocal(),
    trip_id: '',
    vehicle_id: '',
    description: '',
    amount: 0,
    is_paid: true,
    installments_total: 1,
    installments_remaining: 1
  });

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
      installments_total: 1,
      installments_remaining: 1
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
      installments_total: expense.installments_total || 1,
      installments_remaining: expense.installments_remaining || 1
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newExpense.description && newExpense.amount) {
      const payload = {
        description: newExpense.description,
        amount: Number(newExpense.amount),
        category: (newExpense.category as ExpenseCategory),
        date: newExpense.date,
        due_date: modalType === 'FIXED' ? newExpense.due_date : newExpense.date,
        trip_id: modalType === 'TRIP' ? (newExpense.trip_id || null) : null,
        vehicle_id: newExpense.vehicle_id || null,
        is_paid: newExpense.is_paid,
        installments_total: Number(newExpense.installments_total),
        installments_remaining: Number(newExpense.installments_remaining)
      };

      if (editingExpenseId && onUpdateExpense) {
        await onUpdateExpense(editingExpenseId, payload);
      } else {
        await onAddExpense(payload);
      }
      resetForm();
    }
  };

  const executePayment = async () => {
    if (!confirmPaymentId || !onUpdateExpense) return;
    const expense = expenses.find(e => e.id === confirmPaymentId);
    if (!expense) return;

    const remaining = (expense.installments_remaining || 1) - 1;
    const isNowPaid = remaining <= 0;
    
    const nextDueDate = new Date(expense.due_date + 'T12:00:00');
    nextDueDate.setMonth(nextDueDate.getMonth() + 1);

    await onUpdateExpense(expense.id, {
      installments_remaining: Math.max(0, remaining),
      is_paid: isNowPaid,
      due_date: isNowPaid ? expense.due_date : nextDueDate.toISOString().split('T')[0]
    });
    setConfirmPaymentId(null);
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Gestão Financeira</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">Saídas, vencimentos e parcelas</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={() => setModalType('TRIP')} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-[11px] uppercase text-slate-600 hover:border-primary-500 hover:text-primary-600 transition-all shadow-sm active:scale-95">
            <ReceiptText size={18} /> Viagem
          </button>
          <button onClick={() => { setModalType('FIXED'); setNewExpense({...newExpense, category: ExpenseCategory.FINANCING, is_paid: false}) }} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase shadow-xl hover:bg-black active:scale-95 transition-all">
            <Banknote size={18} /> Fixo / Parcelado
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
        {expenses.map((expense) => {
          const isOverdue = !expense.is_paid && expense.due_date && new Date(expense.due_date + 'T12:00:00') < new Date();
          const isInstallment = (expense.installments_total || 1) > 1;
          const current = (expense.installments_total || 1) - (expense.installments_remaining || 0) + 1;

          return (
            <div key={expense.id} className={`bg-white p-6 rounded-[2.5rem] border shadow-sm relative group hover:border-primary-200 transition-all ${isOverdue ? 'ring-2 ring-rose-100' : ''}`}>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-4 rounded-[1.5rem] ${expense.trip_id ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                  {expense.trip_id ? <ReceiptText size={24}/> : <Wallet size={24}/>}
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black uppercase text-slate-400 mb-1">Valor Unitário</div>
                  <div className="text-2xl font-black text-rose-600">R$ {expense.amount.toLocaleString()}</div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-black text-slate-800 leading-tight truncate">{expense.description}</h3>
                
                <div className="flex flex-wrap gap-2">
                  <span className="text-[9px] font-black uppercase bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200">{expense.category}</span>
                  {isInstallment && (
                    <span className="text-[9px] font-black uppercase bg-primary-50 text-primary-700 px-2 py-1 rounded-md border border-primary-100">
                      Parcela: {current > (expense.installments_total || 0) ? expense.installments_total : current}/{expense.installments_total}
                    </span>
                  )}
                </div>

                <div className="h-px bg-slate-50 my-2"></div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400">Próx. Vencimento</p>
                    <p className={`text-xs font-black ${isOverdue ? 'text-rose-600' : 'text-slate-700'}`}>{new Date(expense.due_date + 'T12:00:00').toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase text-slate-400">Status</p>
                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${expense.is_paid ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700 animate-pulse'}`}>
                      {expense.is_paid ? 'Liquidado' : 'Pendente'}
                    </span>
                  </div>
                </div>

                {!expense.is_paid && isInstallment && (
                  <button onClick={() => setConfirmPaymentId(expense.id)} className="w-full mt-4 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[11px] uppercase flex items-center justify-center gap-2 hover:bg-emerald-700 active:scale-95 transition-all shadow-lg shadow-emerald-200">
                    <Check size={16}/> Confirmar Pagamento Parcela
                  </button>
                )}
              </div>

              <div className="absolute top-4 right-4 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-white/80 p-1 rounded-lg backdrop-blur-sm">
                <button onClick={() => handleEdit(expense)} className="p-2 text-slate-400 hover:text-primary-600"><Edit2 size={16} /></button>
                <button onClick={() => { if(window.confirm('Excluir lançamento?')) onDeleteExpense(expense.id) }} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 size={16} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Lançamento (Bottom Sheet Mobile) */}
      {modalType && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4 z-[100] overflow-y-auto" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="bg-white rounded-t-[3rem] md:rounded-[3rem] w-full max-w-xl p-8 md:p-10 shadow-2xl animate-fade-in border border-white/20 h-[90vh] md:h-auto overflow-y-auto">
            <div className="flex justify-between items-center mb-8 pb-4 border-b">
              <div>
                <span className="text-[10px] font-black uppercase text-primary-600 tracking-widest">{modalType === 'FIXED' ? 'Gasto Fixo' : 'Gasto de Viagem'}</span>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none mt-1">
                  {editingExpenseId ? 'Editar Detalhes' : 'Novo Lançamento'}
                </h3>
              </div>
              <button onClick={resetForm} className="bg-slate-50 p-4 rounded-full text-slate-400 hover:bg-slate-100"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 pb-10">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Descrição do Gasto</label>
                <input required type="text" placeholder="Ex: Parcela do Caminhão" className="w-full p-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-primary-500 font-bold outline-none text-lg" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Valor R$</label>
                  <input required type="number" step="0.01" className="w-full p-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-primary-500 font-black text-2xl" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Categoria</label>
                  <div className="relative">
                    <select className="w-full p-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-primary-500 font-bold appearance-none pr-10" value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value as ExpenseCategory})}>
                      {Object.values(ExpenseCategory).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Data Registro</label>
                  <input required type="date" value={newExpense.date} className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none" onChange={e => setNewExpense({...newExpense, date: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Data Vencimento</label>
                  <input required type="date" value={newExpense.due_date} className="w-full p-5 bg-primary-50 border-2 border-primary-200 rounded-2xl font-black outline-none" onChange={e => setNewExpense({...newExpense, due_date: e.target.value})} />
                </div>
              </div>

              {modalType === 'FIXED' && (
                <div className="grid grid-cols-2 gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Qtd Parcelas</label>
                    <input type="number" min="1" className="w-full p-4 bg-white rounded-xl border font-black" value={newExpense.installments_total} onChange={e => setNewExpense({...newExpense, installments_total: e.target.value, installments_remaining: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Status Atual</label>
                    <button type="button" onClick={() => setNewExpense({...newExpense, is_paid: !newExpense.is_paid})} className={`w-full p-4 rounded-xl font-black text-[10px] uppercase border-2 transition-all ${newExpense.is_paid ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                      {newExpense.is_paid ? 'Já Pago' : 'Pendente'}
                    </button>
                  </div>
                </div>
              )}

              <button disabled={isSaving} type="submit" className={`w-full py-6 text-white rounded-[2rem] font-black text-xl shadow-2xl mt-4 transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${modalType === 'FIXED' ? 'bg-slate-900 hover:bg-black' : 'bg-primary-600 hover:bg-primary-700'}`}>
                {isSaving ? <Loader2 className="animate-spin" /> : <ShieldCheck size={24}/>}
                {isSaving ? 'Salvando...' : 'Confirmar Lançamento'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Pagamento de Parcela */}
      {confirmPaymentId && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6 z-[110] animate-fade-in">
          <div className="bg-white rounded-[3rem] w-full max-w-sm p-10 shadow-2xl text-center">
            <div className="bg-emerald-100 text-emerald-600 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={48} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Pagar Parcela?</h3>
            <p className="text-slate-500 font-bold text-sm mb-10 leading-relaxed">
              Deseja confirmar o pagamento da parcela atual? A quantidade restante será diminuída e o vencimento passará para o próximo mês.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setConfirmPaymentId(null)} className="py-5 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs hover:bg-slate-200 transition-all">
                Não, Cancelar
              </button>
              <button onClick={executePayment} className="py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                Sim, Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
