import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

let supabaseOnline = false;
let lastCheckTime = 0;
const CHECK_INTERVAL_MS = 60000; // 1 minute

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
  global: {
    fetch: (url, options = {}) => fetch(url, { ...options, signal: AbortSignal.timeout(2000) })
  }
});

export const isSupabaseOnline = () => {
  return supabaseOnline;
};

export const checkSupabaseConnection = async () => {
  const now = Date.now();
  if (now - lastCheckTime < CHECK_INTERVAL_MS) {
    return supabaseOnline;
  }
  lastCheckTime = now;

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: { apikey: supabaseAnonKey },
      signal: AbortSignal.timeout(1500)
    });
    supabaseOnline = res.ok || res.status === 401;
    if (supabaseOnline) {
      console.log('✅ Supabase connected successfully');
    } else {
      console.warn('⚠️ Supabase unreachable, operating in resilient local mode.');
    }
  } catch {
    supabaseOnline = false;
    console.warn('⚠️ Supabase network check failed, operating in resilient local mode.');
  }

  return supabaseOnline;
};

// Initial connection check on startup
checkSupabaseConnection().catch(() => {});

export default supabase;
