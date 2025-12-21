import React, { useState } from 'react';
import { Trip, Expense } from '../types';
import { getFinancialInsights } from '../services/geminiService';
import { Sparkles, Bot, ArrowRight, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown'; // Wait, standard libraries only. I'll render text simply or use a regex parser if needed, but for simplicity in this constrained environment, I will use whitespace-pre-wrap and simple formatting.

interface AiAssistantProps {
  trips: Trip[];
  expenses: Expense[];
}

export const AiAssistant: React.FC<AiAssistantProps> = ({ trips, expenses }) => {
  const [insight, setInsight] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleGenerateInsight = async () => {
    if (trips.length === 0 && expenses.length === 0) {
      setInsight("Por favor, adicione algumas viagens ou despesas primeiro para que eu possa analisar seus dados.");
      return;
    }
    setLoading(true);
    try {
      const result = await getFinancialInsights(trips, expenses);
      setInsight(result);
    } catch (error) {
      setInsight("Erro ao gerar análise. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4 py-8">
        <div className="inline-block p-4 bg-primary-100 rounded-full mb-2">
          <Bot size={48} className="text-primary-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Seu Analista Financeiro Pessoal</h2>
        <p className="text-gray-500 max-w-lg mx-auto">
          Use a inteligência artificial para encontrar padrões ocultos nas suas viagens, cortar custos desnecessários e aumentar sua margem de lucro.
        </p>
        
        <button 
          onClick={handleGenerateInsight}
          disabled={loading}
          className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2 mx-auto disabled:opacity-70"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" /> Analisando dados...
            </>
          ) : (
            <>
              <Sparkles /> Gerar Relatório de Inteligência
            </>
          )}
        </button>
      </div>

      {insight && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-fade-in">
          <div className="bg-gray-50 px-8 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
              <Sparkles size={18} className="text-primary-500"/> Resultado da Análise
            </h3>
            <span className="text-xs text-gray-400">Gerado por Gemini AI</span>
          </div>
          <div className="p-8 prose prose-blue max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
            {/* Simple rendering of the text response */}
            {insight}
          </div>
        </div>
      )}
      
      {!insight && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-70">
            <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-2">💰 Análise de Lucro</h4>
                <p className="text-sm text-gray-500">Descubra quais rotas estão te dando mais dinheiro e quais estão dando prejuízo.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-2">⛽ Combustível</h4>
                <p className="text-sm text-gray-500">Identifique gastos excessivos com abastecimento baseados na quilometragem.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-2">⚖️ Comparativo de Mercado</h4>
                <p className="text-sm text-gray-500">Saiba se o valor que você cobra está alinhado com o mercado atual.</p>
            </div>
        </div>
      )}
    </div>
  );
};
