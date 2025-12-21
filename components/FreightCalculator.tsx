import React, { useState } from 'react';
import { ANTTParams } from '../types';
import { getSmartFreightEstimation } from '../services/geminiService';
import { Calculator, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export const FreightCalculator: React.FC = () => {
  const [params, setParams] = useState<ANTTParams>({
    distance: 0,
    axles: 5,
    cargoType: 'general',
    returnEmpty: false,
    tollCost: 0,
    otherCosts: 0,
    profitMargin: 20
  });

  const [result, setResult] = useState<{ minPrice: number, marketPrice: number, reasoning: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const estimation = await getSmartFreightEstimation(params);
      setResult(estimation);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-primary-900 to-primary-700 rounded-2xl p-8 text-white shadow-lg">
        <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Calculator /> Calculadora de Frete ANTT
        </h2>
        <p className="text-primary-100 opacity-90">
          Simule o valor do piso mínimo de frete e obtenha uma estimativa de mercado baseada em inteligência artificial.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleCalculate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Distância (km)</label>
                <input required type="number" value={params.distance || ''} onChange={e => setParams({...params, distance: Number(e.target.value)})} 
                  className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nº de Eixos</label>
                <select value={params.axles} onChange={e => setParams({...params, axles: Number(e.target.value)})}
                  className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500">
                  {[2, 3, 4, 5, 6, 7, 9].map(n => <option key={n} value={n}>{n} Eixos</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Carga</label>
                <select value={params.cargoType} onChange={e => setParams({...params, cargoType: e.target.value as any})}
                  className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="general">Carga Geral</option>
                  <option value="bulk">Granel Sólido</option>
                  <option value="refrigerated">Frigorificada</option>
                  <option value="dangerous">Perigosa</option>
                  <option value="neogranel">Neogranel</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Margem de Lucro (%)</label>
                <input type="number" value={params.profitMargin} onChange={e => setParams({...params, profitMargin: Number(e.target.value)})} 
                  className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custo Pedágio (R$)</label>
                <input type="number" value={params.tollCost || ''} onChange={e => setParams({...params, tollCost: Number(e.target.value)})} 
                  className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Outros Custos (R$)</label>
                <input type="number" value={params.otherCosts || ''} onChange={e => setParams({...params, otherCosts: Number(e.target.value)})} 
                  className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" placeholder="Alimentação, etc." />
              </div>
            </div>

            <div className="flex items-center gap-2 py-2">
              <input type="checkbox" id="emptyReturn" checked={params.returnEmpty} onChange={e => setParams({...params, returnEmpty: e.target.checked})} 
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500" />
              <label htmlFor="emptyReturn" className="text-sm text-gray-700">Retorno Vazio (Cobra dobrado ou taxa extra)</label>
            </div>

            <button disabled={loading} type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-lg transition-all shadow-md flex justify-center items-center gap-2">
              {loading ? <Loader2 className="animate-spin" /> : <Calculator />}
              Calcular Frete
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="lg:col-span-1 space-y-4">
          {result ? (
            <>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-primary-500 border-gray-100">
                <p className="text-sm text-gray-500 uppercase font-semibold mb-1">Piso Mínimo ANTT</p>
                <h3 className="text-3xl font-bold text-gray-900">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(result.minPrice)}
                </h3>
                <p className="text-xs text-gray-400 mt-1">Valor base regulatório.</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-emerald-500 border-gray-100">
                <p className="text-sm text-gray-500 uppercase font-semibold mb-1">Preço de Mercado Sugerido</p>
                <h3 className="text-3xl font-bold text-emerald-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(result.marketPrice)}
                </h3>
                <p className="text-xs text-gray-400 mt-1">Considerando lucro e demanda.</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
                <p className="font-semibold flex items-center gap-2 mb-1"><AlertCircle size={16}/> Análise Inteligente:</p>
                {result.reasoning}
              </div>
            </>
          ) : (
            <div className="h-full bg-gray-50 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
              <Calculator size={48} className="mb-4 opacity-50" />
              <p>Preencha os dados e calcule para ver as estimativas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
