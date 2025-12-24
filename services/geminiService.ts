
import { GoogleGenAI, Type } from "@google/genai";
import { Trip, Expense, ANTTParams } from '../types';

export const getDistanceEstimation = async (origin: string, destination: string, stops: any[]): Promise<number> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const stopsText = stops.length > 0 ? ` passando por ${stops.map(s => `${s.city}-${s.state}`).join(', ')}` : '';
    const prompt = `Estime a distância rodoviária em KM entre ${origin} e ${destination}${stopsText}. Retorne apenas o número puro, sem texto.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    const km = parseInt(response.text.replace(/\D/g, ''));
    return isNaN(km) ? 0 : km;
  } catch (error) {
    console.error("Erro ao estimar distância:", error);
    return 0;
  }
};

export const getFinancialInsights = async (trips: Trip[], expenses: Expense[]): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const dataContext = JSON.stringify({
      trips: trips.slice(-10),
      expenses: expenses.slice(-20),
      summary: "User is a truck driver/fleet owner."
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        Atue como um consultor financeiro especialista em logística e transporte rodoviário de cargas no Brasil.
        Analise os seguintes dados (JSON) das minhas viagens e despesas recentes.

        Dados: ${dataContext}

        Forneça um relatório curto e direto (formato Markdown) com:
        1. Análise de Lucratividade: Estou cobrando bem? Onde estou gastando muito?
        2. Dicas de Otimização: Como posso melhorar minha margem?
        3. Alertas: Algum padrão preocupante?

        Seja encorajador mas realista. Use emojis para facilitar a leitura.
      `,
      config: {
        temperature: 0.7,
      }
    });

    return response.text || "Não foi possível gerar insights no momento.";
  } catch (error) {
    console.error("Error fetching insights:", error);
    return "Erro ao conectar com a IA. Verifique sua conexão ou chave de API.";
  }
};

export const getSmartFreightEstimation = async (params: ANTTParams): Promise<{ minPrice: number, marketPrice: number, reasoning: string }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Você é uma calculadora inteligente de fretes baseada na tabela da ANTT do Brasil.
      
      Parâmetros da viagem:
      - Distância: ${params.distance} km
      - Eixos: ${params.axles}
      - Tipo de Carga: ${params.cargoType}
      - Retorno Vazio: ${params.returnEmpty ? 'Sim' : 'Não'}
      - Custos de Pedágio: R$ ${params.tollCost}

      Retorne APENAS um objeto JSON com: minPrice, marketPrice e reasoning.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            minPrice: { type: Type.NUMBER },
            marketPrice: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
          },
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Sem resposta da IA");
    return JSON.parse(text);
  } catch (error) {
    const baseRate = 1.2 * params.axles;
    const cost = (params.distance * baseRate) + params.tollCost + params.otherCosts;
    return {
      minPrice: cost,
      marketPrice: cost * 1.3,
      reasoning: "Cálculo offline estimado."
    };
  }
};
