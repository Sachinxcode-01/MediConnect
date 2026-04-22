import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your-supabase-project-url') {
  console.warn('⚠️  Supabase credentials not configured. Check your .env file.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
