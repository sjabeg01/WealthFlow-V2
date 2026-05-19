import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import type { Transaction, Category, Goal, Account, Investment, ImportBatch } from '@/types';
import { DEMO_TRANSACTIONS, DEMO_CATEGORIES, DEMO_GOALS, DEMO_ACCOUNTS, DEMO_INVESTMENTS } from '@/lib/demo/demoData';

// --- In-Memory Demo State ---
// This allows mutations during Demo Mode that persist temporarily across requests while the server runs.
let inMemoryDemoTransactions = [...DEMO_TRANSACTIONS];
let inMemoryDemoCategories = [...DEMO_CATEGORIES];
let inMemoryDemoGoals = [...DEMO_GOALS];
let inMemoryDemoAccounts = [...DEMO_ACCOUNTS];
let inMemoryDemoInvestments = [...DEMO_INVESTMENTS];

export function resetDemoState() {
  inMemoryDemoTransactions = [...DEMO_TRANSACTIONS];
  inMemoryDemoCategories = [...DEMO_CATEGORIES];
  inMemoryDemoGoals = [...DEMO_GOALS];
  inMemoryDemoAccounts = [...DEMO_ACCOUNTS];
  inMemoryDemoInvestments = [...DEMO_INVESTMENTS];
}

/**
 * Determines if the app should run in Demo Mode.
 * Returns true if the rakam_demo_mode cookie is set, OR if Supabase is missing.
 */
export async function isDemoModeActive(): Promise<boolean> {
  const cookieStore = await cookies();
  const demoCookie = cookieStore.get('rakam_demo_mode')?.value === 'true';
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const missingEnv = !supabaseUrl || supabaseUrl === 'REPLACE_WITH_YOUR_SUPABASE_URL';

  return demoCookie || missingEnv;
}

/**
 * Returns either the mocked demo user, or the real authenticated user.
 */
export async function getUserSession() {
  const isDemo = await isDemoModeActive();
  if (isDemo) {
    return { user: { id: 'demo-user-123', email: 'demo@example.com' } };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { user: data?.user };
}

// --------------------------------------------------------
// DATA FETCHING (Reads)
// --------------------------------------------------------

export async function getTransactions(from?: string, to?: string): Promise<Transaction[]> {
  const isDemo = await isDemoModeActive();
  
  if (isDemo) {
    let txs = inMemoryDemoTransactions;
    if (from && to) {
      txs = txs.filter(t => t.date >= from && t.date <= to);
    }
    // Sort descending by default
    return txs.sort((a, b) => b.date.localeCompare(a.date));
  }

  const { user } = await getUserSession();
  if (!user) return [];

  const supabase = await createClient();
  let query = supabase
    .from('transactions')
    .select('*, category:categories(*)')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (from && to) {
    query = query.gte('date', from).lte('date', to);
  }

  const { data } = await query;
  const mapped = (data || []).map((t: any) => ({
    ...t,
    final_type: t.final_type // Direct mapping, no fallbacks required
  }));

  return mapped as Transaction[];
}

export async function getCategories(): Promise<Category[]> {
  const isDemo = await isDemoModeActive();
  if (isDemo) {
    return inMemoryDemoCategories;
  }

  const { user } = await getUserSession();
  if (!user) return [];

  const supabase = await createClient();
  const { data } = await supabase.from('categories').select('*').or(`user_id.eq.${user.id},is_system.eq.true`);
  return (data || []) as Category[];
}

export async function getGoals(): Promise<Goal[]> {
  const isDemo = await isDemoModeActive();
  if (isDemo) {
    return inMemoryDemoGoals;
  }

  const { user } = await getUserSession();
  if (!user) return [];

  const supabase = await createClient();
  const { data } = await supabase.from('goals').select('*').eq('user_id', user.id);
  return (data || []) as Goal[];
}

export async function getAccounts(): Promise<Account[]> {
  const isDemo = await isDemoModeActive();
  if (isDemo) {
    return inMemoryDemoAccounts;
  }

  const { user } = await getUserSession();
  if (!user) return [];

  const supabase = await createClient();
  const { data } = await supabase.from('accounts').select('*').eq('user_id', user.id);
  return (data || []) as Account[];
}

export async function getInvestments(): Promise<Investment[]> {
  const isDemo = await isDemoModeActive();
  if (isDemo) {
    return inMemoryDemoInvestments;
  }

  const { user } = await getUserSession();
  if (!user) return [];

  const supabase = await createClient();
  const { data } = await supabase.from('investments').select('*').eq('user_id', user.id);
  return (data || []) as Investment[];
}

export async function getImportHistory(): Promise<ImportBatch[]> {
  const isDemo = await isDemoModeActive();
  if (isDemo) {
    // Return a dummy history for demo mode
    return [
      {
        id: 'demo-batch-1',
        user_id: 'demo-user',
        account_id: 'demo-account-1',
        file_name: 'statement_april_2026.csv',
        file_type: 'csv',
        rows_detected: 25,
        rows_accepted: 22,
        rows_skipped: 3,
        duplicates: 0,
        transfers: 1,
        status: 'committed',
        imported_at: '2026-04-24T10:00:00Z',
      }
    ] as ImportBatch[];
  }

  const { user } = await getUserSession();
  if (!user) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from('import_batches')
    .select('*, account:accounts(name)')
    .eq('user_id', user.id)
    .order('imported_at', { ascending: false });

  return (data || []) as ImportBatch[];
}

// --------------------------------------------------------
// MUTATIONS (Writes)
// --------------------------------------------------------

export async function updateTransactionCategory(transactionId: string, categoryId: string | null) {
  const isDemo = await isDemoModeActive();
  
  if (isDemo) {
    const txIndex = inMemoryDemoTransactions.findIndex(t => t.id === transactionId);
    if (txIndex !== -1) {
      // Only update the category fields. final_type, amount
      // are set at import time and remain immutable unless the transaction is re-imported.
      const cat = inMemoryDemoCategories.find(c => c.id === categoryId);
      inMemoryDemoTransactions[txIndex] = {
        ...inMemoryDemoTransactions[txIndex],
        category_id: categoryId,
        category: cat as any,
      };
    }
    return;
  }

  const { user } = await getUserSession();
  if (!user) throw new Error('Unauthorized');

  const supabase = await createClient();

  // Only update category_id. final_type, amount
  // are fixed at import time and must not be mutated by a category change.
  const { error } = await supabase
    .from('transactions')
    .update({ category_id: categoryId })
    .eq('id', transactionId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
}

export async function createAccount(data: Partial<Account>) {
  const isDemo = await isDemoModeActive();
  
  if (isDemo) {
    const newAccount: Account = {
      ...data,
      id: `demo-account-${Date.now()}`,
      user_id: 'demo-user',
      created_at: new Date().toISOString(),
    } as Account;
    inMemoryDemoAccounts.push(newAccount);
    return;
  }

  const { user } = await getUserSession();
  if (!user) throw new Error('Unauthorized');

  const supabase = await createClient();
  const { error } = await supabase.from('accounts').insert([{ ...data, user_id: user.id }]);
  if (error) throw new Error(error.message);
}

export async function updateAccount(accountId: string, data: Partial<Account>) {
  const isDemo = await isDemoModeActive();
  
  if (isDemo) {
    const index = inMemoryDemoAccounts.findIndex(a => a.id === accountId);
    if (index !== -1) {
      inMemoryDemoAccounts[index] = { ...inMemoryDemoAccounts[index], ...data };
    }
    return;
  }

  const { user } = await getUserSession();
  if (!user) throw new Error('Unauthorized');

  const supabase = await createClient();
  const { error } = await supabase
    .from('accounts')
    .update(data)
    .eq('id', accountId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
}

// ------ Goals ------

export async function createGoal(data: Partial<Goal>) {
  const isDemo = await isDemoModeActive();
  
  if (isDemo) {
    const newGoal: Goal = {
      ...data,
      id: `demo-goal-${Date.now()}`,
      user_id: 'demo-user',
      created_at: new Date().toISOString(),
    } as Goal;
    inMemoryDemoGoals.push(newGoal);
    return;
  }

  const { user } = await getUserSession();
  if (!user) throw new Error('Unauthorized');

  const supabase = await createClient();
  const { error } = await supabase.from('goals').insert([{ ...data, user_id: user.id }]);
  if (error) throw new Error(error.message);
}

export async function updateGoal(goalId: string, data: Partial<Goal>) {
  const isDemo = await isDemoModeActive();
  
  if (isDemo) {
    const index = inMemoryDemoGoals.findIndex(g => g.id === goalId);
    if (index !== -1) {
      inMemoryDemoGoals[index] = { ...inMemoryDemoGoals[index], ...data };
    }
    return;
  }

  const { user } = await getUserSession();
  if (!user) throw new Error('Unauthorized');

  const supabase = await createClient();
  const { error } = await supabase
    .from('goals')
    .update(data)
    .eq('id', goalId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
}

export async function deleteGoal(goalId: string) {
  const isDemo = await isDemoModeActive();
  
  if (isDemo) {
    inMemoryDemoGoals = inMemoryDemoGoals.filter(g => g.id !== goalId);
    return;
  }

  const { user } = await getUserSession();
  if (!user) throw new Error('Unauthorized');

  const supabase = await createClient();
  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', goalId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
}

// ------ Investments ------

export async function createInvestment(data: Partial<Investment>) {
  const isDemo = await isDemoModeActive();
  
  if (isDemo) {
    const newInv: Investment = {
      ...data,
      id: `demo-inv-${Date.now()}`,
      user_id: 'demo-user',
      created_at: new Date().toISOString(),
    } as Investment;
    inMemoryDemoInvestments.push(newInv);
    return;
  }

  const { user } = await getUserSession();
  if (!user) throw new Error('Unauthorized');

  const supabase = await createClient();
  const { error } = await supabase.from('investments').insert([{ ...data, user_id: user.id }]);
  if (error) throw new Error(error.message);
}

export async function updateInvestment(invId: string, data: Partial<Investment>) {
  const isDemo = await isDemoModeActive();
  
  if (isDemo) {
    const index = inMemoryDemoInvestments.findIndex(i => i.id === invId);
    if (index !== -1) {
      inMemoryDemoInvestments[index] = { ...inMemoryDemoInvestments[index], ...data };
    }
    return;
  }

  const { user } = await getUserSession();
  if (!user) throw new Error('Unauthorized');

  const supabase = await createClient();
  const { error } = await supabase
    .from('investments')
    .update(data)
    .eq('id', invId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
}

export async function deleteInvestment(invId: string) {
  const isDemo = await isDemoModeActive();
  
  if (isDemo) {
    inMemoryDemoInvestments = inMemoryDemoInvestments.filter(i => i.id !== invId);
    return;
  }

  const { user } = await getUserSession();
  if (!user) throw new Error('Unauthorized');

  const supabase = await createClient();
  const { error } = await supabase
    .from('investments')
    .delete()
    .eq('id', invId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
}
