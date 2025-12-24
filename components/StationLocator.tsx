
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Fuel, MapPin, Loader2, Navigation, Search, Wrench, Hammer, AlertTriangle, Info, Map as MapIcon, X, ExternalLink, ChevronRight } from 'lucide-react';

type ServiceType = 'stations' | 'tire_repair' | 'mechanic';

export const StationLocator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [stations, setStations] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<ServiceType>('stations');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'permission' | 'timeout' | 'other' | 'manual' | null>(null);
  const [manualCity, setManualCity] = useState("");
  const [activeStationUri, setActiveStationUri] = useState<string | null>(null);
  const [isIframeLoading, setIsIframeLoading] = useState(false);

  const getGeolocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Navegador sem GPS."));
        return;
      }
      setStatusMessage("Conectando satélites...");
      navigator.geolocation.getCurrentPosition(resolve, (err1) => {
        setStatusMessage("Usando sinal de rede...");
        navigator.geolocation.getCurrentPosition(resolve, (err2) => {
          setStatusMessage("Verificando última posição...");
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: Infinity 
          });
        }, {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 60000
        });
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
    setActiveStationUri(null);

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
      
      let query = "";
      switch(selectedType) {
        case 'stations': query = "Postos de combustível com pátio para caminhões, banho e serviços 24h"; break;
        case 'tire_repair': query = "Borracharias 24h para caminhões e pneus pesados"; break;
        case 'mechanic': query = "Oficinas mecânicas diesel para caminhões e suspensão pesada"; break;
      }

      const config: any = { tools: [{googleMaps: {}}] };
      if (latitude && longitude) {
        config.toolConfig = { retrievalConfig: { latLng: { latitude, longitude } } };
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Encontre ${query} ${locationContext}`,
        config: config,
      });

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const mapsData = chunks.filter((c: any) => c.maps).map((c: any) => c.maps);
      
      if (mapsData.length > 0) {
        setStations(mapsData);
        // Pré-carrega o primeiro resultado na "webview"
        setActiveStationUri(mapsData[0].uri);
      } else {
        setErrorMessage(`Nenhum serviço encontrado para ${isManual ? manualCity : 'sua localização'}.`);
      }
    } catch (err: any) {
      console.error("Erro na busca:", err);
      setErrorMessage("Erro ao conectar com o serviço de busca. Tente digitar o local.");
      setErrorType('manual');
    } finally {
      setLoading(false);
      setStatusMessage("");
    }
  };

  const handleStationSelect = (uri: string) => {
    setActiveStationUri(uri);
    setIsIframeLoading(true);
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-12">
      {/* Cabeçalho de Busca */}
      <div className="bg-slate-900 p-6 md:p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden mx-2">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-2xl font-black mb-1">Serviços na Estrada</h2>
            <p className="text-slate-400 text-sm font-medium">Localize suporte especializado rapidamente.</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <ServiceTab active={selectedType === 'stations'} icon={Fuel} label="Postos" onClick={() => setSelectedType('stations')} />
            <ServiceTab active={selectedType === 'tire_repair'} icon={Hammer} label="Borracharia" onClick={() => setSelectedType('tire_repair')} />
            <ServiceTab active={selectedType === 'mechanic'} icon={Wrench} label="Oficina" onClick={() => setSelectedType('mechanic')} />
          </div>
        </div>

        <div className="mt-8">
          {errorType !== 'manual' ? (
            <button 
              onClick={() => findServices(false)} 
              disabled={loading} 
              className="w-full md:w-auto bg-primary-600 text-white px-8 py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <MapIcon />}
              {loading ? (statusMessage || 'Obtendo GPS...') : 'Localizar via GPS'}
            </button>
          ) : (
            <div className="space-y-4 animate-fade-in bg-slate-800 p-5 rounded-[2rem] border border-slate-700">
              <p className="text-amber-400 font-bold flex items-center gap-2 text-sm">
                <AlertTriangle size={16}/> GPS não disponível. Digite onde você está:
              </p>
              <div className="flex gap-2">
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Ex: Registro, SP ou Rodovia BR-116" 
                  className="flex-1 p-4 bg-slate-900 border border-slate-700 rounded-xl font-bold text-white outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  value={manualCity}
                  onChange={e => setManualCity(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && findServices(true)}
                />
                <button 
                  onClick={() => findServices(true)}
                  disabled={loading || !manualCity}
                  className="bg-primary-600 p-4 rounded-xl text-white disabled:opacity-50 active:scale-95 transition-all"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <Search />}
                </button>
              </div>
              <button onClick={() => setErrorType(null)} className="text-[10px] text-slate-500 underline block text-center w-full uppercase font-black">Tentar GPS novamente</button>
            </div>
          )}
        </div>
      </div>

      {/* Área de Resultados e Webview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-2">
        {/* Lista de Resultados */}
        <div className={`lg:col-span-4 space-y-3 h-[600px] overflow-y-auto pr-2 custom-scrollbar ${activeStationUri ? 'hidden lg:block' : 'block'}`}>
          {stations.map((s, i) => (
            <div 
              key={i} 
              onClick={() => handleStationSelect(s.uri)}
              className={`p-5 rounded-[1.5rem] border cursor-pointer transition-all animate-fade-in flex items-center justify-between group ${activeStationUri === s.uri ? 'bg-primary-600 border-primary-600 text-white shadow-lg scale-[1.02]' : 'bg-white border-slate-200 text-slate-800 hover:border-primary-300'}`}
            >
              <div className="flex gap-4 items-center">
                <div className={`p-3 rounded-xl ${activeStationUri === s.uri ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {selectedType === 'stations' ? <Fuel size={20}/> : selectedType === 'tire_repair' ? <Hammer size={20}/> : <Wrench size={20}/>}
                </div>
                <div>
                  <h3 className="font-black text-sm line-clamp-1">{s.title || 'Serviço'}</h3>
                  <p className={`text-[10px] font-bold flex items-center gap-1 ${activeStationUri === s.uri ? 'text-white/70' : 'text-slate-400'}`}>
                    <MapPin size={10}/> Toque para visualizar
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className={activeStationUri === s.uri ? 'text-white' : 'text-slate-300 group-hover:translate-x-1 transition-transform'} />
            </div>
          ))}

          {!loading && stations.length === 0 && (
            <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
              <MapPin size={40} className="mx-auto text-slate-200 mb-3" />
              <p className="text-slate-400 font-bold text-sm px-6">Seus resultados aparecerão aqui.</p>
            </div>
          )}
        </div>

        {/* Webview / Visualização Integrada */}
        <div className={`lg:col-span-8 h-[600px] bg-slate-100 rounded-[2.5rem] border-2 border-slate-200 overflow-hidden relative flex flex-col ${activeStationUri ? 'block' : 'hidden lg:flex items-center justify-center'}`}>
          {activeStationUri ? (
            <>
              {/* Barra de Ações da Webview */}
              <div className="bg-white border-b p-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <button onClick={() => setActiveStationUri(null)} className="lg:hidden p-2 text-slate-500"><X size={20}/></button>
                  <span className="text-xs font-black text-slate-500 uppercase tracking-tight flex items-center gap-2">
                    <Info size={14} className="text-primary-500"/> Visualização Integrada
                  </span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => window.open(activeStationUri, '_blank')}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-black shadow-md hover:bg-primary-700 transition-all"
                  >
                    <ExternalLink size={14}/> Abrir no Maps
                  </button>
                </div>
              </div>

              {/* Iframe da Webview */}
              <div className="flex-1 w-full bg-white relative">
                {isIframeLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-0">
                    <Loader2 className="animate-spin text-primary-500 mb-2" size={32} />
                    <span className="text-xs font-bold text-slate-400">Carregando mapa...</span>
                  </div>
                )}
                <iframe 
                  src={activeStationUri} 
                  className="w-full h-full border-none z-10 relative" 
                  onLoad={() => setIsIframeLoading(false)}
                  title="Station View"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                />
              </div>
            </>
          ) : (
            <div className="text-center p-8">
              <div className="bg-slate-200 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapIcon size={32} className="text-slate-400" />
              </div>
              <h3 className="text-slate-500 font-black">Nenhum posto selecionado</h3>
              <p className="text-slate-400 text-xs mt-2">Selecione um item da lista para visualizar os detalhes aqui.</p>
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
