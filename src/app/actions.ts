'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { resetDemoState } from '@/lib/dataService';

export async function enableDemoMode() {
  const cookieStore = await cookies();
  cookieStore.set('wealthflow_demo_mode', 'true', { path: '/' });
  resetDemoState(); // Give them a fresh demo state
  revalidatePath('/', 'layout');
}

export async function disableDemoMode() {
  const cookieStore = await cookies();
  cookieStore.delete('wealthflow_demo_mode');
  revalidatePath('/', 'layout');
}
