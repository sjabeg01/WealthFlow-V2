'use server';

import { createAccount, updateAccount } from '@/lib/dataService';
import { revalidatePath } from 'next/cache';
import type { Account } from '@/types';

export async function addAccountAction(data: Partial<Account>) {
  await createAccount(data);
  revalidatePath('/settings');
  revalidatePath('/import');
}

export async function editAccountAction(accountId: string, data: Partial<Account>) {
  await updateAccount(accountId, data);
  revalidatePath('/settings');
  revalidatePath('/import');
}
