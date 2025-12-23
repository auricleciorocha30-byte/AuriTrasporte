
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Fuel, MapPin, Loader2, Navigation, Star, Search } from 'lucide-react';

export const StationLocator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [stations, setStations] = useState<any[]>([]);

  const findStations = async () => {
    setLoading(true);
    try {
      // 1. Obter Localização
      const pos: any = await new Promise((res, rej) => {
        navigator.geolocation.getCurrentPosition(res, rej);
      });

      const { latitude, longitude } = pos.coords;

      // 2. Usar Gemini Grounding para achar postos reais
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Quais os melhores postos de combustível com serviços para caminhoneiros (banho, pátio, restaurante) perto de mim?",
        config: {
          tools: [{googleMaps: {}}],
          toolConfig: {
            retrievalConfig: {
              latLng: { latitude, longitude }
            }
          }
        },
      });

      // Extrair metadados do Maps
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const mapsData = chunks.filter((c: any) => c.maps).map((c: any) => c.maps);
      
      setStations(mapsData.length > 0 ? mapsData : []);
    } catch (err: any) {
      alert("Erro ao buscar postos. Certifique-se de que a localização está habilitada.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-gradient-to-br from-emerald-600 to-teal-800 p-10 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
        <Fuel size={120} className="absolute -bottom-10 -right-10 opacity-10 rotate-12" />
        <h2 className="text-3xl font-black mb-4">Postos e Serviços</h2>
        <p className="text-emerald-100 mb-10 max-w-md font-medium">Localize postos com pátio, banho e bons preços de diesel em tempo real usando inteligência geográfica.</p>
        
        <button onClick={findStations} disabled={loading} className="bg-white text-emerald-800 px-10 py-5 rounded-2xl font-black text-lg flex items-center gap-3 shadow-xl active:scale-95 transition-all disabled:opacity-50">
          {loading ? <Loader2 className="animate-spin" /> : <Search />}
          {loading ? 'Buscando postos...' : 'Buscar Postos ao Redor'}
        </button>
      </div>

      <div className="grid gap-4">
        {stations.map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border shadow-sm flex justify-between items-center group hover:border-emerald-200 transition-all">
            <div className="flex gap-4 items-center">
              <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl">
                <Fuel size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800">{s.title || 'Posto de Combustível'}</h3>
                <p className="text-sm text-slate-500 font-bold flex items-center gap-1">
                  <MapPin size={14}/> Localização identificada via Maps
                </p>
              </div>
            </div>
            <button onClick={() => window.open(s.uri, '_blank')} className="bg-slate-50 p-4 rounded-2xl text-slate-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
              <Navigation size={24}/>
            </button>
          </div>
        ))}

        {stations.length === 0 && !loading && (
          <div className="text-center py-20 bg-slate-100 rounded-[3rem] border-2 border-dashed border-slate-200">
             <Fuel size={48} className="mx-auto text-slate-300 mb-4" />
             <p className="text-slate-500 font-black">Clique no botão acima para encontrar serviços próximos.</p>
          </div>
        )}
      </div>
    </div>
  );
};
