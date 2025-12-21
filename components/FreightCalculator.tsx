import React, { useState, useMemo } from 'react';
import { ANTTParams } from '../types';
import { Calculator, AlertCircle, TrendingUp, DollarSign } from 'lucide-react';

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

  const calculation = useMemo(() => {
    if (!params.distance) return null;

    // Coeficientes fictícios baseados na estrutura ANTT
    // (Apenas para fins ilustrativos de um cálculo determinístico)
    const baseRatePerKm = 1.15; // Custo km
    const axleMultiplier = 0.45; // Adicional por eixo
    const typeMultipliers = {
      general: 1.0,
      bulk: 1.1,
      refrigerated: 1.25,
      dangerous: 1.4,
      neogranel: 1.15
    };

    const costPerKm = (baseRatePerKm + (params.axles * axleMultiplier)) * typeMultipliers[params.cargoType];
    let totalCost = (params.distance * costPerKm) + params.tollCost + params.otherCosts;

    if (params.returnEmpty) {
      totalCost *= 1.8; // Acréscimo pelo retorno vazio
    }

    const minPrice = totalCost;
    const marketPrice = totalCost * (1 + (params.profitMargin / 100));

    return { minPrice, marketPrice };
  }, [params]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-primary-900 to-primary-700 rounded-2xl p-8 text-white shadow-lg">
        <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Calculator /> Calculadora de Frete
        </h2>
        <p className="text-primary-100 opacity-90">
          Estimativa de custos e sugestão de preço baseada em quilometragem, eixos e tipo de carga.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <form className="space-y-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Margem de Lucro Desejada (%)</label>
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
                  className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" placeholder="0.00" />
              </div>
            </div>

            <div className="flex items-center gap-2 py-2">
              <input type="checkbox" id="emptyReturn" checked={params.returnEmpty} onChange={e => setParams({...params, returnEmpty: e.target.checked})} 
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500" />
              <label htmlFor="emptyReturn" className="text-sm text-gray-700">Considerar retorno vazio</label>
            </div>
          </form>
        </div>

        <div className="lg:col-span-1 space-y-4">
          {calculation ? (
            <>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-slate-400 border-gray-100">
                <p className="text-xs text-gray-500 uppercase font-bold mb-1 flex items-center gap-1"><DollarSign size={14}/> Custo Total Estimado</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculation.minPrice)}
                </h3>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-emerald-500 border-gray-100">
                <p className="text-xs text-emerald-600 uppercase font-bold mb-1 flex items-center gap-1"><TrendingUp size={14}/> Sugestão p/ Lucro</p>
                <h3 className="text-3xl font-bold text-emerald-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculation.marketPrice)}
                </h3>
                <p className="text-[10px] text-gray-400 mt-2">Cálculo baseado em custos informados + margem de {params.profitMargin}%.</p>
              </div>

              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-xs text-amber-800">
                <p className="font-semibold flex items-center gap-2 mb-1"><AlertCircle size={14}/> Nota Legal:</p>
                Estes valores são estimativas baseadas em custos operacionais padrão. Sempre consulte a tabela oficial vigente da ANTT para contratos formais.
              </div>
            </>
          ) : (
            <div className="h-full bg-gray-50 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
              <Calculator size={48} className="mb-4 opacity-50" />
              <p className="text-sm">Informe a distância para calcular as estimativas de frete.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};