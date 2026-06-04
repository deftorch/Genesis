import { createClient } from '@supabase/supabase-js';
import { env } from './env';

const supabaseUrl = env.supabase.url || '';
const supabaseAnonKey = env.supabase.anonKey || '';

// Safely initialize Supabase client or fall back to a mock client to prevent build errors when config is missing
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : ({
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: (callback: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ data: { session: null, user: null }, error: new Error('Supabase not configured') }),
        signUp: async () => ({ data: { session: null, user: null }, error: new Error('Supabase not configured') }),
        signOut: async () => ({ error: null }),
      }
    } as any);
