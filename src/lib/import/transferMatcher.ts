import { createClient } from '@/lib/supabase/server';
import { differenceInDays, parseISO } from 'date-fns';

export async function processTransferPairing(userId: string) {
  const supabase = await createClient();

  // 1. Fetch all unpaired transactions that are flagged as transfers
  const { data: unpairedTx, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_transfer', true)
    .is('transfer_pair_id', null)
    .order('date', { ascending: false });

  if (error || !unpairedTx || unpairedTx.length === 0) {
    return;
  }

  // To keep track of paired IDs in this run so we don't double-pair
  const pairedIds = new Set<string>();
  const updates: { id: string; transfer_pair_id: string }[] = [];

  for (let i = 0; i < unpairedTx.length; i++) {
    const txA = unpairedTx[i];
    if (pairedIds.has(txA.id)) continue;

    for (let j = i + 1; j < unpairedTx.length; j++) {
      const txB = unpairedTx[j];
      if (pairedIds.has(txB.id)) continue;

      // 2. High-Confidence Auto-Pair checks
      // - different owned accounts
      if (txA.account_id === txB.account_id) continue;
      
      // - opposite direction
      if (txA.direction === txB.direction) continue;

      // - exact amount match (comparing absolute values)
      if (Math.abs(Number(txA.amount)) !== Math.abs(Number(txB.amount))) continue;

      // - within 0-1 day
      const dateA = parseISO(txA.date);
      const dateB = parseISO(txB.date);
      const daysDiff = Math.abs(differenceInDays(dateA, dateB));

      // - description strongly suggests transfer
      const isHighConfidenceA = txA.confidence === 'high';
      const isHighConfidenceB = txB.confidence === 'high';

      // Rules:
      // High-confidence auto-pair: 0-1 days AND high confidence in description
      const isHighConfidencePair = daysDiff <= 1 && (isHighConfidenceA || isHighConfidenceB);
      
      // Medium-confidence review: up to 2 days. The user explicitly said:
      // "do not automatically pair every +/- 2 day match. false transfer detection is worse than missing some transfers"
      // So we ONLY pair High-confidence. Medium-confidence candidates just remain `is_transfer = true` and `transfer_pair_id = null`.
      
      if (isHighConfidencePair) {
        // We found a match!
        pairedIds.add(txA.id);
        pairedIds.add(txB.id);

        // We can just link them to each other, or generate a shared transfer_pair_id UUID.
        // It's cleaner to generate a common UUID. We'll just use txA's ID as the common pair ID for simplicity, or use Supabase UUID generation.
        // Let's use crypto.randomUUID()
        const pairId = crypto.randomUUID();
        
        updates.push({ id: txA.id, transfer_pair_id: pairId });
        updates.push({ id: txB.id, transfer_pair_id: pairId });
        break; // Stop looking for txA
      }
    }
  }

  // 3. Batch update the paired transactions
  if (updates.length > 0) {
    // Supabase JS doesn't have bulk update by ID easily, so we upsert
    // But upsert needs all required fields. We could do individual updates, or call an RPC.
    // Given low volume per import, individual updates in a Promise.all is fine for now.
    await Promise.all(
      updates.map(u => 
        supabase
          .from('transactions')
          .update({ transfer_pair_id: u.transfer_pair_id })
          .eq('id', u.id)
      )
    );
  }
}
