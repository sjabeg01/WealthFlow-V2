'use server';

import { createClient } from '@/lib/supabase/server';
import { isDemoModeActive, getUserSession } from '@/lib/dataService';
import { revalidatePath } from 'next/cache';

export async function updateCategoryType(categoryId: string, type: 'expense_only' | 'income_only' | 'mixed') {
  const isDemo = await isDemoModeActive();
  if (isDemo) {
    // In demo mode, we just return. Since there is no database update, we can't persist.
    // However, we should still return successfully.
    return;
  }

  const { user } = await getUserSession();
  if (!user) throw new Error('Unauthorized');

  const supabase = await createClient();
  const { error } = await supabase
    .from('categories')
    .update({ type })
    .eq('id', categoryId)
    .eq('user_id', user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/categories');
}
