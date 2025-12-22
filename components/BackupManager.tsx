import React from 'react';
import { Database, Download } from 'lucide-react';

export const BackupManager: React.FC<{ data: any }> = ({ data }) => {
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

  return (
    <div className="max-w-2xl mx-auto py-12 text-center">
      <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-slate-100">
        <div className="bg-primary-100 text-primary-600 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-8">
          <Database size={48} />
        </div>
        <h2 className="text-3xl font-black mb-4">Central de Backup</h2>
        <p className="text-slate-500 mb-10 leading-relaxed">
          Sua segurança é prioridade. Exportar seus dados garante que você tenha uma cópia local de todas as viagens, veículos e manutenções registradas no AuriLog.
        </p>
        <button 
          onClick={downloadBackup}
          className="bg-primary-600 hover:bg-primary-700 text-white px-10 py-5 rounded-3xl flex items-center gap-3 font-black text-lg transition-all shadow-xl hover:shadow-primary-200 active:scale-95 mx-auto"
        >
          <Download size={24} /> Exportar Dados (JSON)
        </button>
        <p className="text-[10px] text-slate-400 mt-8 uppercase font-bold tracking-widest">
          Backup criptografado pelo Supabase • Exportação local permitida
        </p>
      </div>
    </div>
  );
};