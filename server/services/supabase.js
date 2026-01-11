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
export const MOCK_USER_ID = '00000000-0000-0000-0000-000000000001';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERRO: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY devem estar definidos no .env');
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
