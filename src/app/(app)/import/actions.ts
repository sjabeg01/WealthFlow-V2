'use server';

import { createClient } from '@/lib/supabase/server';
import type { ImportPreview, ParsedRow } from '@/types';
import { inferType, inferDirection, cleanMerchant, detectCategory } from '@/lib/normalization';
import { processTransferPairing } from '@/lib/import/transferMatcher';

export async function commitImportBatch(
  accountId: string,
  preview: ImportPreview,
  acceptedRows: ParsedRow[]
) {
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    throw new Error('Unauthorized');
  }

  const userId = userData.user.id;

  // 1. Create Import Batch
  const { data: batchData, error: batchError } = await supabase
    .from('import_batches')
    .insert({
      user_id: userId,
      account_id: accountId,
      file_name: preview.fileName,
      file_type: preview.fileType,
      rows_detected: preview.acceptedRows.length + preview.skippedRows.length,
      rows_accepted: acceptedRows.length,
      rows_skipped: preview.skippedRows.length + (preview.acceptedRows.length - acceptedRows.length),
      duplicates: preview.duplicateCount,
      transfers: preview.transferCount,
      status: 'committed',
    })
    .select('id')
    .single();

  if (batchError) throw new Error(`Failed to create import batch: ${batchError.message}`);

  const batchId = batchData.id;

  // Fetch User Category Rules
  let userRules: any[] = [];
  const { data: rulesData } = await supabase
    .from('category_rules')
    .select('*')
    .eq('user_id', userId)
    .eq('is_enabled', true)
    .order('priority', { ascending: false });
    
  if (rulesData) userRules = rulesData;

  // Fetch System Categories for Fallback resolution
  let systemCategories: any[] = [];
  const { data: sysCatData } = await supabase
    .from('categories')
    .select('id, name')
    .eq('is_system', true);
  
  if (sysCatData) systemCategories = sysCatData;

  // 2. Prepare Transactions & Detect Duplicates
  const dates = acceptedRows.map(r => r.date).filter(Boolean) as string[];
  const minDate = dates.reduce((min, d) => d < min ? d : min, dates[0]);
  const maxDate = dates.reduce((max, d) => d > max ? d : max, dates[0]);

  let existingTransactions: any[] = [];
  if (minDate && maxDate) {
    const { data } = await supabase
      .from('transactions')
      .select('id, date, amount, merchant, description')
      .eq('account_id', accountId)
      .gte('date', minDate)
      .lte('date', maxDate);
    if (data) existingTransactions = data;
  }

  // Create lookup set for O(1) duplicate checks
  const existingSet = new Set(
    existingTransactions.map(t => `${t.date}|${Number(t.amount).toFixed(2)}|${t.merchant}|${t.description}`)
  );

  let duplicateCount = 0;
  const finalAcceptedRows: ParsedRow[] = [];
  const finalSkippedDueToDuplicate: Array<ParsedRow & { reason: string }> = [];

  const transactionsToInsert = [];
  
  // High confidence transfer candidates (to be paired later)
  const transferCandidates: any[] = [];

  for (const row of acceptedRows) {
    const rawDesc = row.description || '';
    const merchant = cleanMerchant(rawDesc);
    const amount = row.amount || 0;
    
    // Check Duplicate
    const dupKey = `${row.date}|${amount.toFixed(2)}|${merchant}|${rawDesc}`;
    if (existingSet.has(dupKey)) {
      duplicateCount++;
      finalSkippedDueToDuplicate.push({ ...row, reason: 'Duplicate' });
      continue; // Skip this row
    }
    
    // Add to set to prevent duplicates within the same file
    existingSet.add(dupKey);
    finalAcceptedRows.push(row);
    
    const { type, confidence } = inferType(amount, rawDesc, merchant);
    const direction = inferDirection(amount);
    
    // Auto-categorize
    const { categoryId: detectedCatId, categoryName: detectedCatName } = detectCategory(rawDesc, merchant, userRules);
    
    // We only have categoryName for fallback static rules, which we'd need to resolve to an ID if we want to assign it.
    let finalCategoryId = detectedCatId;
    if (!finalCategoryId && detectedCatName) {
      const sysCat = systemCategories.find(c => c.name.toLowerCase() === detectedCatName.toLowerCase());
      if (sysCat) {
        finalCategoryId = sysCat.id;
      }
    }

    const tx = {
      user_id: userId,
      account_id: accountId,
      import_batch_id: batchId,
      date: row.date,
      description: rawDesc,
      merchant,
      amount,
      direction,
      type,
      category_id: finalCategoryId,
      is_transfer: type === 'transfer',
      is_investment: type === 'investment',
      source: 'import',
      confidence,
    };
    
    transactionsToInsert.push(tx);
    
    if (tx.is_transfer && confidence === 'high') {
      transferCandidates.push(tx);
    }
  }

  // 3. Insert Transactions
  if (transactionsToInsert.length > 0) {
    const { error: txError } = await supabase
      .from('transactions')
      .insert(transactionsToInsert);

    if (txError) throw new Error(`Failed to insert transactions: ${txError.message}`);
  }

  // 4. Update Batch Stats
  await supabase
    .from('import_batches')
    .update({
      rows_accepted: finalAcceptedRows.length,
      rows_skipped: preview.skippedRows.length + finalSkippedDueToDuplicate.length,
      duplicates: preview.duplicateCount + duplicateCount,
    })
    .eq('id', batchId);

  // 5. Prepare Audit Rows
  const auditRowsToInsert = [
    ...finalAcceptedRows.map(r => ({
      batch_id: batchId,
      row_index: r.rowIndex,
      raw_data: r.rawData,
      status: 'accepted',
      skip_reason: null,
    })),
    ...preview.skippedRows.map(r => ({
      batch_id: batchId,
      row_index: r.rowIndex,
      raw_data: r.rawData,
      status: 'skipped',
      skip_reason: r.reason,
    })),
    ...finalSkippedDueToDuplicate.map(r => ({
      batch_id: batchId,
      row_index: r.rowIndex,
      raw_data: r.rawData,
      status: 'duplicate',
      skip_reason: r.reason,
    }))
  ];

  // 6. Insert Audit Rows
  if (auditRowsToInsert.length > 0) {
    const { error: auditError } = await supabase
      .from('import_rows')
      .insert(auditRowsToInsert);
      
    if (auditError) console.error(`Failed to insert audit rows: ${auditError.message}`);
    // We don't fail the whole import if audit rows fail, but we log it.
  }

  // 7. Post-import: Process Transfer Pairing
  await processTransferPairing(userId);

  return { success: true, batchId };
}

export async function deleteImportBatch(batchId: string) {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error('Unauthorized');

  // 1. Delete associated transactions
  const { error: txError } = await supabase
    .from('transactions')
    .delete()
    .eq('import_batch_id', batchId)
    .eq('user_id', userData.user.id);

  if (txError) throw new Error(`Failed to delete transactions: ${txError.message}`);

  // 2. Delete the batch (cascades to import_rows)
  const { error: batchError } = await supabase
    .from('import_batches')
    .delete()
    .eq('id', batchId)
    .eq('user_id', userData.user.id);

  if (batchError) throw new Error(`Failed to delete import batch: ${batchError.message}`);

  return { success: true };
}

export async function createInlineAccount(name: string, institution: string, balance: number) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('accounts')
    .insert({
      user_id: userData.user.id,
      name,
      institution,
      current_balance: balance,
      is_active: true
    })
    .select('*')
    .single();

  if (error) throw new Error(`Failed to create account: ${error.message}`);
  return data;
}

export async function checkDuplicates(accountId: string, rows: ParsedRow[]): Promise<number[]> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return [];

  const dates = rows.map(r => r.date).filter(Boolean) as string[];
  if (dates.length === 0) return [];
  
  const minDate = dates.reduce((min, d) => d < min ? d : min, dates[0]);
  const maxDate = dates.reduce((max, d) => d > max ? d : max, dates[0]);

  const { data } = await supabase
    .from('transactions')
    .select('date, amount, merchant, description')
    .eq('account_id', accountId)
    .gte('date', minDate)
    .lte('date', maxDate);

  if (!data || data.length === 0) return [];

  const existingSet = new Set(
    data.map(t => `${t.date}|${Number(t.amount).toFixed(2)}|${t.merchant}|${t.description}`)
  );

  const duplicateIndices: number[] = [];
  
  // Also track within-file duplicates to exclude them
  const currentSet = new Set<string>();

  rows.forEach((row, index) => {
    const rawDesc = row.description || '';
    const merchant = cleanMerchant(rawDesc);
    const amount = row.amount || 0;
    
    const dupKey = `${row.date}|${amount.toFixed(2)}|${merchant}|${rawDesc}`;
    
    if (existingSet.has(dupKey) || currentSet.has(dupKey)) {
      duplicateIndices.push(index);
    } else {
      currentSet.add(dupKey);
    }
  });

  return duplicateIndices;
}
