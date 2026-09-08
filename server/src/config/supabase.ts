import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL === 'your-supabase-project-url') {
  console.warn('⚠️ [Supabase] Credentials not configured or using placeholders in .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;
