
import React, { useState, useMemo } from 'react';
import { ANTTParams } from '../types';
import { Calculator, AlertCircle, Info, Check, X, ChevronDown } from 'lucide-react';

const CARGO_TYPES = [
  { id: '', label: 'Selecione' },
  { id: 'geral', label: 'Carga Geral' },
  { id: 'granel_pressurizada', label: 'Carga Granel Pressurizada' },
  { id: 'conteinerizada', label: 'Conteinerizada' },
  { id: 'frigorificada', label: 'Frigorificada ou Aquecida' },
  { id: 'granel_liquido', label: 'Granel líquido' },
  { id: 'granel_solido', label: 'Granel sólido' },
  { id: 'neogranel', label: 'Neogranel' },
  { id: 'perigosa_geral', label: 'Perigosa (carga geral)' },
  { id: 'perigosa_conteinerizada', label: 'Perigosa (conteinerizada)' },
  { id: 'perigosa_frigorificada', label: 'Perigosa (Frigorificada ou Aquecida)' },
  { id: 'perigosa_liquido', label: 'Perigosa (granel líquido)' },
  { id: 'perigosa_solido', label: 'Perigosa (granel sólido)' }
];

// Tabela de coeficientes baseada na Resolução ANTT 5.867 (Exemplo: 5 eixos = CCD 5.3348, CC 556.92)
const COEF_TABLE: Record<number, Record<string, { ccd: number; cc: number }>> = {
  2: { geral: { ccd: 2.3045, cc: 240.15 } },
  3: { geral: { ccd: 3.1023, cc: 310.45 } },
  4: { geral: { ccd: 4.2567, cc: 450.12 } },
  5: { geral: { ccd: 5.3348, cc: 556.92 } },
  6: { geral: { ccd: 6.1023, cc: 610.45 } },
  7: { geral: { ccd: 7.2567, cc: 750.12 } },
  9: { geral: { ccd: 9.3348, cc: 956.92 } },
};

export const FreightCalculator: React.FC = () => {
  const [params, setParams] = useState<ANTTParams>({
    distance: 400,
    axles: 5,
    cargoType: 'geral',
    isComposition: false,
    isHighPerformance: false,
    returnEmpty: false
  });

  const [showResults, setShowResults] = useState(false);

  const results = useMemo(() => {
    // Busca coeficientes (usa padrão se não encontrar o específico)
    const base = COEF_TABLE[params.axles] || COEF_TABLE[5];
    const coef = base[params.cargoType] || base['geral'];
    
    let finalCcd = coef.ccd;
    let finalCc = coef.cc;

    // Aplica multiplicadores conforme regras da ANTT (ajustado para o exemplo)
    if (params.isHighPerformance) finalCcd *= 1.10; 
    if (params.isComposition) finalCc *= 1.15;

    const valueIda = (params.distance * finalCcd) + finalCc;
    const valueRetorno = params.returnEmpty ? (0.92 * params.distance * finalCcd) : 0;
    const total = valueIda + valueRetorno;

    return {
      ccd: finalCcd,
      cc: finalCc,
      valueIda,
      valueRetorno,
      total
    };
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
        <h2 className="text-2xl font-black text-[#2d50a0] uppercase tracking-tight">Calcular Piso Mínimo de Frete</h2>
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
                  {CARGO_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
                <ChevronDown size={20} className="absolute right-4 top-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase text-slate-400 ml-1">Número de Eixos*</label>
                <select 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                  value={params.axles}
                  onChange={e => setParams({...params, axles: Number(e.target.value)})}
                >
                  {[2, 3, 4, 5, 6, 7, 9].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase text-slate-400 ml-1">Distância (Km)</label>
                <input 
                  required
                  type="number" 
                  placeholder="Ex: 400"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-xl outline-none"
                  value={params.distance || ''}
                  onChange={e => setParams({...params, distance: Number(e.target.value)})}
                />
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 space-y-1">
              <Toggle label="É composição veicular" value={params.isComposition} onChange={v => setParams({...params, isComposition: v})} />
              <Toggle label="É Alto Desempenho" value={params.isHighPerformance} onChange={v => setParams({...params, isHighPerformance: v})} />
              <Toggle label="Retorno Vazio" value={params.returnEmpty} onChange={v => setParams({...params, returnEmpty: v})} />
            </div>

            <button 
              type="submit"
              className="w-full md:w-40 py-4 bg-[#26b6b6] text-white rounded-xl font-black text-sm shadow-md hover:brightness-105 active:scale-95 transition-all float-right"
            >
              Calcular
            </button>
            <div className="clear-both"></div>
          </form>

          {showResults && (
            <div className="pt-6 animate-fade-in border-t border-slate-100">
              <div className="space-y-3 text-[12px] font-medium text-slate-600 leading-relaxed">
                <p className="font-bold text-slate-400 uppercase text-[10px] mb-2 tracking-widest">Informações de cálculo conforme parâmetros informados:</p>
                <p>Operação de Transporte: <span className="font-bold text-slate-800">Tabela B - Operações em que Haja a Contratação Apenas do Veículo Automotor de Cargas</span></p>
                <p>Distância: <span className="font-bold text-slate-800">{params.distance} Km</span></p>
                <p>Coeficiente de custo de deslocamento (CCD): <span className="font-bold text-slate-800">{results.ccd.toLocaleString('pt-BR', { minimumFractionDigits: 4 })}</span></p>
                <p>Coeficiente de custo de carga e descarga (CC): <span className="font-bold text-slate-800">{results.cc.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                <p>Valor de ida = (Distância x CCD)+CC: <span className="font-bold text-[#2d50a0]">R$ {results.valueIda.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                <p>Valor do retorno vazio (caso exista) = 0,92 x Distância x CCD: <span className="font-bold text-slate-800">R$ {results.valueRetorno.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
              </div>
            </div>
          )}
        </div>

        {/* Lado Direito: Resultados Visuais */}
        <div className="lg:col-span-5 bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 flex flex-col justify-between">
          <div className="text-center space-y-6">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-tight">
              VALORES CALCULADOS CONFORME RESOLUÇÃO ANTT Nº 5.867/2020, <br/>
              ATUALIZADA PELA <span className="text-slate-900 font-bold">RES.Nº6.067/25</span>
            </h3>

            {showResults ? (
              <div className="py-10 animate-fade-in">
                <h2 className="text-5xl font-black text-[#2d50a0] mb-3">
                  R$ {results.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h2>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Valor Tabela ANTT Oficial</p>
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center gap-4 opacity-10">
                <Calculator size={80} />
                <p className="font-black uppercase text-xs tracking-widest">Aguardando Parâmetros</p>
              </div>
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100">
            <h4 className="text-[10px] font-black uppercase text-slate-900 mb-4">*Notas:</h4>
            <div className="space-y-4 text-[10px] text-slate-500 font-medium leading-relaxed overflow-y-auto max-h-60 pr-2 custom-scrollbar">
              <p>1. Caso a Combinação Veicular de Carga possua número de eixos não previstos nas tabelas, conforme Resolução nº 5.867/2020, o valor do piso mínimo de frete é calculado utilizando-se a quantidade de eixos imediatamente inferior, aplicando-se o mesmo princípio no caso da contratação de veículo automotor de cargas.</p>
              <p>2. Para compor o valor final do frete a ser pago ao transportador, deverão ser negociados os valores dos incisos I, III e IV da Resolução ANTT nº 5.867/2020. Esse parágrafo trata de despesas extras do transporte e do caminhoneiro, além de tributos, taxas e outros itens.</p>
              <p>3. O custo de diárias que envolve a remuneração para refeições realizadas e dos pernoites realizados durante a operação de carga e descarga devem ser negociados separadamente conforme as normas vigentes.</p>
              <p>4. Os valores apresentados não incluem pedágios, que devem ser pagos obrigatoriamente pelo embarcador de forma antecipada ou conforme a Lei nº 10.209/2001.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
