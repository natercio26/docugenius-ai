
import { createClient } from '@supabase/supabase-js';

// Supabase initialization
// These are public keys that are safe to expose in the client-side code
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://example.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4YW1wbGUiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxMzQwNDExMSwiZXhwIjoxOTI4OTgwMTExfQ.mock-key-for-dev';

// Check if running in development mode - show warning but proceed with mock values
if (import.meta.env.DEV && 
    (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY)) {
  console.warn(`
    ⚠️ Supabase credentials not found in environment variables. 
    Using mock values for development. 
    
    Please provide the following environment variables for proper functionality:
    - VITE_SUPABASE_URL
    - VITE_SUPABASE_ANON_KEY
    
    Add these to your .env file or project settings.
  `);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Add a mock authentication provider for development
export const mockAuthState = {
  user: {
    id: 'mock-user-id',
    email: 'user@example.com',
    name: 'Mock User'
  },
  session: {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_at: Date.now() + 3600000 // 1 hour from now
  }
};
