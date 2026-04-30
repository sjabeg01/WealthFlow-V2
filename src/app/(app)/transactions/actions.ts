'use server';

import { updateTransactionCategory as updateCategoryService } from '@/lib/dataService';
import { revalidatePath } from 'next/cache';

export async function updateTransactionCategory(transactionId: string, categoryId: string | null) {
  await updateCategoryService(transactionId, categoryId);

  // Revalidate paths to instantly update the UI
  revalidatePath('/transactions');
  revalidatePath('/dashboard');
  revalidatePath('/reports');
  revalidatePath('/categories');
}
