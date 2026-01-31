
-- Esquema de tabelas para AuriLog
-- Certifique-se de habilitar as políticas de RLS para cada tabela.

CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plate TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER,
    current_km INTEGER DEFAULT 0,
    axles INTEGER DEFAULT 2,
    cargo_type TEXT DEFAULT 'geral',
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicione as demais tabelas conforme necessário (trips, expenses, maintenance, jornada_logs)
