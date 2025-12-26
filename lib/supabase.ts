
import { createClient } from '@supabase/supabase-js';

// Credenciais de conexão
const supabaseUrl = 'https://hbqzareyfehtcsnfyeft.supabase.co';
const supabaseAnonKey = 'sb_publishable_JBI23-gaSy8CCqTxD1FzfQ_-ZlVt8KX';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
