import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import type { Transaction, Category, Goal, Account, Investment, ImportBatch, DataSource, SyncLog } from '@/types';
import { DEMO_TRANSACTIONS, DEMO_CATEGORIES, DEMO_GOALS, DEMO_ACCOUNTS, DEMO_INVESTMENTS } from '@/lib/demo/demoData';

// --- In-Memory Demo State ---
// This allows mutations during Demo Mode that persist temporarily across requests while the server runs.
let inMemoryDemoTransactions = [...DEMO_TRANSACTIONS];
let inMemoryDemoCategories = [...DEMO_CATEGORIES];
let inMemoryDemoGoals = [...DEMO_GOALS];
let inMemoryDemoAccounts = [...DEMO_ACCOUNTS];
let inMemoryDemoInvestments = [...DEMO_INVESTMENTS];
let inMemoryDemoSources: DataSource[] = [];
let inMemoryDemoSyncLogs: SyncLog[] = [];

export function resetDemoState() {
  inMemoryDemoTransactions = [...DEMO_TRANSACTIONS];
  inMemoryDemoCategories = [...DEMO_CATEGORIES];
  inMemoryDemoGoals = [...DEMO_GOALS];
  inMemoryDemoAccounts = [...DEMO_ACCOUNTS];
  inMemoryDemoInvestments = [...DEMO_INVESTMENTS];
  inMemoryDemoSources = [];
  inMemoryDemoSyncLogs = [];
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
      const cat = inMemoryDemoCategories.find(c => c.id === categoryId);
      // Derive final_type from category type so amount sign flips correctly
      let derivedFinalType: string | undefined;
      if (cat?.type === 'income_only') {
        derivedFinalType = 'income';
      } else if (cat?.type === 'expense_only') {
        derivedFinalType = 'expense';
      }
      inMemoryDemoTransactions[txIndex] = {
        ...inMemoryDemoTransactions[txIndex],
        category_id: categoryId,
        category: cat as any,
        ...(derivedFinalType ? { final_type: derivedFinalType as any } : {}),
        user_corrected: true,
      };
    }
    return;
  }

  const { user } = await getUserSession();
  if (!user) throw new Error('Unauthorized');

  const supabase = await createClient();

  // Look up the category to derive final_type from its type
  let derivedFinalType: string | undefined;
  if (categoryId) {
    const { data: catData } = await supabase
      .from('categories')
      .select('type')
      .eq('id', categoryId)
      .single();
    if (catData?.type === 'income_only') {
      derivedFinalType = 'income';
    } else if (catData?.type === 'expense_only') {
      derivedFinalType = 'expense';
    }
    // 'mixed' or null → keep existing final_type
  }

  const updatePayload: Record<string, any> = {
    category_id: categoryId,
    user_corrected: true,
  };
  if (derivedFinalType) {
    updatePayload.final_type = derivedFinalType;
  }

  const { error } = await supabase
    .from('transactions')
    .update(updatePayload)
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

// --------------------------------------------------------
// DATA SOURCES & SYNC LOGS
// --------------------------------------------------------

export async function hasAnySources(): Promise<boolean> {
  const isDemo = await isDemoModeActive();
  if (isDemo) return inMemoryDemoSources.length > 0;

  const { user } = await getUserSession();
  if (!user) return false;

  const supabase = await createClient();
  const { count } = await supabase
    .from('data_sources')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  return (count || 0) > 0;
}

export async function getDataSources(): Promise<DataSource[]> {
  const isDemo = await isDemoModeActive();
  if (isDemo) {
    return [...inMemoryDemoSources].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  const { user } = await getUserSession();
  if (!user) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from('data_sources')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Convert snake_case to camelCase
  return (data || []).map(s => ({
    id: s.id,
    userId: s.user_id,
    type: s.type,
    label: s.label,
    status: s.status,
    lastSyncAt: s.last_sync_at,
    lastSyncStatus: s.last_sync_status,
    lastErrorMessage: s.last_error_message,
    metadata: s.metadata,
    transactionCount: s.transaction_count,
    dateRangeFrom: s.date_range_from,
    dateRangeTo: s.date_range_to,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
  })) as DataSource[];
}

export async function createDataSource(data: Partial<DataSource>): Promise<DataSource> {
  const isDemo = await isDemoModeActive();
  
  const newSource = {
    id: data.id || `src-${Date.now()}`,
    userId: 'demo-user',
    type: data.type || 'manual',
    label: data.label || 'Unknown',
    status: data.status || 'active',
    metadata: data.metadata || {},
    transactionCount: data.transactionCount || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...data
  } as DataSource;

  if (isDemo) {
    inMemoryDemoSources.push(newSource);
    return newSource;
  }

  const { user } = await getUserSession();
  if (!user) throw new Error('Unauthorized');

  newSource.userId = user.id;
  
  const supabase = await createClient();
  const dbPayload = {
    user_id: user.id,
    type: newSource.type,
    label: newSource.label,
    status: newSource.status,
    metadata: newSource.metadata,
    transaction_count: newSource.transactionCount,
    last_sync_at: newSource.lastSyncAt,
    last_sync_status: newSource.lastSyncStatus,
    date_range_from: newSource.dateRangeFrom,
    date_range_to: newSource.dateRangeTo,
  };

  const { data: result, error } = await supabase
    .from('data_sources')
    .insert([dbPayload])
    .select()
    .single();

  if (error) throw new Error(error.message);
  
  return {
    ...newSource,
    id: result.id,
    createdAt: result.created_at,
    updatedAt: result.updated_at,
  };
}

export async function updateDataSourceStatus(
  id: string, 
  status: string, 
  metadata?: Record<string, any>
) {
  const isDemo = await isDemoModeActive();
  if (isDemo) {
    const idx = inMemoryDemoSources.findIndex(s => s.id === id);
    if (idx !== -1) {
      inMemoryDemoSources[idx].status = status as any;
      inMemoryDemoSources[idx].updatedAt = new Date().toISOString();
      if (metadata) {
        inMemoryDemoSources[idx].metadata = { ...inMemoryDemoSources[idx].metadata, ...metadata };
      }
    }
    return;
  }

  const { user } = await getUserSession();
  if (!user) throw new Error('Unauthorized');

  const supabase = await createClient();
  const payload: any = { 
    status, 
    updated_at: new Date().toISOString() 
  };
  if (metadata) payload.metadata = metadata;

  const { error } = await supabase
    .from('data_sources')
    .update(payload)
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
}

export async function getSyncLogs(sourceId: string, limit = 5): Promise<SyncLog[]> {
  const isDemo = await isDemoModeActive();
  if (isDemo) {
    return inMemoryDemoSyncLogs
      .filter(l => l.sourceId === sourceId)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      .slice(0, limit);
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from('sync_logs')
    .select('*')
    .eq('source_id', sourceId)
    .order('started_at', { ascending: false })
    .limit(limit);

  return (data || []).map(l => ({
    id: l.id,
    sourceId: l.source_id,
    status: l.status,
    transactionsFound: l.transactions_found,
    transactionsImported: l.transactions_imported,
    transactionsSkipped: l.transactions_skipped,
    errorMessage: l.error_message,
    errorDetails: l.error_details,
    durationMs: l.duration_ms,
    startedAt: l.started_at,
    completedAt: l.completed_at,
  })) as SyncLog[];
}

export async function createSyncLog(sourceId: string, data: Partial<SyncLog>) {
  const isDemo = await isDemoModeActive();
  const newLog = {
    id: `log-${Date.now()}`,
    sourceId,
    startedAt: new Date().toISOString(),
    status: 'running',
    transactionsFound: 0,
    transactionsImported: 0,
    transactionsSkipped: 0,
    durationMs: 0,
    ...data
  } as SyncLog;

  if (isDemo) {
    inMemoryDemoSyncLogs.push(newLog);
    return newLog;
  }

  const supabase = await createClient();
  const { error } = await supabase.from('sync_logs').insert([{
    source_id: sourceId,
    status: newLog.status,
    transactions_found: newLog.transactionsFound,
    transactions_imported: newLog.transactionsImported,
    transactions_skipped: newLog.transactionsSkipped,
    error_message: newLog.errorMessage,
    error_details: newLog.errorDetails,
    duration_ms: newLog.durationMs,
    started_at: newLog.startedAt,
    completed_at: newLog.completedAt,
  }]);

  if (error) throw new Error(error.message);
}

export async function linkImportBatchToSource(importBatchId: string, sourceId: string) {
  const isDemo = await isDemoModeActive();
  if (isDemo) return; // In demo mode, relations are mocked anyway

  const supabase = await createClient();
  
  // Link batch
  await supabase
    .from('import_batches')
    .update({ source_id: sourceId })
    .eq('id', importBatchId);
    
  // Link transactions
  await supabase
    .from('transactions')
    .update({ source_id: sourceId })
    .eq('import_batch_id', importBatchId);
}
