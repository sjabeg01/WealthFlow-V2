'use server';

import { createClient } from '@/lib/supabase/server';
import type { ImportPreview, ParsedRow } from '@/types';
import { cleanMerchant, detectCategory } from '@/lib/normalization';
import { deriveFinalType, type ClassificationContext } from '@/lib/importPipeline/deriveFinalType';
import { normalizeAmount } from '@/lib/importPipeline/normalizeAmount';
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

  // Fetch all user and system categories with their type
  let allCategories: any[] = [];
  const { data: allCatData } = await supabase
    .from('categories')
    .select('id, name, type, is_system')
    .or(`user_id.eq.${userId},is_system.eq.true`);
  
  if (allCatData) allCategories = allCatData;

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

  // Create lookup set for O(1) duplicate checks using absolute amounts
  const existingSet = new Set(
    existingTransactions.map(t => `${t.date}|${Math.abs(Number(t.amount)).toFixed(2)}|${t.merchant}|${t.description}`)
  );

  let duplicateCount = 0;
  const finalAcceptedRows: ParsedRow[] = [];
  const finalSkippedDueToDuplicate: Array<ParsedRow & { reason: string }> = [];

  const transactionsToInsert = [];
  const reviewQueue = [];
  
  // High confidence transfer candidates (to be paired later)
  const transferCandidates: any[] = [];

  for (const row of acceptedRows) {
    const rawDesc = row.description || '';
    const merchant = cleanMerchant(rawDesc);
    const amount = row.amount || 0;
    
    // Check Duplicate using absolute amount
    const dupKey = `${row.date}|${Math.abs(amount).toFixed(2)}|${merchant}|${rawDesc}`;
    if (existingSet.has(dupKey)) {
      duplicateCount++;
      finalSkippedDueToDuplicate.push({ ...row, reason: 'Duplicate' });
      continue; // Skip this row
    }
    
    // Add to set to prevent duplicates within the same file
    existingSet.add(dupKey);
    finalAcceptedRows.push(row);
    
    // Auto-categorize (for label only)
    const { categoryId: detectedCatId, categoryName: detectedCatName } = detectCategory(rawDesc, merchant, userRules);
    
    // Prioritize category resolved during preview
    let finalCategoryName = row.inferredCategoryName || detectedCatName;
    let finalCategoryId: string | null = null;

    if (row.inferredCategoryName) {
      const sysCat = allCategories.find(c => c.is_system && c.name.toLowerCase() === row.inferredCategoryName!.toLowerCase());
      if (sysCat) {
        finalCategoryId = sysCat.id;
        finalCategoryName = sysCat.name;
      }
    }

    if (!finalCategoryId) {
      finalCategoryId = detectedCatId;
      if (!finalCategoryId && detectedCatName) {
        const sysCat = allCategories.find(c => c.is_system && c.name.toLowerCase() === detectedCatName.toLowerCase());
        if (sysCat) {
          finalCategoryId = sysCat.id;
          finalCategoryName = sysCat.name;
        }
      } else if (finalCategoryId) {
        const sysCat = allCategories.find(c => c.id === finalCategoryId);
        if (sysCat) {
          finalCategoryName = sysCat.name;
        }
      }
    }

    // Look up the category's type from our fetched allCategories list
    const matchedCategory = allCategories.find(c => c.id === finalCategoryId);
    const userCategoryType = matchedCategory?.type ?? undefined;
    
    // 2. CLASSIFICATION ENGINE
    const mapping = preview.columnMapping;
    const rawDebit = mapping.debitColumn ? row.rawData[mapping.debitColumn] : undefined;
    const rawCredit = mapping.creditColumn ? row.rawData[mapping.creditColumn] : undefined;
    const rawDir = mapping.transactionDirectionColumn ? row.rawData[mapping.transactionDirectionColumn] : undefined;
    const rawCategoryHint = mapping.categoryHintColumn ? row.rawData[mapping.categoryHintColumn] : undefined;

    const context: ClassificationContext = {
      amount:                 row.amount         ? parseFloat(String(row.amount).replace(/[,$\s]/g, ''))         : undefined,
      debit_amount:           rawDebit           ? parseFloat(String(rawDebit).replace(/[,$\s]/g, ''))           : undefined,
      credit_amount:          rawCredit          ? parseFloat(String(rawCredit).replace(/[,$\s]/g, ''))          : undefined,
      transaction_direction:  (rawDir as string) ?? undefined,
      merchant_name:          merchant ?? rawDesc ?? undefined,
      category_hint:          (rawCategoryHint as string) ?? undefined,
      user_category_type:     userCategoryType,
    };

    const classification = deriveFinalType(context);
    
    // Respect explicit manual user override from the preview grid!
    const finalType = row.user_override ?? (classification.final_type as 'income' | 'expense' | 'transfer' | 'investment' | 'refund' | 'needs_review');
    const confidence = row.user_override ? 'high' : classification.confidence;
    const classificationReason = row.user_override 
      ? `User manual override to ${row.user_override}` 
      : classification.reason;
    
    const rawAmountForNorm = row.amount ?? context.debit_amount ?? context.credit_amount ?? 0;
    const signedAmount = normalizeAmount(rawAmountForNorm, finalType);

    const tx = {
      user_id: userId,
      account_id: accountId,
      import_batch_id: batchId,
      date: row.date,
      description: rawDesc,
      merchant,
      amount: signedAmount, // Normalized amount
      type: finalType,
      direction: (finalType === 'income' || finalType === 'refund') ? 'credit' : (finalType === 'transfer') ? 'internal' : 'debit',
      is_transfer: finalType === 'transfer',
      is_investment: finalType === 'investment',
      category_id: finalCategoryId,
      transfer_pair_id: null,
      source: 'import',
      confidence,
      notes: classificationReason,
    };
    
    if (finalType === 'needs_review') {
      reviewQueue.push(tx);
      continue;
    }
    
    transactionsToInsert.push(tx);
    
    if (finalType === 'transfer' && confidence === 'high') {
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
    data.map(t => `${t.date}|${Math.abs(Number(t.amount)).toFixed(2)}|${t.merchant}|${t.description}`)
  );

  const duplicateIndices: number[] = [];
  
  // Also track within-file duplicates to exclude them
  const currentSet = new Set<string>();

  rows.forEach((row, index) => {
    const rawDesc = row.description || '';
    const merchant = cleanMerchant(rawDesc);
    const amount = row.amount || 0;
    
    const dupKey = `${row.date}|${Math.abs(amount).toFixed(2)}|${merchant}|${rawDesc}`;
    
    if (existingSet.has(dupKey) || currentSet.has(dupKey)) {
      duplicateIndices.push(index);
    } else {
      currentSet.add(dupKey);
    }
  });

  return duplicateIndices;
}
