import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || (!supabaseAnonKey && !supabaseServiceKey)) {
  console.error('ERRO: VITE_SUPABASE_URL e as chaves do Supabase devem estar definidos no .env');
  process.exit(1);
}

// Em ambiente de servidor, preferimos a service_role key para ignorar RLS
export const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

