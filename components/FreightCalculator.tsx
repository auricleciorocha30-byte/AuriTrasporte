
import React, { useState, useMemo } from 'react';
import { ANTTParams } from '../types';
import { Calculator, ChevronDown, Info } from 'lucide-react';
import { calculateANTT, ANTT_CARGO_TYPES } from '../services/anttService';

export const FreightCalculator: React.FC = () => {
  const [params, setParams] = useState<ANTTParams>({
    distance: 1,
    axles: 2,
    cargoType: 'geral',
    isComposition: false,
    isHighPerformance: false,
    returnEmpty: false,
  });

  const [showResults, setShowResults] = useState(false);

  const results = useMemo(() => {
    return calculateANTT(params.distance, params.axles, params.cargoType, {
      returnEmpty: params.returnEmpty,
      isComposition: params.isComposition,
      isHighPerformance: params.isHighPerformance
    });
  }, [params]);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setShowResults(true);
  };

  const ToggleRow = ({ label, description, value, onChange }: { label: string, description?: string, value: boolean, onChange: (v: boolean) => void }) => (
    <div className="flex justify-between items-center py-4 border-b border-slate-50 last:border-0">
      <div>
        <span className="text-sm font-semibold text-slate-500">{label}</span>
        {description && <p className="text-[10px] text-slate-400 mt-0.5">{description}</p>}
      </div>
      <button 
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-12 h-6 rounded-md transition-colors ${value ? 'bg-[#50c878]' : 'bg-[#f06464]'}`}
      >
        <div className={`absolute top-0.5 left-0.5 right-0.5 bottom-0.5 bg-white rounded-sm flex items-center justify-center text-[10px] font-bold text-slate-600 shadow-sm transition-all ${value ? 'translate-x-0 ml-4' : 'translate-x-0 mr-4'}`}>
          {value ? 'Sim' : 'Não'}
        </div>
      </button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-20">
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 md:p-12">
        <form onSubmit={handleCalculate} className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Tipo de Carga</label>
            <div className="relative">
              <select 
                className="w-full p-3 bg-white border border-slate-200 rounded-lg font-medium text-slate-700 outline-none focus:ring-1 focus:ring-primary-500 appearance-none pr-10"
                value={params.cargoType}
                onChange={e => setParams({...params, cargoType: e.target.value})}
              >
                {ANTT_CARGO_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              <ChevronDown size={18} className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Número de Eixos*</label>
              <select 
                className="w-full p-3 bg-white border border-slate-200 rounded-lg font-medium text-slate-700 outline-none"
                value={params.axles}
                onChange={e => setParams({...params, axles: Number(e.target.value)})}
              >
                {[2, 3, 4, 5, 6, 7, 9].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Distância</label>
              <input 
                required
                type="number" 
                className="w-full p-3 bg-white border border-slate-200 rounded-lg font-medium text-slate-700 outline-none"
                value={params.distance || ''}
                onChange={e => setParams({...params, distance: e.target.value === '' ? 0 : Number(e.target.value)})}
              />
            </div>
          </div>

          <div className="space-y-1">
            <ToggleRow 
              label="É composição veicular?" 
              description="(veículo automotor + implemento ou caminhão simples)" 
              value={params.isComposition || false} 
              onChange={v => setParams({...params, isComposition: v})} 
            />
            <ToggleRow 
              label="É Alto Desempenho?" 
              value={params.isHighPerformance || false} 
              onChange={v => setParams({...params, isHighPerformance: v})} 
            />
            <ToggleRow 
              label="Retorno Vazio?" 
              value={params.returnEmpty} 
              onChange={v => setParams({...params, returnEmpty: v})} 
            />
          </div>

          <div className="flex justify-end pt-4">
            <button 
              type="submit"
              className="bg-[#48C0C8] text-white px-10 py-3 rounded-md font-bold text-sm hover:brightness-105 active:scale-95 transition-all"
            >
              Calcular
            </button>
          </div>
        </form>

        {showResults && (
          <div className="mt-10 pt-10 border-t border-slate-100 animate-fade-in text-slate-500 text-sm space-y-2">
            <p className="font-medium">Informações de cálculo conforme parâmetros informados:</p>
            <p>Operação de Transporte: <span className="font-bold text-slate-700">{results.tabela}</span></p>
            <p>Distância: <span className="font-bold text-slate-700">{params.distance} Km</span></p>
            <p>Coeficiente de custo de deslocamento (CCD): <span className="font-bold text-slate-700">{results.ccd.toFixed(4).replace('.', ',')}</span></p>
            <p>Coeficiente de custo de carga e descarga (CC): <span className="font-bold text-slate-700">{results.cc.toFixed(2).replace('.', ',')}</span></p>
            <p>Valor de ida = (Distância x CCD)+CC: <span className="font-bold text-slate-700">{results.valorIda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
            <p>Valor do retorno vazio (caso exista) = 0,92 x Distância x CCD: <span className="font-bold text-slate-700">{results.valorRetornoVazio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
            
            <div className="mt-6 p-4 bg-slate-50 rounded-xl">
               <p className="text-xs font-black uppercase text-slate-400 mb-1">Total do Frete Piso Mínimo</p>
               <p className="text-3xl font-black text-[#2d50a0]">R$ {results.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
