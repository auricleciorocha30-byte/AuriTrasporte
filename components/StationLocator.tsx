
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Fuel, MapPin, Loader2, Navigation, Search, Wrench, Hammer, AlertTriangle, Info } from 'lucide-react';

type ServiceType = 'stations' | 'tire_repair' | 'mechanic';

export const StationLocator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [stations, setStations] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<ServiceType>('stations');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'permission' | 'timeout' | 'other' | null>(null);

  const getGeolocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Seu navegador não suporta geolocalização."));
        return;
      }

      setStatusMessage("Conectando satélites...");
      
      // Tentativa 1: Alta Precisão (Satélite)
      navigator.geolocation.getCurrentPosition(resolve, (err1) => {
        console.warn("GPS de satélite falhou, tentando torres de celular...", err1);
        setStatusMessage("Usando sinal de rede...");

        // Tentativa 2: Baixa Precisão (Rede Celular/WiFi) - Mais confiável em cabines
        navigator.geolocation.getCurrentPosition(resolve, (err2) => {
          console.warn("Sinal de rede falhou, tentando última posição conhecida...", err2);
          setStatusMessage("Verificando cache...");

          // Tentativa 3: Cache (Qualquer posição anterior)
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: Infinity // Aceita qualquer posição salva
          });
        }, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 60000
        });
      }, {
        enableHighAccuracy: true,
        timeout: 5000, // Apenas 5s para satélite para não travar o usuário
        maximumAge: 0
      });
    });
  };

  const findServices = async () => {
    setLoading(true);
    setErrorMessage(null);
    setErrorType(null);
    setStations([]);

    try {
      const pos = await getGeolocation();
      const { latitude, longitude } = pos.coords;

      setStatusMessage("Buscando serviços...");
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
      
      if (mapsData.length > 0) {
        setStations(mapsData);
      } else {
        setErrorMessage("Nenhum serviço encontrado nesta região.");
      }
    } catch (err: any) {
      console.error("Erro na busca:", err);
      
      if (err.code === 1) { // PERMISSION_DENIED
        setErrorType('permission');
        setErrorMessage("Acesso negado pelo navegador.");
      } else if (err.code === 3) { // TIMEOUT
        setErrorType('timeout');
        setErrorMessage("O sinal do GPS está muito fraco no momento.");
      } else if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        setErrorMessage("O GPS exige uma conexão segura (HTTPS).");
      } else {
        setErrorMessage("Não foi possível obter sua localização. Verifique se o GPS do celular e a localização do navegador estão ativos.");
      }
    } finally {
      setLoading(false);
      setStatusMessage("");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="bg-slate-900 p-8 md:p-10 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
        <h2 className="text-3xl font-black mb-4">Serviços na Estrada</h2>
        <p className="text-slate-400 mb-10 max-w-md font-medium">Localize suporte especializado dependendo do ocorrido.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          <ServiceTab active={selectedType === 'stations'} icon={Fuel} label="Postos" onClick={() => setSelectedType('stations')} />
          <ServiceTab active={selectedType === 'tire_repair'} icon={Hammer} label="Borracharia" onClick={() => setSelectedType('tire_repair')} />
          <ServiceTab active={selectedType === 'mechanic'} icon={Wrench} label="Oficina" onClick={() => setSelectedType('mechanic')} />
        </div>

        <button 
          onClick={findServices} 
          disabled={loading} 
          className="w-full md:w-auto bg-primary-600 text-white px-10 py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Search />}
          {loading ? (statusMessage || 'Obtendo GPS...') : 'Buscar agora'}
        </button>

        {errorMessage && (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-rose-500/20 border border-rose-500/40 rounded-2xl flex items-center gap-3 text-rose-200 animate-fade-in">
              <AlertTriangle className="shrink-0" size={20} />
              <p className="text-sm font-bold">{errorMessage}</p>
            </div>
            
            {errorType === 'permission' && (
              <div className="p-4 bg-slate-800 rounded-2xl text-xs text-slate-400 border border-slate-700 animate-fade-in">
                <p className="font-black text-white mb-2 flex items-center gap-2"><Info size={14} className="text-primary-400"/> Como resolver:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Clique no ícone de <span className="text-white font-bold">Cadeado</span> ou <span className="text-white font-bold">Configurações</span> ao lado do endereço do site.</li>
                  <li>Procure por <span className="text-white font-bold">Localização</span>.</li>
                  <li>Altere para <span className="text-primary-400 font-bold">Permitir</span>.</li>
                  <li>Recarregue a página e tente novamente.</li>
                </ol>
              </div>
            )}
            
            {errorType === 'timeout' && (
              <div className="p-4 bg-slate-800 rounded-2xl text-xs text-slate-400 border border-slate-700 animate-fade-in">
                <p className="font-bold text-white mb-1">Dica:</p>
                Se você estiver dentro da cabine ou em local coberto, saia para um local aberto ou aproxime o celular da janela para melhorar o sinal.
              </div>
            )}
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
                <p className="text-sm text-slate-500 font-bold flex items-center gap-1"><MapPin size={14}/> Google Maps</p>
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
        
        {!loading && stations.length === 0 && !errorMessage && (
          <div className="text-center py-20 bg-slate-100 rounded-[3rem] border-2 border-dashed border-slate-200">
            <MapPin size={48} className="mx-auto text-slate-300 mb-4 opacity-50" />
            <p className="text-slate-500 font-black px-6">Clique em buscar para localizar serviços próximos a você.</p>
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
