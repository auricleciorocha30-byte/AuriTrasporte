
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Fuel, MapPin, Loader2, Navigation, Search, Wrench, Hammer, AlertTriangle, Info, Map as MapIcon } from 'lucide-react';

type ServiceType = 'stations' | 'tire_repair' | 'mechanic';

export const StationLocator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [stations, setStations] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<ServiceType>('stations');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'permission' | 'timeout' | 'other' | 'manual' | null>(null);
  const [manualCity, setManualCity] = useState("");

  const getGeolocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Navegador sem GPS."));
        return;
      }

      setStatusMessage("Conectando satélites...");
      
      // Tentativa ultra-rápida de 5s para GPS preciso
      navigator.geolocation.getCurrentPosition(resolve, (err1) => {
        setStatusMessage("Usando sinal de rede...");
        // Tentativa de 5s para Rede
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
        timeout: 5000, // Se não pegar em 5s, pula pra rede
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
          // Se o GPS falhar totalmente, ativa o modo manual AUTOMATICAMENTE
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

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="bg-slate-900 p-8 md:p-10 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
        <h2 className="text-3xl font-black mb-4">Serviços na Estrada</h2>
        <p className="text-slate-400 mb-10 max-w-md font-medium">Localize suporte especializado rapidamente.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          <ServiceTab active={selectedType === 'stations'} icon={Fuel} label="Postos" onClick={() => setSelectedType('stations')} />
          <ServiceTab active={selectedType === 'tire_repair'} icon={Hammer} label="Borracharia" onClick={() => setSelectedType('tire_repair')} />
          <ServiceTab active={selectedType === 'mechanic'} icon={Wrench} label="Oficina" onClick={() => setSelectedType('mechanic')} />
        </div>

        {errorType !== 'manual' ? (
          <button 
            onClick={() => findServices(false)} 
            disabled={loading} 
            className="w-full md:w-auto bg-primary-600 text-white px-10 py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <MapIcon />}
            {loading ? (statusMessage || 'Obtendo GPS...') : 'Localizar via GPS'}
          </button>
        ) : (
          <div className="space-y-4 animate-fade-in bg-slate-800 p-6 rounded-[2rem] border border-slate-700">
            <p className="text-amber-400 font-bold flex items-center gap-2">
              <AlertTriangle size={18}/> GPS não disponível. Digite onde você está:
            </p>
            <div className="flex gap-2">
              <input 
                autoFocus
                type="text" 
                placeholder="Ex: Registro, SP ou Rodovia BR-116" 
                className="flex-1 p-5 bg-slate-900 border border-slate-700 rounded-2xl font-bold text-white outline-none focus:ring-2 focus:ring-primary-500"
                value={manualCity}
                onChange={e => setManualCity(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && findServices(true)}
              />
              <button 
                onClick={() => findServices(true)}
                disabled={loading || !manualCity}
                className="bg-primary-600 p-5 rounded-2xl text-white disabled:opacity-50 active:scale-95 transition-all"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Search />}
              </button>
            </div>
            <button onClick={() => setErrorType(null)} className="text-xs text-slate-500 underline block text-center w-full">Tentar GPS novamente</button>
          </div>
        )}

        {errorMessage && !errorType && (
          <div className="mt-6 p-4 bg-rose-500/20 border border-rose-500/40 rounded-2xl flex items-center gap-3 text-rose-200 animate-fade-in">
            <AlertTriangle className="shrink-0" size={20} />
            <p className="text-sm font-bold">{errorMessage}</p>
          </div>
        )}
      </div>

      <div className="grid gap-4 px-2">
        {stations.map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border shadow-sm flex justify-between items-center hover:border-primary-300 transition-all animate-fade-in">
            <div className="flex gap-4 items-center">
              <div className="bg-slate-100 text-slate-600 p-4 rounded-2xl">
                {selectedType === 'stations' ? <Fuel size={24}/> : selectedType === 'tire_repair' ? <Hammer size={24}/> : <Wrench size={24}/>}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-black text-slate-800 line-clamp-1">{s.title || 'Serviço Próximo'}</h3>
                <p className="text-sm text-slate-500 font-bold flex items-center gap-1"><MapPin size={14}/> Abrir Navegação</p>
              </div>
            </div>
            <button 
              onClick={() => window.open(s.uri, '_blank')} 
              className="bg-primary-50 p-4 rounded-2xl text-primary-600 hover:bg-primary-600 hover:text-white transition-all shadow-sm active:scale-90"
            >
              <Navigation size={24}/>
            </button>
          </div>
        ))}
        
        {!loading && stations.length === 0 && !errorType && (
          <div className="text-center py-20 bg-slate-100 rounded-[3rem] border-2 border-dashed border-slate-200 mx-2">
            <MapPin size={48} className="mx-auto text-slate-300 mb-4 opacity-50" />
            <p className="text-slate-500 font-black px-6">Escolha o serviço acima e clique em localizar.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ServiceTab = ({ active, icon: Icon, label, onClick }: any) => (
  <button 
    onClick={onClick} 
    className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${active ? 'bg-white text-slate-900 shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
  >
    <Icon size={20} /> <span>{label}</span>
  </button>
);
