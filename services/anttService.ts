
// Coeficientes simplificados baseados na Resolução ANTT para Carga Geral
// CCD = Custo de Deslocamento (R$/km) | CC = Custo de Carga e Descarga (R$/viagem)
// Nota: Em uma implementação real, haveria tabelas separadas para A (Conjunto) e B (Apenas Veículo)
const COEF_TABLE: Record<number, Record<string, { ccd: number; cc: number }>> = {
  2: { 
    geral: { ccd: 4.7938, cc: 511.74 }, // Valores exatos da imagem do usuário
    default: { ccd: 4.7938, cc: 511.74 }
  },
  3: { 
    geral: { ccd: 5.1245, cc: 580.12 },
    default: { ccd: 5.1245, cc: 580.12 }
  },
  4: { 
    geral: { ccd: 5.8021, cc: 650.45 },
    default: { ccd: 5.8021, cc: 650.45 }
  },
  5: { 
    geral: { ccd: 6.4512, cc: 720.10 },
    default: { ccd: 6.4512, cc: 720.10 }
  },
  6: { 
    geral: { ccd: 7.2012, cc: 810.45 },
    default: { ccd: 7.2012, cc: 810.45 }
  },
  7: { 
    geral: { ccd: 7.9012, cc: 890.12 },
    default: { ccd: 7.9012, cc: 890.12 }
  },
  9: { 
    geral: { ccd: 9.1012, cc: 980.45 },
    default: { ccd: 9.1012, cc: 980.45 }
  }
};

export const calculateANTT = (
  distance: number, 
  axles: number, 
  cargoType: string = 'geral',
  extras: { 
    toll?: number; 
    daily?: number; 
    other?: number; 
    returnEmpty?: boolean;
    isComposition?: boolean;
    isHighPerformance?: boolean;
  } = {}
) => {
  // Busca o eixo
  const availableAxles = Object.keys(COEF_TABLE).map(Number).sort((a, b) => b - a);
  const selectedAxles = availableAxles.find(a => a <= axles) || 2;
  
  let coef = COEF_TABLE[selectedAxles][cargoType] || COEF_TABLE[selectedAxles]['default'];
  
  // Ajuste Tabela A vs B
  // Se for composição veicular (Tabela A), os custos são geralmente maiores pois o transportador fornece o implemento.
  // Se não for (Tabela B), usamos os coeficientes base.
  let currentCCD = coef.ccd;
  let currentCC = coef.cc;

  if (extras.isComposition) {
    currentCCD *= 1.15; // Ajuste estimado para Tabela A
    currentCC *= 1.10;
  }

  // Cálculo de ida
  const valorIda = (distance * currentCCD) + currentCC;
  
  // Cálculo de retorno vazio (0,92 * Distância * CCD)
  const valorRetornoVazio = extras.returnEmpty ? (0.92 * distance * currentCCD) : 0;
  
  const total = valorIda + valorRetornoVazio + (extras.toll || 0) + (extras.other || 0);

  return {
    total,
    valorIda,
    valorRetornoVazio,
    ccd: currentCCD,
    cc: currentCC,
    tabela: extras.isComposition ? 'Tabela A - Operações com Conjunto Completo' : 'Tabela B - Operações apenas do Veículo Automotor'
  };
};

export const ANTT_CARGO_TYPES = [
  { id: 'geral', label: 'Carga Geral' },
  { id: 'granel_solido', label: 'Granel sólido' },
  { id: 'granel_liquido', label: 'Granel líquido' },
  { id: 'frigorificada', label: 'Frigorificada ou Aquecida' },
  { id: 'conteinerizada', label: 'Conteinerizada' },
  { id: 'granel_pressurizada', label: 'Carga Granel Pressurizada' },
  { id: 'neogranel', label: 'Neogranel' }
];
