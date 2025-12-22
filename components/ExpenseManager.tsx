import React, { useState } from 'react';
import { Expense, ExpenseCategory, Trip } from '../types';
import { Plus, Tag, Calendar, DollarSign, Trash2, Receipt } from 'lucide-react';

interface ExpenseManagerProps {
  expenses: Expense[];
  trips: Trip[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
}

export const ExpenseManager: React.FC<ExpenseManagerProps> = ({ expenses, trips, onAddExpense, onDeleteExpense }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    category: ExpenseCategory.FUEL,
    date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newExpense.description && newExpense.amount) {
      const expense: Omit<Expense, 'id'> = {
        description: newExpense.description,
        amount: Number(newExpense.amount),
        category: (newExpense.category as ExpenseCategory) || ExpenseCategory.OTHER,
        date: newExpense.date || new Date().toISOString(),
        trip_id: newExpense.trip_id
      };
      onAddExpense(expense);
      setIsModalOpen(false);
      setNewExpense({ category: ExpenseCategory.FUEL, date: new Date().toISOString().split('T')[0] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Controle de Despesas</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={20} />
          Nova Despesa
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Descrição</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoria</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Valor</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{expense.description}</div>
                    {expense.trip_id && (
                      <div className="text-xs text-gray-400">Vinculado à viagem</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(expense.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-rose-600">
                    - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expense.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => onDeleteExpense(expense.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Receipt className="mx-auto text-gray-300 mb-2" size={32} />
                    Nenhuma despesa registrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl animate-fade-in">
            <h3 className="text-xl font-bold mb-4">Lançar Despesa</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <input required type="text" placeholder="Ex: Abastecimento Posto X" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-rose-500 outline-none" 
                  onChange={e => setNewExpense({...newExpense, description: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                  <input required type="number" step="0.01" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-rose-500 outline-none" 
                    onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <select className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                    value={newExpense.category}
                    onChange={e => setNewExpense({...newExpense, category: e.target.value as ExpenseCategory})}
                  >
                    {Object.values(ExpenseCategory).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                  <input required type="date" value={newExpense.date} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-rose-500 outline-none" 
                    onChange={e => setNewExpense({...newExpense, date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vincular a Viagem (Opcional)</label>
                  <select className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                    onChange={e => setNewExpense({...newExpense, trip_id: e.target.value || undefined})}
                  >
                    <option value="">Sem vínculo</option>
                    {trips.map(t => (
                      <option key={t.id} value={t.id}>{t.origin} - {t.destination}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 px-4 border rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="flex-1 py-2 px-4 bg-rose-600 text-white rounded-lg hover:bg-rose-700">Salvar Despesa</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};