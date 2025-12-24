
import React, { useState, useMemo } from 'react';
import { ANTTParams } from '../types';
import { Calculator, AlertCircle, Info, Check, X } from 'lucide-react';

const CARGO_TYPES = [
  { id: 'geral', label: 'Carga Geral' },
  { id: 'granel_solido', label: 'Granel Sólido' },
  { id: 'granel_liquido', label: 'Granel Líquido' },
  { id: 'frigorificada', label: 'Carga Frigorificada' },
  { id: 'conteinerizada', label: 'Carga Conteinerizada' },
  { id: 'perigosa', label: 'Carga Perigosa' },
  { id: 'neogranel', label: 'Neogranel' }
];

// Tabela simplificada de coeficientes baseada na Resolução ANTT 5.867
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
    distance: 0,
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
    
    // Ajustes fictícios para Alto Desempenho e Composição
    let finalCcd = coef.ccd;
    let finalCc = coef.cc;

    if (params.isHighPerformance) finalCcd *= 1.15;
    if (params.isComposition) finalCc *= 1.20;

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
    if (params.distance > 0) setShowResults(true);
  };

  const Toggle = ({ label, value, onChange }: { label: string, value: boolean, onChange: (v: boolean) => void }) => (
    <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs font-bold text-slate-500 uppercase">{label}?</span>
      <button 
        type="button"
        onClick={() => onChange(!value)}
        className={`w-14 h-7 rounded-md flex items-center px-1 transition-colors ${value ? 'bg-[#50c878]' : 'bg-[#f06464]'}`}
      >
        <div className={`w-8 h-5 bg-white rounded flex items-center justify-center text-[10px] font-bold text-slate-800 transition-transform ${value ? 'translate-x-4' : 'translate-x-0'}`}>
          {value ? 'Sim' : 'Não'}
        </div>
      </button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center py-6">
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Calcular Piso Mínimo de Frete</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-2">
        {/* Lado Esquerdo: Formulário */}
        <div className="lg:col-span-6 bg-white rounded-[2.5rem] border shadow-sm p-8 space-y-6">
          <form onSubmit={handleCalculate} className="space-y-6">
            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-slate-400 ml-1">Tipo de Carga</label>
              <select 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:bg-white"
                value={params.cargoType}
                onChange={e => setParams({...params, cargoType: e.target.value})}
              >
                {CARGO_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-slate-400 ml-1">Número de Eixos*</label>
                <select 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none"
                  value={params.axles}
                  onChange={e => setParams({...params, axles: Number(e.target.value)})}
                >
                  {[2, 3, 4, 5, 6, 7, 9].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-slate-400 ml-1">Distância</label>
                <input 
                  required
                  type="number" 
                  placeholder="KM"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xl outline-none"
                  value={params.distance || ''}
                  onChange={e => setParams({...params, distance: Number(e.target.value)})}
                />
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-2">
              <Toggle label="É composição veicular" value={params.isComposition} onChange={v => setParams({...params, isComposition: v})} />
              <Toggle label="É Alto Desempenho" value={params.isHighPerformance} onChange={v => setParams({...params, isHighPerformance: v})} />
              <Toggle label="Retorno Vazio" value={params.returnEmpty} onChange={v => setParams({...params, returnEmpty: v})} />
            </div>

            <button 
              type="submit"
              className="w-full py-5 bg-[#26b6b6] text-white rounded-2xl font-black text-xl shadow-lg hover:brightness-110 active:scale-95 transition-all"
            >
              Calcular
            </button>
          </form>

          {showResults && (
            <div className="pt-4 animate-fade-in">
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200 text-xs font-medium text-slate-600 space-y-2">
                <p className="font-bold text-slate-400 uppercase text-[10px]">Parâmetros informados:</p>
                <p>Operação de Transporte: <span className="font-bold">Tabela B - Contratação do Veículo</span></p>
                <p>Distância: <span className="font-bold">{params.distance} Km</span></p>
                <p>Coeficiente de custo de deslocamento (CCD): <span className="font-bold">{results.ccd.toFixed(4)}</span></p>
                <p>Coeficiente de custo de carga e descarga (CC): <span className="font-bold">{results.cc.toFixed(2)}</span></p>
                <p>Valor de ida = (Distância x CCD)+CC: <span className="font-bold text-slate-800">R$ {results.valueIda.toLocaleString()}</span></p>
                <p>Valor do retorno vazio (caso exista) = 0,92 x Distância x CCD: <span className="font-bold text-slate-800">R$ {results.valueRetorno.toLocaleString()}</span></p>
              </div>
            </div>
          )}
        </div>

        {/* Lado Direito: Resultados Detalhados */}
        <div className="lg:col-span-6 bg-white rounded-[2.5rem] border shadow-sm p-8 flex flex-col justify-between">
          <div className="text-center space-y-6">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-tight">
              VALORES CALCULADOS CONFORME RESOLUÇÃO ANTT Nº 5.867/2020, <br/>
              ATUALIZADA PELA <span className="text-slate-900 font-bold">RES.Nº6.067/25</span>
            </h3>

            {showResults ? (
              <div className="py-10 animate-fade-in">
                <h2 className="text-5xl font-black text-[#2d50a0] mb-2">
                  R$ {results.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Valor Tabela ANTT Oficial</p>
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center gap-4 opacity-20">
                <Calculator size={80} />
                <p className="font-bold">Aguardando parâmetros...</p>
              </div>
            )}
          </div>

          <div className="mt-10 pt-10 border-t border-slate-100">
            <h4 className="text-[10px] font-black uppercase text-slate-900 mb-4">*Notas:</h4>
            <div className="space-y-4 text-[10px] text-slate-500 font-medium leading-relaxed overflow-y-auto max-h-64 pr-2 custom-scrollbar">
              <p>1. Caso a Combinação Veicular de Carga possua número de eixos não previstos nas tabelas, conforme Resolução nº 5.867/2020, o valor do piso mínimo de frete é calculado utilizando-se a quantidade de eixos imediatamente inferior.</p>
              <p>2. Para compor o valor final do frete a ser pago ao transportador, deverão ser negociados os valores dos incisos I, III e IV da Resolução ANTT nº 5.867/2020. Esse parágrafo trata de despesas extras do transporte e do caminhoneiro, além de tributos, taxas e outros itens.</p>
              <p>3. O custo de diárias que envolve a remuneração para refeições realizadas e dos pernoites realizados durante a operação de carga e descarga devem ser negociados à parte.</p>
              <p>4. Os valores apresentados não incluem pedágios, que devem ser pagos separadamente pelo embarcador conforme a Lei nº 10.209/2001.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
