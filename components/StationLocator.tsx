
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Fuel, MapPin, Loader2, Navigation, Search, Wrench, Hammer } from 'lucide-react';

type ServiceType = 'stations' | 'tire_repair' | 'mechanic';

export const StationLocator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [stations, setStations] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<ServiceType>('stations');

  const findServices = async () => {
    setLoading(true);
    try {
      const pos: any = await new Promise((res, rej) => {
        navigator.geolocation.getCurrentPosition(res, rej);
      });

      const { latitude, longitude } = pos.coords;
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      let query = "";
      switch(selectedType) {
        case 'stations': query = "Postos de combustível com pátio para caminhões, banho e serviços 24h"; break;
        case 'tire_repair': query = "Borracharias 24h para caminhões e pneus pesados"; break;
        case 'mechanic': query = "Oficinas mecânicas diesel para caminhões e suspensão pesada"; break;
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Encontre ${query} perto das coordenadas lat:${latitude}, lng:${longitude}`,
        config: {
          tools: [{googleMaps: {}}],
          toolConfig: {
            retrievalConfig: {
              latLng: { latitude, longitude }
            }
          }
        },
      });

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const mapsData = chunks.filter((c: any) => c.maps).map((c: any) => c.maps);
      
      setStations(mapsData.length > 0 ? mapsData : []);
    } catch (err: any) {
      alert("Erro ao buscar serviços. Verifique o GPS.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
        <h2 className="text-3xl font-black mb-4">Serviços na Estrada</h2>
        <p className="text-slate-400 mb-10 max-w-md font-medium">Localize suporte especializado dependendo do ocorrido.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <ServiceTab active={selectedType === 'stations'} icon={Fuel} label="Postos" onClick={() => setSelectedType('stations')} />
          <ServiceTab active={selectedType === 'tire_repair'} icon={Hammer} label="Borracharia" onClick={() => setSelectedType('tire_repair')} />
          <ServiceTab active={selectedType === 'mechanic'} icon={Wrench} label="Oficina" onClick={() => setSelectedType('mechanic')} />
        </div>

        <button onClick={findServices} disabled={loading} className="w-full md:w-auto bg-primary-600 text-white px-10 py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
          {loading ? <Loader2 className="animate-spin" /> : <Search />}
          {loading ? 'Buscando...' : 'Buscar agora'}
        </button>
      </div>

      <div className="grid gap-4">
        {stations.map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border shadow-sm flex justify-between items-center hover:border-primary-300 transition-all animate-fade-in">
            <div className="flex gap-4 items-center">
              <div className="bg-slate-100 text-slate-600 p-4 rounded-2xl">
                {selectedType === 'stations' ? <Fuel size={24}/> : selectedType === 'tire_repair' ? <Hammer size={24}/> : <Wrench size={24}/>}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800">{s.title || 'Serviço Próximo'}</h3>
                <p className="text-sm text-slate-500 font-bold flex items-center gap-1"><MapPin size={14}/> Ver no Google Maps</p>
              </div>
            </div>
            <button onClick={() => window.open(s.uri, '_blank')} className="bg-primary-50 p-4 rounded-2xl text-primary-600 hover:bg-primary-600 hover:text-white transition-all">
              <Navigation size={24}/>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const ServiceTab = ({ active, icon: Icon, label, onClick }: any) => (
  <button onClick={onClick} className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${active ? 'bg-white text-slate-900 shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
    <Icon size={20} /> <span>{label}</span>
  </button>
);
