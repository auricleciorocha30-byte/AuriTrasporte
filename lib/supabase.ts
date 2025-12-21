import { createClient } from '@supabase/supabase-js';

// Assume-se que as variáveis de ambiente estão configuradas no Vercel/Ambiente
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);