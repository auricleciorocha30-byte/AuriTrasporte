
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Fuel, MapPin, Loader2, Navigation, Search, Wrench, Hammer, AlertTriangle, Info, Map as MapIcon, X, ExternalLink, ChevronRight, Share2, MapPinHouse } from 'lucide-react';

type ServiceType = 'stations' | 'tire_repair' | 'mechanic';

export const StationLocator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [stations, setStations] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<ServiceType>('stations');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'permission' | 'timeout' | 'other' | 'manual' | null>(null);
  const [manualCity, setManualCity] = useState("");
  const [activeStation, setActiveStation] = useState<any | null>(null);
  const [lastQuery, setLastQuery] = useState("");

  const getGeolocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Navegador sem GPS."));
        return;
      }
      setStatusMessage("Conectando satélites...");
      navigator.geolocation.getCurrentPosition(resolve, (err) => {
        reject(err);
      }, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      });
    });
  };

  const findServices = async (isManual = false) => {
    if (isManual && !manualCity.trim()) return;

    setLoading(true);
    setErrorMessage(null);
    setErrorType(null);
    setStations([]);
    setActiveStation(null);

    try {
      let locationContext = "";
      let latitude: number | null = null;
      let longitude: number | null = null;

      if (!isManual) {
        try {
          const pos = await getGeolocation();
          latitude = pos.coords.latitude;
          longitude = pos.coords.longitude;
          locationContext = `perto das coordenadas lat:${latitude}, lng:${longitude}`;
        } catch (geoErr) {
          setErrorType('manual');
          setLoading(false);
          setStatusMessage("");
          return;
        }
      } else {
        locationContext = `na cidade ou região de ${manualCity}, Brasil`;
      }

      setStatusMessage("Buscando serviços...");
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      let queryLabel = "";
      switch(selectedType) {
        case 'stations': queryLabel = "Postos de combustível com pátio para caminhões e serviços 24h"; break;
        case 'tire_repair': queryLabel = "Borracharias 24h para caminhões"; break;
        case 'mechanic': queryLabel = "Oficinas mecânicas diesel para caminhões"; break;
      }

      const queryText = `${queryLabel} ${locationContext}`;
      setLastQuery(queryText);

      const config: any = { 
        tools: [{googleMaps: {}}],
      };
      if (latitude && longitude) {
        config.toolConfig = { 
          retrievalConfig: { 
            latLng: { latitude, longitude } 
          } 
        };
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Encontre ${queryText}`,
        config: config,
      });

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const mapsData = chunks.filter((c: any) => c.maps).map((c: any) => c.maps);
      
      if (mapsData.length > 0) {
        setStations(mapsData);
        setActiveStation(mapsData[0]);
      } else {
        setErrorMessage(`Nenhum serviço encontrado.`);
        setErrorType('manual');
      }
    } catch (err: any) {
      console.error("Erro na busca:", err);
      setErrorMessage("Erro ao buscar serviços.");
      setErrorType('manual');
    } finally {
      setLoading(false);
      setStatusMessage("");
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-12">
      <div className="bg-slate-900 p-6 md:p-8 rounded-[2.5rem] text-white shadow-xl mx-2 border border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl font-black mb-1">Serviços na Estrada</h2>
            <p className="text-slate-400 text-sm font-medium">Localize suporte especializado rapidamente.</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <ServiceTab active={selectedType === 'stations'} icon={Fuel} label="Postos" onClick={() => setSelectedType('stations')} />
            <ServiceTab active={selectedType === 'tire_repair'} icon={Hammer} label="Borracharia" onClick={() => setSelectedType('tire_repair')} />
            <ServiceTab active={selectedType === 'mechanic'} icon={Wrench} label="Oficina" onClick={() => setSelectedType('mechanic')} />
          </div>
        </div>

        <div className="mt-8 flex flex-col md:flex-row gap-3">
          {errorType !== 'manual' ? (
            <button 
              onClick={() => findServices(false)} 
              disabled={loading} 
              className="w-full md:w-auto bg-primary-600 text-white px-8 py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <MapIcon />}
              {loading ? (statusMessage || 'Localizando...') : 'Localizar via Maps'}
            </button>
          ) : (
            <div className="w-full space-y-4 animate-fade-in bg-slate-800 p-5 rounded-[2rem] border border-slate-700">
              <p className="text-amber-400 font-bold flex items-center gap-2 text-sm">
                <AlertTriangle size={16}/> {errorMessage || 'GPS não disponível. Digite sua localização:'}
              </p>
              <div className="flex gap-2">
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Cidade, UF ou Rodovia" 
                  className="flex-1 p-4 bg-slate-900 border border-slate-700 rounded-xl font-bold text-white outline-none focus:ring-2 focus:ring-primary-500"
                  value={manualCity}
                  onChange={e => setManualCity(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && findServices(true)}
                />
                <button 
                  onClick={() => findServices(true)}
                  disabled={loading || !manualCity}
                  className="bg-primary-600 p-4 rounded-xl text-white disabled:opacity-50"
                >
                  <Search />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-2">
        {/* Lista Lateral */}
        <div className={`lg:col-span-4 space-y-3 h-[600px] overflow-y-auto pr-2 custom-scrollbar ${activeStation ? 'hidden lg:block' : 'block'}`}>
          {stations.map((s, i) => (
            <div 
              key={i} 
              onClick={() => setActiveStation(s)}
              className={`p-5 rounded-[1.5rem] border cursor-pointer transition-all flex items-center justify-between group ${activeStation?.uri === s.uri ? 'bg-primary-600 border-primary-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-800 hover:border-primary-300'}`}
            >
              <div className="flex gap-4 items-center">
                <div className={`p-3 rounded-xl ${activeStation?.uri === s.uri ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                  {selectedType === 'stations' ? <Fuel size={20}/> : selectedType === 'tire_repair' ? <Hammer size={20}/> : <Wrench size={20}/>}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-sm truncate">{s.title || 'Serviço'}</h3>
                  <p className={`text-[10px] font-bold ${activeStation?.uri === s.uri ? 'text-white/70' : 'text-slate-400'}`}>
                    VER DETALHES
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className={activeStation?.uri === s.uri ? 'text-white' : 'text-slate-300'} />
            </div>
          ))}

          {!loading && stations.length === 0 && (
            <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
              <MapPinHouse size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 font-bold text-sm px-6">Busque serviços para ver os resultados aqui.</p>
            </div>
          )}
        </div>

        {/* Visualização Principal do Mapa */}
        <div className={`lg:col-span-8 h-[600px] bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden relative flex flex-col ${activeStation ? 'block' : 'hidden lg:flex items-center justify-center'}`}>
          {activeStation ? (
            <>
              <div className="bg-slate-50 border-b p-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                   <button onClick={() => setActiveStation(null)} className="lg:hidden p-2 text-slate-500 hover:bg-slate-200 rounded-full transition-colors"><X size={20}/></button>
                   <h3 className="font-black text-slate-800 text-lg truncate max-w-[200px] md:max-w-md">{activeStation.title}</h3>
                </div>
                <button onClick={() => window.open(activeStation.uri, '_blank')} className="bg-primary-600 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-primary-700 transition-colors">
                  <ExternalLink size={14}/> ABRIR NO MAPS
                </button>
              </div>

              <div className="flex-1 relative bg-slate-100">
                {/* Iframe do Google Maps */}
                <iframe 
                  title="Serviço no Mapa"
                  className="w-full h-full border-0"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(activeStation.title)}&output=embed`}
                  allowFullScreen
                ></iframe>
                
                {/* Botão de Rota sobreposto ao mapa */}
                <div className="absolute bottom-6 left-6 right-6 lg:left-1/2 lg:-translate-x-1/2 lg:w-96">
                   <button 
                    onClick={() => {
                      const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(activeStation.title)}&travelmode=driving`;
                      window.open(navUrl, '_blank');
                    }}
                    className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xl flex items-center justify-center gap-3 shadow-2xl hover:bg-slate-800 transition-all border border-white/10"
                  >
                    <Navigation size={24}/> INICIAR ROTA NO GPS
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center p-10">
              <div className="bg-slate-50 p-8 rounded-full inline-block mb-4">
                <MapIcon size={64} className="text-slate-200" />
              </div>
              <h3 className="text-slate-400 font-black text-xl">Selecione um local na lista</h3>
              <p className="text-slate-300 font-bold max-w-xs mx-auto mt-2">Os detalhes e a rota aparecerão aqui visualmente.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ServiceTab = ({ active, icon: Icon, label, onClick }: any) => (
  <button 
    onClick={onClick} 
    className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-xs transition-all ${active ? 'bg-white text-slate-900 shadow-lg scale-105' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
  >
    <Icon size={16} /> <span>{label}</span>
  </button>
);
