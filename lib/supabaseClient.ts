import { createClient } from '@supabase/supabase-js';
import { env } from './env';

const supabaseUrl = env.supabase.url || '';
const supabaseAnonKey = env.supabase.anonKey || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
