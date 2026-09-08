import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your-supabase-project-url') {
  console.warn('⚠️ [Supabase] Credentials not configured or using placeholders in .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;
