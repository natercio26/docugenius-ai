
import { createClient } from '@supabase/supabase-js';

// Supabase initialization
// These are public keys that are safe to expose in the client-side code
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key not provided. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
