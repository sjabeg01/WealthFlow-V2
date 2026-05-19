// src/lib/importPipeline/normalizeAmount.ts

import type { FinalType } from './deriveFinalType';

/**
 * Normalizes a raw amount string or number into a signed float.
 *
 * GOLDEN RULE (permanent, immutable):
 * - Expenses     → stored as NEGATIVE  (e.g., -145.00)
 * - Income       → stored as POSITIVE  (e.g., +3600.00)
 * - Refunds      → stored as POSITIVE  (e.g., +50.00)
 * - Transfers    → preserves original sign (can be inflow positive or outflow negative)
 * - Investments  → preserves original sign (can be buy negative or sell positive)
 * - needs_review → stored as 0 (quarantined until user reviews)
 */
export function normalizeAmount(
  rawAmount: string | number,
  finalType: FinalType
): number {
  const cleaned =
    typeof rawAmount === 'string'
      ? rawAmount.replace(/[,$\s]/g, '')
      : String(rawAmount);

  const parsed = parseFloat(cleaned);

  if (isNaN(parsed) || parsed === 0) return 0;

  switch (finalType) {
    case 'expense':
      return -Math.abs(parsed);

    case 'income':
    case 'refund':
      return Math.abs(parsed);

    case 'transfer':
      return Math.abs(parsed);
      
    case 'investment':
      return parsed;

    case 'needs_review':
    default:
      return 0;
  }
}
