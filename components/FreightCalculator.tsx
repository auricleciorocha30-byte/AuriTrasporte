
import React, { useState, useMemo } from 'react';
import { ANTTParams } from '../types';
import { Calculator, AlertCircle, Info, Check, X, ChevronDown, DollarSign, Utensils, Construction } from 'lucide-react';
import { calculateANTT, ANTT_CARGO_TYPES } from '../services/anttService';

export const FreightCalculator: React.FC = () => {
  const [params, setParams] = useState<ANTTParams & { mealCost?: number, extraCosts?: number }>({
    distance: 400,
    axles: 5,
    cargoType: 'geral',
    isComposition: false,
    isHighPerformance: false,
    returnEmpty: false,
    tollCost: 0,
    mealCost: 0,
    extraCosts: 0
  });

  const [showResults, setShowResults] = useState(false);

  const results = useMemo(() => {
    return calculateANTT(params.distance, params.axles, params.cargoType, {
      toll: params.tollCost,
      daily: params.mealCost,
      other: params.extraCosts,
      returnEmpty: params.returnEmpty
    });
  }, [params]);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    if (params.distance > 0 && params.cargoType !== '') {
      setShowResults(true);
    } else {
      alert("Selecione o tipo de carga e informe a distância.");
    }
  };

  const Toggle = ({ label, value, onChange }: { label: string, value: boolean, onChange: (v: boolean) => void }) => (
    <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
      <span className="text-[11px] font-bold text-slate-500 uppercase">{label}?</span>
      <button 
        type="button"
        onClick={() => onChange(!value)}
        className={`w-14 h-7 rounded-md flex items-center px-1 transition-colors ${value ? 'bg-[#50c878]' : 'bg-[#f06464]'}`}
      >
        <div className={`w-8 h-5 bg-white rounded flex items-center justify-center text-[10px] font-black text-slate-800 transition-transform ${value ? 'translate-x-4' : 'translate-x-0'}`}>
          {value ? 'Sim' : 'Não'}
        </div>
      </button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-10">
      <div className="text-center py-6">
        <h2 className="text-2xl font-black text-[#2d50a0] uppercase tracking-tight">Cálculo de Frete (Res. 6.067/25)</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4">
        {/* Lado Esquerdo: Formulário */}
        <div className="lg:col-span-7 bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 space-y-6">
          <form onSubmit={handleCalculate} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase text-slate-400 ml-1">Tipo de Carga</label>
              <div className="relative">
                <select 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:bg-white appearance-none pr-10"
                  value={params.cargoType}
                  onChange={e => setParams({...params, cargoType: e.target.value})}
                >
                  <option value="">Selecione</option>
                  {ANTT_CARGO_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
                <ChevronDown size={20} className="absolute right-4 top-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase text-slate-400 ml-1">Número de Eixos</label>
                <select 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                  value={params.axles}
                  onChange={e => setParams({...params, axles: Number(e.target.value)})}
                >
                  {[2, 3, 4, 5, 6, 7, 9].map(n => <option key={n} value={n}>{n} Eixos</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase text-slate-400 ml-1">Distância (Km)</label>
                <input 
                  required
                  type="number" 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-xl outline-none"
                  value={params.distance || ''}
                  onChange={e => setParams({...params, distance: Number(e.target.value)})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1"><Construction size={12}/> Pedágio (R$)</label>
                <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none" value={params.tollCost || ''} onChange={e => setParams({...params, tollCost: Number(e.target.value)})} />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1"><Utensils size={12}/> Diárias/Ref. (R$)</label>
                <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none" value={params.mealCost || ''} onChange={e => setParams({...params, mealCost: Number(e.target.value)})} />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1"><DollarSign size={12}/> Outros (R$)</label>
                <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none" value={params.extraCosts || ''} onChange={e => setParams({...params, extraCosts: Number(e.target.value)})} />
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 space-y-1">
              <Toggle label="Alto Desempenho (Refeição apenas)" value={params.isHighPerformance} onChange={v => setParams({...params, isHighPerformance: v})} />
              <Toggle label="Retorno Vazio Obrigatório" value={params.returnEmpty} onChange={v => setParams({...params, returnEmpty: v})} />
            </div>

            <button 
              type="submit"
              className="w-full py-5 bg-[#2d50a0] text-white rounded-2xl font-black text-lg shadow-xl hover:brightness-110 active:scale-95 transition-all"
            >
              Calcular Frete Final
            </button>
          </form>
        </div>

        {/* Lado Direito: Resultados Visuais */}
        <div className="lg:col-span-5 bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 flex flex-col justify-between">
          <div className="text-center space-y-4">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-tight">
              VALOR FINAL A SER PAGO AO TRANSPORTADOR
            </h3>

            {showResults ? (
              <div className="py-6 animate-fade-in space-y-6">
                <div>
                  <h2 className="text-5xl font-black text-[#2d50a0]">
                    R$ {results.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h2>
                  <p className="text-[11px] font-black text-slate-400 uppercase mt-2">Frete Total Negociado</p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 text-left space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500 uppercase">Piso Mínimo ANTT:</span>
                    <span className="font-black text-slate-900">R$ {results.pisoMinimo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500 uppercase">Pedágios/Adicionais:</span>
                    <span className="font-black text-emerald-600">+ R$ {results.adicionais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="h-px bg-slate-200 my-2"></div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    CCD: {results.ccd.toFixed(4)} | CC: {results.cc.toFixed(2)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center gap-4 opacity-10">
                <Calculator size={80} />
                <p className="font-black uppercase text-xs tracking-widest">Aguardando Parâmetros</p>
              </div>
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100">
            <h4 className="text-[10px] font-black uppercase text-slate-900 mb-4">Notas Legais:</h4>
            <div className="space-y-4 text-[10px] text-slate-500 font-medium leading-relaxed overflow-y-auto max-h-60 pr-2 custom-scrollbar">
              <p>1. Se o número de eixos não estiver na tabela, utiliza-se o imediatamente inferior (ou superior se for o primeiro).</p>
              <p>2. Devem ser negociados valores dos incisos I, III e IV (despesas extras, tributos e taxas).</p>
              <p>3. Diárias que envolvem refeição e pernoite são acrescidas aos custos fixos definidos na resolução.</p>
              <p>4. No alto desempenho, incide apenas o custo com refeições.</p>
              <p>5. O pedágio é OBRIGATÓRIO e deve ser pago antecipadamente pelo embarcador (Lei 10.209/01).</p>
              <p>6. O retorno vazio é obrigatório para contêineres e frotas específicas (Art. 5º Res. 5.867).</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
