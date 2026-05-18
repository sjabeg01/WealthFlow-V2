// ============================================================
// Supabase server client
// Used in Server Components, Route Handlers, and middleware
// ============================================================
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || supabaseUrl === 'REPLACE_WITH_YOUR_SUPABASE_URL' || !supabaseAnonKey || supabaseAnonKey === 'REPLACE_WITH_YOUR_SUPABASE_ANON_KEY') {
    console.warn('[Rakam] Supabase env variables are missing. App will default to Demo Mode.');
    // We still return a client so types and downstream non-fetching code doesn't crash, 
    // but the dataService will intercept fetches before they hit this client.
    // We use a dummy URL so the SSR client can initialize without throwing.
    return createServerClient('https://demo.supabase.co', 'dummy-key', {
      cookies: {
        getAll() { return []; },
        setAll() {}
      }
    });
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // In Server Components, cookies can't be set (called from RSC).
          // This is safe to ignore — middleware handles session refresh.
        }
      },
    },
  });
}
