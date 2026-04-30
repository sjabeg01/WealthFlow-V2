'use server';

import { createGoal, updateGoal, deleteGoal } from '@/lib/dataService';
import { revalidatePath } from 'next/cache';
import type { Goal } from '@/types';

export async function addGoalAction(data: Partial<Goal>) {
  await createGoal(data);
  revalidatePath('/goals');
}

export async function editGoalAction(goalId: string, data: Partial<Goal>) {
  await updateGoal(goalId, data);
  revalidatePath('/goals');
}

export async function deleteGoalAction(goalId: string) {
  await deleteGoal(goalId);
  revalidatePath('/goals');
}
