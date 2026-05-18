// ============================================================
// Supabase browser client
// Used in Client Components ('use client')
// ============================================================
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || supabaseUrl === 'REPLACE_WITH_YOUR_SUPABASE_URL') {
    throw new Error(
      '[Rakam] Supabase URL is not configured.\n' +
      'Copy .env.example to .env.local and fill in your Supabase project URL.'
    );
  }

  if (!supabaseAnonKey || supabaseAnonKey === 'REPLACE_WITH_YOUR_SUPABASE_ANON_KEY') {
    throw new Error(
      '[Rakam] Supabase anon key is not configured.\n' +
      'Copy .env.example to .env.local and fill in your Supabase anon key.'
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
