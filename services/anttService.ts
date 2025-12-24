
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

export const calculateANTT = (distance: number, axles: number, cargoType: string = 'geral') => {
  const base = COEF_TABLE[axles] || COEF_TABLE[5];
  const coef = base[cargoType] || base['default'];
  
  const value = (distance * coef.ccd) + coef.cc;
  return {
    value,
    ccd: coef.ccd,
    cc: coef.cc
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
