'use server';

import { createInvestment, updateInvestment, deleteInvestment } from '@/lib/dataService';
import { revalidatePath } from 'next/cache';
import type { Investment } from '@/types';

export async function addInvestmentAction(data: Partial<Investment>) {
  await createInvestment(data);
  revalidatePath('/investments');
}

export async function editInvestmentAction(invId: string, data: Partial<Investment>) {
  await updateInvestment(invId, data);
  revalidatePath('/investments');
}

export async function deleteInvestmentAction(invId: string) {
  await deleteInvestment(invId);
  revalidatePath('/investments');
}
