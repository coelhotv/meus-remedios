import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variáveis de ambiente do Supabase não configuradas. Verifique o arquivo .env'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Mock user ID for pilot phase
export const MOCK_USER_ID = '00000000-0000-0000-0000-000000000001'
