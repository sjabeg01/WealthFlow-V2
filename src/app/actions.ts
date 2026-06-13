'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { resetDemoState, getDataSources } from '@/lib/dataService';

export async function enableDemoMode() {
  const cookieStore = await cookies();
  cookieStore.set('rakam_demo_mode', 'true', { path: '/' });
  resetDemoState(); // Give them a fresh demo state
  revalidatePath('/', 'layout');
}

export async function disableDemoMode() {
  const cookieStore = await cookies();
  cookieStore.delete('rakam_demo_mode');
  revalidatePath('/', 'layout');
}

export async function fetchSources() {
  return await getDataSources();
}

export async function dismissWizard() {
  const cookieStore = await cookies();
  cookieStore.set('rakam_setup_dismissed', 'true', { path: '/' });
  revalidatePath('/', 'layout');
}
