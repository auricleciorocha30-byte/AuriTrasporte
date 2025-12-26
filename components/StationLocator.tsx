
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Fuel, MapPin, Loader2, Navigation, Search, Wrench, Hammer, AlertTriangle, Map as MapIcon, X, ExternalLink, ChevronRight, MapPinHouse, Radar, Truck } from 'lucide-react';

type ServiceType = 'stations' | 'tire_repair' | 'mechanic' | 'restaurants';

export const StationLocator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [services, setServices] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<ServiceType>('stations');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [manualLocation, setManualLocation] = useState("");
  const [activeService, setActiveService] = useState<any | null>(null);

  const getGeolocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Seu navegador não suporta geolocalização."));
        return;
      }
      setStatusMessage("Obtendo sua localização...");
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const findServices = async (isManual = false) => {
    if (isManual && !manualLocation.trim()) return;

    setLoading(true);
    setErrorMessage(null);
    setServices([]);
    setActiveService(null);
    setStatusMessage("Preparando radar...");

    try {
      let latLng: { latitude: number; longitude: number } | null = null;
      let locationQuery = "";

      if (!isManual) {
        try {
          const coords = await getGeolocation();
          latLng = { latitude: coords.lat, longitude: coords.lng };
          locationQuery = "perto da minha localização atual";
        } catch (geoErr) {
          console.error("Erro de GPS:", geoErr);
          setErrorMessage("Não foi possível acessar seu GPS. Digite sua localização manualmente.");
          setLoading(false);
          return;
        }
      } else {
        locationQuery = `em ${manualLocation}, Brasil`;
      }

      setStatusMessage("Consultando Google Maps...");
      
      // Instanciação recomendada: sempre antes da chamada para garantir a chave atual
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      let serviceLabel = "";
      let specificity = "com pátio grande para caminhões, pátio de manobra e funcionamento 24h";
      
      switch(selectedType) {
        case 'stations': serviceLabel = "Postos de combustível"; break;
        case 'tire_repair': serviceLabel = "Borracharias pesadas"; break;
        case 'mechanic': serviceLabel = "Mecânicas diesel"; break;
        case 'restaurants': serviceLabel = "Restaurantes de beira de estrada"; break;
      }

      const prompt = `Encontre ${serviceLabel} ${specificity} ${locationQuery}. Forneça opções confiáveis para motoristas de carga pesada.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleMaps: {} }, { googleSearch: {} }],
          toolConfig: {
            retrievalConfig: latLng ? { latLng } : undefined
          }
        },
      });

      // Extração rigorosa dos metadados de aterramento (grounding)
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const mapsResults = groundingChunks
        .filter((chunk: any) => chunk.maps)
        .map((chunk: any) => ({
          title: chunk.maps.title,
          uri: chunk.maps.uri,
          // Se houver snippets de avaliações nos metadados, poderiam ser extraídos aqui também
        }));

      if (mapsResults.length > 0) {
        setServices(mapsResults);
        setActiveService(mapsResults[0]);
      } else {
        setErrorMessage("Nenhum serviço encontrado para esta região com os critérios de caminhoneiro.");
      }
    } catch (err: any) {
      console.error("Erro na busca Gemini:", err);
      setErrorMessage("Ocorreu um erro ao processar a busca. Tente novamente ou digite um local diferente.");
    } finally {
      setLoading(false);
      setStatusMessage("");
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-12 animate-fade-in">
      {/* Cabeçalho de Busca */}
      <div className="bg-slate-900 p-6 md:p-10 rounded-[2.5rem] text-white shadow-2xl mx-2 border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Radar size={120} className="animate-pulse" />
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Truck className="text-primary-500" size={24} />
                <h2 className="text-3xl font-black tracking-tighter uppercase">Radar da Estrada</h2>
              </div>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Suporte especializado para sua rota</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <ServiceTab active={selectedType === 'stations'} icon={Fuel} label="Postos" onClick={() => setSelectedType('stations')} />
              <ServiceTab active={selectedType === 'tire_repair'} icon={Hammer} label="Borracharia" onClick={() => setSelectedType('tire_repair')} />
              <ServiceTab active={selectedType === 'mechanic'} icon={Wrench} label="Oficina Diesel" onClick={() => setSelectedType('mechanic')} />
              <ServiceTab active={selectedType === 'restaurants'} icon={X} label="Comida" onClick={() => setSelectedType('restaurants')} />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <input 
                type="text" 
                placeholder="Ex: Rodovia Castelo Branco, KM 60 ou Cidade, UF" 
                className="w-full p-5 bg-slate-800/50 border border-slate-700 rounded-2xl font-bold text-white outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-slate-600 transition-all"
                value={manualLocation}
                onChange={e => setManualLocation(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && findServices(true)}
              />
              <Search className="absolute right-5 top-5 text-slate-600" size={24} />
            </div>
            
            <button 
              onClick={() => findServices(false)} 
              disabled={loading} 
              className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all disabled:opacity-50 min-w-[200px]"
            >
              {loading ? <Loader2 className="animate-spin" /> : <MapPin />}
              {loading ? 'Buscando...' : 'Buscar Próximos'}
            </button>
            
            {manualLocation && (
              <button 
                onClick={() => findServices(true)}
                disabled={loading}
                className="bg-slate-700 hover:bg-slate-600 text-white px-8 py-5 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all"
              >
                Buscar neste Local
              </button>
            )}
          </div>
          
          {statusMessage && (
            <p className="mt-4 text-primary-400 text-xs font-black uppercase tracking-widest animate-pulse">{statusMessage}</p>
          )}

          {errorMessage && (
            <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-400 text-sm font-bold">
              <AlertTriangle size={18} /> {errorMessage}
            </div>
          )}
        </div>
      </div>

      {/* Resultados e Mapa */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-2">
        {/* Lista de Resultados */}
        <div className={`lg:col-span-4 space-y-3 h-[650px] overflow-y-auto pr-2 custom-scrollbar ${activeService ? 'hidden lg:block' : 'block'}`}>
          {services.map((s, i) => (
            <div 
              key={i} 
              onClick={() => setActiveService(s)}
              className={`p-6 rounded-[2rem] border cursor-pointer transition-all flex items-center justify-between group relative overflow-hidden ${activeService?.uri === s.uri ? 'bg-primary-600 border-primary-600 text-white shadow-2xl scale-[1.02] z-10' : 'bg-white border-slate-200 text-slate-800 hover:border-primary-300'}`}
            >
              <div className="flex gap-4 items-center relative z-10">
                <div className={`p-4 rounded-2xl ${activeService?.uri === s.uri ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                  {selectedType === 'stations' ? <Fuel size={24}/> : selectedType === 'tire_repair' ? <Hammer size={24}/> : selectedType === 'restaurants' ? <X size={24}/> : <Wrench size={24}/>}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-base truncate pr-2">{s.title || 'Serviço'}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded ${activeService?.uri === s.uri ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      Disponível
                    </span>
                    <span className={`text-[10px] font-bold ${activeService?.uri === s.uri ? 'text-white/70' : 'text-slate-400'}`}>
                      Clique para ver no mapa
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight size={20} className={`relative z-10 ${activeService?.uri === s.uri ? 'text-white' : 'text-slate-300'}`} />
            </div>
          ))}

          {!loading && services.length === 0 && !errorMessage && (
            <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 opacity-60">
              <div className="bg-slate-50 p-6 rounded-full inline-block mb-4 text-slate-300">
                <MapPinHouse size={64} />
              </div>
              <p className="text-slate-400 font-black text-sm uppercase tracking-widest px-10">Use o radar acima para localizar suporte</p>
            </div>
          )}
        </div>

        {/* Visualização Detalhada */}
        <div className={`lg:col-span-8 h-[650px] bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden relative flex flex-col shadow-sm ${activeService ? 'block' : 'hidden lg:flex items-center justify-center bg-slate-50/50'}`}>
          {activeService ? (
            <>
              {/* Header do Detalhe */}
              <div className="bg-white border-b p-6 flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                   <button onClick={() => setActiveService(null)} className="lg:hidden p-3 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                     <X size={24}/>
                   </button>
                   <div>
                     <h3 className="font-black text-slate-900 text-xl truncate max-w-[250px] md:max-w-md">{activeService.title}</h3>
                     <p className="text-primary-600 text-[10px] font-black uppercase tracking-widest">Localização Confirmada pelo Google</p>
                   </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => window.open(activeService.uri, '_blank')} 
                    className="hidden md:flex bg-slate-100 text-slate-700 px-5 py-3 rounded-xl text-xs font-black items-center gap-2 hover:bg-slate-200 transition-colors"
                  >
                    <ExternalLink size={16}/> LINK MAPS
                  </button>
                </div>
              </div>

              {/* Área do Mapa Interativo */}
              <div className="flex-1 relative bg-slate-100">
                <iframe 
                  title="Localização no Google Maps"
                  className="w-full h-full border-0 grayscale-[0.2]"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(activeService.title)}&output=embed`}
                  allowFullScreen
                  loading="lazy"
                ></iframe>
                
                {/* Botão Flutuante de Rota */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] md:w-auto">
                   <button 
                    onClick={() => {
                      const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(activeService.title)}&travelmode=driving`;
                      window.open(navUrl, '_blank');
                    }}
                    className="w-full md:px-12 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xl flex items-center justify-center gap-4 shadow-2xl hover:bg-slate-800 hover:scale-105 transition-all border-4 border-white/10"
                  >
                    <Navigation size={28} className="fill-white" />
                    INICIAR NAVEGAÇÃO GPS
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center p-12 max-w-sm">
              <div className="bg-white p-10 rounded-full inline-block mb-6 shadow-sm border border-slate-100">
                <MapIcon size={80} className="text-slate-200" />
              </div>
              <h3 className="text-slate-400 font-black text-xl uppercase tracking-tighter">Radar em Standby</h3>
              <p className="text-slate-300 font-bold mt-3 leading-relaxed">
                Selecione um local na lista lateral para visualizar detalhes, fotos e iniciar a rota no GPS.
              </p>
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
    className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl font-black text-xs transition-all tracking-tighter uppercase ${active ? 'bg-primary-600 text-white shadow-lg scale-105 ring-4 ring-primary-600/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
  >
    <Icon size={18} /> <span>{label}</span>
  </button>
);
