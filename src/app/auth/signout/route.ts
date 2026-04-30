import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

/**
 * Sign Out Route Handler
 * Explicitly signs out of Supabase and redirects to login.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  
  // Sign out from Supabase (clears session cookies)
  await supabase.auth.signOut();

  const url = new URL(request.url);
  const response = NextResponse.redirect(new URL('/login', url.origin), {
    status: 303,
  });

  // Also clear the demo mode cookie if it exists
  response.cookies.delete('wealthflow_demo_mode');

  revalidatePath('/', 'layout');
  
  return response;
}
