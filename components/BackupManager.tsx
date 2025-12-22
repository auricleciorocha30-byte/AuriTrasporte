
import React, { useState } from 'react';
import { Database, Download, Code, Clipboard, Check, AlertTriangle } from 'lucide-react';

export const BackupManager: React.FC<{ data: any }> = ({ data }) => {
  const [copied, setCopied] = useState(false);

  const downloadBackup = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_aurilog_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sqlCode = `-- SCRIPT DEFINITIVO PARA AURILOG
-- Copie e cole no SQL Editor do Supabase

-- 1. Limpeza total
DROP TABLE IF EXISTS maintenance;
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS trips;
DROP TABLE IF EXISTS vehicles;

-- 2. Tabela de Veículos
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  current_km INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Viagens
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  distance_km FLOAT DEFAULT 0,
  agreed_price FLOAT DEFAULT 0,
  driver_commission_percentage FLOAT DEFAULT 0,
  driver_commission FLOAT DEFAULT 0,
  cargo_type TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'Agendada',
  notes TEXT,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Despesas
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount FLOAT NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de Manutenção
CREATE TABLE maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  part_name TEXT NOT NULL,
  km_at_purchase INTEGER,
  warranty_months INTEGER DEFAULT 12,
  warranty_km INTEGER DEFAULT 0,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  cost FLOAT DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Habilitar Segurança (RLS)
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance ENABLE ROW LEVEL SECURITY;

-- 7. Políticas de Acesso
CREATE POLICY "Manage own vehicles" ON vehicles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Manage own trips" ON trips FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Manage own expenses" ON expenses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Manage own maintenance" ON maintenance FOR ALL USING (auth.uid() = user_id);

-- 8. Limpar Cache da API
NOTIFY pgrst, 'reload schema';`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-12">
      <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-slate-100 text-center">
        <div className="bg-primary-100 text-primary-600 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-8">
          <Database size={48} />
        </div>
        <h2 className="text-3xl font-black mb-4">Exportar Meus Dados</h2>
        <p className="text-slate-500 mb-10 leading-relaxed max-w-md mx-auto">
          Baixe uma cópia local de tudo o que você registrou.
        </p>
        <button onClick={downloadBackup} className="bg-primary-600 hover:bg-primary-700 text-white px-10 py-5 rounded-3xl flex items-center gap-3 font-black text-lg transition-all shadow-xl active:scale-95 mx-auto">
          <Download size={24} /> Baixar Backup (JSON)
        </button>
      </div>

      <div className="bg-slate-900 rounded-[3rem] p-8 md:p-12 text-slate-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-primary-500/20 p-3 rounded-2xl text-primary-400">
              <Code size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Configuração do Supabase</h3>
              <p className="text-sm text-slate-400">Script para resetar e atualizar o banco de dados.</p>
            </div>
          </div>
          <button onClick={copyToClipboard} className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all text-sm font-bold border border-slate-700">
            {copied ? <Check size={18} className="text-emerald-400" /> : <Clipboard size={18} />}
            {copied ? 'Copiado!' : 'Copiar Script SQL'}
          </button>
        </div>

        <div className="bg-amber-900/20 border border-amber-900/50 p-6 rounded-2xl mb-8 flex gap-4 items-start">
          <AlertTriangle className="text-amber-500 shrink-0" size={24} />
          <div className="text-sm text-amber-200/80">
            Use este script para corrigir erros de salvamento ou sincronizar as colunas do banco com o app.
          </div>
        </div>

        <div className="bg-black/40 rounded-3xl p-6 overflow-x-auto max-h-96 border border-slate-800">
          <pre className="text-xs font-mono text-primary-300/80">
            {sqlCode}
          </pre>
        </div>
      </div>
    </div>
  );
};
