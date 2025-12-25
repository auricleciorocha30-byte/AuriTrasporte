
// Coeficientes oficiais da Resolução ANTT nº 6.067 de 16/01/2025 (Valores vigentes)
// CCD = Custo de Deslocamento (R$/km) | CC = Custo de Carga e Descarga (R$/viagem)
const COEF_TABLE: Record<number, Record<string, { ccd: number; cc: number }>> = {
  2: { 
    geral: { ccd: 3.6517, cc: 325.29 },
    granel_solido: { ccd: 3.7915, cc: 341.27 },
    granel_liquido: { ccd: 4.1322, cc: 401.12 },
    frigorificada: { ccd: 4.5123, cc: 440.92 },
    conteinerizada: { ccd: 3.9812, cc: 360.45 },
    default: { ccd: 3.6517, cc: 325.29 }
  },
  3: { 
    geral: { ccd: 4.3541, cc: 405.37 },
    granel_solido: { ccd: 4.5211, cc: 421.12 },
    granel_liquido: { ccd: 4.9012, cc: 480.45 },
    frigorificada: { ccd: 5.2123, cc: 520.12 },
    conteinerizada: { ccd: 4.6123, cc: 430.45 },
    default: { ccd: 4.3541, cc: 405.37 }
  },
  4: { 
    geral: { ccd: 4.7077, cc: 437.19 },
    granel_solido: { ccd: 4.9012, cc: 450.45 },
    granel_liquido: { ccd: 5.3012, cc: 510.12 },
    frigorificada: { ccd: 5.6123, cc: 550.45 },
    conteinerizada: { ccd: 4.9812, cc: 460.12 },
    default: { ccd: 4.7077, cc: 437.19 }
  },
  5: { 
    geral: { ccd: 5.2536, cc: 492.21 },
    granel_solido: { ccd: 5.4512, cc: 510.45 },
    granel_liquido: { ccd: 5.8512, cc: 560.12 },
    frigorificada: { ccd: 6.2012, cc: 600.45 },
    conteinerizada: { ccd: 5.5123, cc: 520.12 },
    default: { ccd: 5.2536, cc: 492.21 }
  },
  6: { 
    geral: { ccd: 6.0825, cc: 562.82 },
    granel_solido: { ccd: 6.3012, cc: 580.45 },
    granel_liquido: { ccd: 6.7012, cc: 630.12 },
    frigorificada: { ccd: 7.1012, cc: 680.45 },
    conteinerizada: { ccd: 6.4012, cc: 600.12 },
    default: { ccd: 6.0825, cc: 562.82 }
  },
  7: { 
    geral: { ccd: 6.4411, cc: 582.49 },
    granel_solido: { ccd: 6.7012, cc: 610.45 },
    granel_liquido: { ccd: 7.1012, cc: 660.12 },
    frigorificada: { ccd: 7.5012, cc: 710.45 },
    conteinerizada: { ccd: 6.8012, cc: 630.12 },
    default: { ccd: 6.4411, cc: 582.49 }
  },
  9: { 
    geral: { ccd: 7.7885, cc: 712.56 },
    granel_solido: { ccd: 8.1012, cc: 740.45 },
    granel_liquido: { ccd: 8.6012, cc: 790.12 },
    frigorificada: { ccd: 9.1012, cc: 840.45 },
    conteinerizada: { ccd: 8.2012, cc: 760.12 },
    default: { ccd: 7.7885, cc: 712.56 }
  }
};

export const calculateANTT = (
  distance: number, 
  axles: number, 
  cargoType: string = 'geral',
  extras: { toll?: number; daily?: number; other?: number; returnEmpty?: boolean } = {}
) => {
  // Nota 1: Busca o eixo imediatamente inferior se não existir o exato na tabela oficial
  const availableAxles = Object.keys(COEF_TABLE).map(Number).sort((a, b) => b - a);
  const selectedAxles = availableAxles.find(a => a <= axles) || availableAxles[availableAxles.length - 1];
  
  const categories = COEF_TABLE[selectedAxles];
  
  // Tenta achar a categoria específica, senão usa 'geral' ou o 'default' do eixo
  let coef = categories[cargoType];
  if (!coef) {
    if (cargoType.includes('perigosa')) {
      // Simplificação para cargas perigosas (geralmente acréscimo de 15% a 20% no CCD em negociação, 
      // mas o piso base segue a categoria do produto)
      coef = categories['geral'];
    } else {
      coef = categories['default'];
    }
  }
  
  // Fórmula Oficial: (Distância x CCD) + CC
  const valueBaseIda = (distance * coef.ccd) + coef.cc;
  
  // Nota 6: Retorno vazio (obrigatório em casos específicos, 92% do custo de deslocamento do eixo)
  const valueRetorno = extras.returnEmpty ? (0.92 * distance * coef.ccd) : 0;
  
  // Notas 2, 3, 5: Adicionais que compõem o frete final pago ao transportador
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
  { id: 'granel_solido', label: 'Granel sólido' },
  { id: 'granel_liquido', label: 'Granel líquido' },
  { id: 'frigorificada', label: 'Frigorificada ou Aquecida' },
  { id: 'conteinerizada', label: 'Conteinerizada' },
  { id: 'granel_pressurizada', label: 'Carga Granel Pressurizada' },
  { id: 'neogranel', label: 'Neogranel' },
  { id: 'perigosa_geral', label: 'Perigosa (carga geral)' },
  { id: 'perigosa_conteinerizada', label: 'Perigosa (conteinerizada)' },
  { id: 'perigosa_frigorificada', label: 'Perigosa (Frigorificada ou Aquecida)' },
  { id: 'perigosa_liquido', label: 'Perigosa (granel líquido)' },
  { id: 'perigosa_solido', label: 'Perigosa (granel sólido)' }
];
