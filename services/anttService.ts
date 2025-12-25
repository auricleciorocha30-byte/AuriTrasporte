
// Coeficientes oficiais simplificados da Resolução ANTT 5.867
const COEF_TABLE: Record<number, Record<string, { ccd: number; cc: number }>> = {
  2: { default: { ccd: 2.3045, cc: 240.15 } },
  3: { default: { ccd: 3.1023, cc: 310.45 } },
  4: { default: { ccd: 4.2567, cc: 450.12 } },
  5: { default: { ccd: 5.3348, cc: 556.92 } },
  6: { default: { ccd: 6.1023, cc: 610.45 } },
  7: { default: { ccd: 7.2567, cc: 750.12 } },
  9: { default: { ccd: 9.3348, cc: 956.92 } },
};

export const calculateANTT = (
  distance: number, 
  axles: number, 
  cargoType: string = 'geral',
  extras: { toll?: number; daily?: number; other?: number; returnEmpty?: boolean } = {}
) => {
  // Nota 1: Busca o eixo imediatamente inferior se não existir o exato
  const availableAxles = Object.keys(COEF_TABLE).map(Number).sort((a, b) => b - a);
  const selectedAxles = availableAxles.find(a => a <= axles) || availableAxles[availableAxles.length - 1];
  
  const base = COEF_TABLE[selectedAxles] || COEF_TABLE[5];
  const coef = base[cargoType] || base['default'];
  
  const valueBaseIda = (distance * coef.ccd) + coef.cc;
  
  // Nota 6: Retorno vazio (obrigatório em casos específicos, 92% do custo de deslocamento)
  const valueRetorno = extras.returnEmpty ? (0.92 * distance * coef.ccd) : 0;
  
  // Notas 2, 3, 5: Adicionais
  const totalToll = extras.toll || 0;
  const totalDaily = extras.daily || 0;
  const totalOther = extras.other || 0;

  const totalFrete = valueBaseIda + valueRetorno + totalToll + totalDaily + totalOther;

  return {
    total: totalFrete,
    pisoMinimo: valueBaseIda + valueRetorno,
    deslocamento: valueBaseIda,
    retorno: valueRetorno,
    ccd: coef.ccd,
    cc: coef.cc,
    adicionais: totalToll + totalDaily + totalOther
  };
};

export const ANTT_CARGO_TYPES = [
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
