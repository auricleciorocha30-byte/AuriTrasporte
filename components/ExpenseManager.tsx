
import React, { useState } from 'react';
import { Expense, ExpenseCategory, Trip } from '../types';
import { Plus, Tag, Calendar, DollarSign, Trash2, Receipt, Loader2 } from 'lucide-react';

interface ExpenseManagerProps {
  expenses: Expense[];
  trips: Trip[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
  isSaving?: boolean;
}

// Função para pegar a data de hoje no formato YYYY-MM-DD local
const getTodayLocal = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Função auxiliar para formatar data sem erro de fuso horário
const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

export const ExpenseManager: React.FC<ExpenseManagerProps> = ({ expenses, trips, onAddExpense, onDeleteExpense, isSaving }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    category: ExpenseCategory.FUEL,
    date: getTodayLocal()
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newExpense.description && newExpense.amount) {
      const expense: Omit<Expense, 'id'> = {
        description: newExpense.description,
        amount: Number(newExpense.amount),
        category: (newExpense.category as ExpenseCategory) || ExpenseCategory.OTHER,
        date: newExpense.date || getTodayLocal(),
        trip_id: newExpense.trip_id || null
      };
      await onAddExpense(expense);
      setIsModalOpen(false);
      setNewExpense({ category: ExpenseCategory.FUEL, date: getTodayLocal() });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-2">
        <h2 className="text-2xl font-black text-slate-900">Despesas</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-rose-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold shadow-lg active:scale-95 transition-all"
        >
          <Plus size={20} /> Nova Despesa
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden mx-2">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">Descrição</th>
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
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 text-[10px] font-black uppercase rounded-full bg-slate-100 text-slate-600">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-500">
                    {formatDateDisplay(expense.date)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-black text-rose-600">
                    - R$ {expense.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => onDeleteExpense(expense.id)}
                      className="text-slate-300 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl animate-fade-in">
            <h3 className="text-2xl font-black mb-6">Lançar Despesa</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-slate-400 ml-1">Descrição</label>
                <input required type="text" placeholder="Ex: Abastecimento" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold focus:ring-2 focus:ring-rose-500 outline-none" 
                  value={newExpense.description || ''} onChange={e => setNewExpense({...newExpense, description: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-slate-400 ml-1">Valor (R$)</label>
                  <input required type="number" step="0.01" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 font-black text-xl outline-none" 
                    value={newExpense.amount || ''} onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-slate-400 ml-1">Categoria</label>
                  <select className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold"
                    value={newExpense.category}
                    onChange={e => setNewExpense({...newExpense, category: e.target.value as ExpenseCategory})}
                  >
                    {Object.values(ExpenseCategory).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-slate-400 ml-1">Data</label>
                <input required type="date" value={newExpense.date} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold" 
                  onChange={e => setNewExpense({...newExpense, date: e.target.value})} />
              </div>

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-bold border rounded-2xl">Cancelar</button>
                <button disabled={isSaving} type="submit" className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black shadow-lg flex items-center justify-center gap-2">
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
