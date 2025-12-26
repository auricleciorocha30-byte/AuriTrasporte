
import React, { useState } from 'react';
import { Expense, ExpenseCategory, Trip, Vehicle } from '../types';
import { Trash2, ChevronDown, ReceiptText, Banknote, Loader2, Edit2, CheckCircle2, X, ShieldCheck, Wallet, Calendar, ArrowRightCircle, Check, Info, AlertCircle } from 'lucide-react';

interface ExpenseManagerProps {
  expenses: Expense[];
  trips: Trip[];
  vehicles: Vehicle[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  onUpdateExpense?: (id: string, expense: Partial<Expense>) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
  isSaving?: boolean;
}

const getToday = () => new Date().toISOString().split('T')[0];

export const ExpenseManager: React.FC<ExpenseManagerProps> = ({ expenses, trips, vehicles, onAddExpense, onUpdateExpense, onDeleteExpense, isSaving }) => {
  const [modalType, setModalType] = useState<'TRIP' | 'FIXED' | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [confirmPaymentId, setConfirmPaymentId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<any>({
    category: ExpenseCategory.FUEL,
    date: getToday(),
    due_date: getToday(),
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
    setFormData({ 
      category: ExpenseCategory.FUEL, 
      date: getToday(), 
      due_date: getToday(),
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
    setModalType(expense.trip_id ? 'TRIP' : 'FIXED');
    setFormData({
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
    const payload = {
      description: formData.description,
      amount: Number(formData.amount),
      category: formData.category,
      date: formData.date,
      due_date: modalType === 'FIXED' ? formData.due_date : formData.date,
      trip_id: modalType === 'TRIP' ? (formData.trip_id || null) : null,
      vehicle_id: formData.vehicle_id || null,
      is_paid: formData.is_paid,
      installments_total: Number(formData.installments_total),
      installments_remaining: Number(formData.installments_remaining)
    };

    if (editingExpenseId && onUpdateExpense) {
      await onUpdateExpense(editingExpenseId, payload);
    } else {
      await onAddExpense(payload);
    }
    resetForm();
  };

  const executePayment = async () => {
    if (!confirmPaymentId || !onUpdateExpense) return;
    const expense = expenses.find(e => e.id === confirmPaymentId);
    if (!expense) return;

    const remaining = (expense.installments_remaining || 1) - 1;
    const isNowPaid = remaining <= 0;
    
    // Calcula próxima data (daqui a 30 dias)
    const currentDueDate = new Date(expense.due_date + 'T12:00:00');
    currentDueDate.setMonth(currentDueDate.getMonth() + 1);

    await onUpdateExpense(expense.id, {
      installments_remaining: Math.max(0, remaining),
      is_paid: isNowPaid, // Só marca como liquidado total se o contador zerar
      due_date: isNowPaid ? expense.due_date : currentDueDate.toISOString().split('T')[0]
    });
    setConfirmPaymentId(null);
  };

  return (
    <div className="space-y-8 pb-32 animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Financeiro</h2>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-2">Gestão de Lucro e Despesas</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button onClick={() => setModalType('TRIP')} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-5 bg-white border-2 border-slate-100 rounded-[2rem] font-black text-xs uppercase text-slate-600 hover:border-primary-500 hover:text-primary-600 transition-all shadow-sm active:scale-95">
            <ReceiptText size={20} /> Viagem
          </button>
          <button onClick={() => { setModalType('FIXED'); setFormData({...formData, category: ExpenseCategory.FINANCING, is_paid: false}) }} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase shadow-2xl hover:bg-black active:scale-95 transition-all">
            <Banknote size={20} /> Gasto Fixo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
        {expenses.map((expense) => {
          const isOverdue = !expense.is_paid && expense.due_date && new Date(expense.due_date + 'T12:00:00') < new Date();
          const isInstallment = (expense.installments_total || 1) > 1;
          const currentIdx = (expense.installments_total || 1) - (expense.installments_remaining || 0) + 1;

          return (
            <div key={expense.id} className={`bg-white p-8 rounded-[3rem] border-2 shadow-sm relative group hover:border-primary-500 transition-all ${isOverdue ? 'border-rose-200 ring-4 ring-rose-50' : 'border-slate-50'}`}>
              <div className="flex justify-between items-start mb-6">
                <div className={`p-5 rounded-[1.5rem] ${expense.trip_id ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                  {expense.trip_id ? <ReceiptText size={28}/> : <Wallet size={28}/>}
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black uppercase text-slate-400 mb-1">Valor Unitário</div>
                  <div className="text-3xl font-black text-rose-500">R$ {expense.amount.toLocaleString()}</div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-black text-slate-800 leading-tight truncate">{expense.description}</h3>
                
                <div className="flex flex-wrap gap-2">
                  <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-500 px-3 py-1 rounded-lg">{expense.category}</span>
                  {isInstallment && (
                    <span className="text-[10px] font-black uppercase bg-primary-100 text-primary-700 px-3 py-1 rounded-lg flex items-center gap-1">
                      <Calendar size={12}/> Parcela: {currentIdx > (expense.installments_total || 0) ? expense.installments_total : currentIdx}/{expense.installments_total}
                    </span>
                  )}
                </div>

                <div className="h-px bg-slate-50 my-2"></div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Vencimento</p>
                    <p className={`text-sm font-black ${isOverdue ? 'text-rose-600' : 'text-slate-700'}`}>{new Date(expense.due_date + 'T12:00:00').toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-slate-400">Status</p>
                    <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-lg ${expense.is_paid ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {expense.is_paid ? 'Concluído' : 'Pendente'}
                    </span>
                  </div>
                </div>

                {!expense.is_paid && isInstallment && (
                  <button onClick={() => setConfirmPaymentId(expense.id)} className="w-full mt-4 py-4 bg-emerald-600 text-white rounded-[1.5rem] font-black text-xs uppercase flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-xl shadow-emerald-200 active:scale-95 transition-all">
                    <Check size={18}/> Pagar Parcela Atual
                  </button>
                )}
              </div>

              <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(expense)} className="p-3 bg-white shadow-md rounded-full text-slate-400 hover:text-primary-600"><Edit2 size={16} /></button>
                <button onClick={() => { if(confirm('Excluir?')) onDeleteExpense(expense.id) }} className="p-3 bg-white shadow-md rounded-full text-slate-400 hover:text-rose-600"><Trash2 size={16} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Sheet Modal */}
      {modalType && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-6 z-[100] animate-fade-in" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="bg-white rounded-t-[4rem] md:rounded-[3rem] w-full max-w-xl p-10 md:p-12 shadow-2xl animate-slide-up h-[92vh] md:h-auto overflow-y-auto">
            <div className="flex justify-between items-center mb-10">
              <div>
                <span className="text-xs font-black uppercase text-primary-600 tracking-[0.2em]">{modalType === 'FIXED' ? 'Custo Fixo' : 'Gasto Operacional'}</span>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none mt-2">
                  {editingExpenseId ? 'Editar Registro' : 'Novo Lançamento'}
                </h3>
              </div>
              <button onClick={resetForm} className="bg-slate-100 p-5 rounded-full text-slate-400 hover:text-slate-900 transition-all"><X size={28} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 pb-12">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-slate-400 ml-1">Descrição</label>
                <input required type="text" placeholder="Ex: Parcela do Cavalo" className="w-full p-6 bg-slate-50 rounded-3xl border-2 border-transparent focus:border-primary-500 font-bold outline-none text-xl transition-all" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-slate-400 ml-1">Valor (R$)</label>
                  <input required type="number" step="0.01" className="w-full p-6 bg-slate-50 rounded-3xl border-2 border-transparent focus:border-primary-500 font-black text-3xl text-rose-500 outline-none" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-slate-400 ml-1">Categoria</label>
                  <div className="relative">
                    <select className="w-full p-6 bg-slate-50 rounded-3xl border-2 border-transparent focus:border-primary-500 font-bold appearance-none pr-12 outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as ExpenseCategory})}>
                      {Object.values(ExpenseCategory).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-slate-400 ml-1">Vencimento</label>
                  <input required type="date" value={formData.due_date} className="w-full p-6 bg-primary-50 border-2 border-primary-100 rounded-3xl font-black outline-none" onChange={e => setFormData({...formData, due_date: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-slate-400 ml-1">Data Registro</label>
                  <input required type="date" value={formData.date} className="w-full p-6 bg-slate-50 rounded-3xl font-bold outline-none" onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
              </div>

              {modalType === 'FIXED' && (
                <div className="p-8 bg-slate-900 rounded-[3rem] text-white flex justify-between items-center gap-6">
                  <div className="flex-1 space-y-2">
                    <label className="text-[11px] font-black uppercase text-slate-500 tracking-widest">Quantidade de Parcelas</label>
                    <input type="number" min="1" className="w-full bg-slate-800 p-5 rounded-2xl font-black text-2xl border-none outline-none text-primary-400" value={formData.installments_total} onChange={e => setFormData({...formData, installments_total: e.target.value, installments_remaining: e.target.value})} />
                  </div>
                  <div className="w-px h-16 bg-slate-800"></div>
                  <button type="button" onClick={() => setFormData({...formData, is_paid: !formData.is_paid})} className={`flex-1 p-5 rounded-2xl font-black text-[10px] uppercase tracking-tighter transition-all border-2 ${formData.is_paid ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                    {formData.is_paid ? 'Já Liquidado' : 'Aguardando Pagto'}
                  </button>
                </div>
              )}

              <button disabled={isSaving} type="submit" className="w-full py-8 bg-primary-600 text-white rounded-[2.5rem] font-black text-2xl shadow-2xl shadow-primary-200 hover:bg-primary-700 active:scale-95 transition-all flex items-center justify-center gap-4">
                {isSaving ? <Loader2 className="animate-spin" /> : <ShieldCheck size={32}/>}
                {isSaving ? 'Gravando...' : 'Confirmar Lançamento'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {confirmPaymentId && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-6 z-[110] animate-fade-in">
          <div className="bg-white rounded-[3.5rem] w-full max-w-sm p-12 shadow-2xl text-center border border-white/20">
            <div className="bg-emerald-100 text-emerald-600 p-8 rounded-full w-28 h-28 flex items-center justify-center mx-auto mb-8 shadow-inner">
              <CheckCircle2 size={56} />
            </div>
            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4 leading-none">Pagar Parcela?</h3>
            <p className="text-slate-500 font-bold text-sm mb-12 leading-relaxed px-4">
              Deseja confirmar o pagamento? O sistema atualizará o vencimento para o próximo mês automaticamente.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setConfirmPaymentId(null)} className="py-6 bg-slate-100 text-slate-600 rounded-3xl font-black uppercase text-xs hover:bg-slate-200 transition-all">
                Não
              </button>
              <button onClick={executePayment} className="py-6 bg-emerald-600 text-white rounded-3xl font-black uppercase text-xs shadow-2xl shadow-emerald-200 hover:bg-emerald-700 transition-all">
                Sim, Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
