import { ClassificationContext } from './classificationTypes';
import { checkMerchantDatabase } from './merchantDatabase';
import { toNumber } from './utils';
import { normalizeText, hasAny } from './keywordUtils';
import { TRANSFER_KEYWORDS, INVESTMENT_KEYWORDS, REFUND_KEYWORDS, INCOME_HIGH_KEYWORDS, EXPENSE_HIGH_KEYWORDS, INCOME_MEDIUM_KEYWORDS, EXPENSE_MEDIUM_KEYWORDS } from './keywords';

export interface ScoringResult {
  score: number;
  confidence: 'high' | 'medium' | 'low';
  breakdown: string[];
  suggestedType: string | null;
  merchantMatch: string | null;
}

export function runScoringEngine(context: ClassificationContext): ScoringResult {
  const breakdown: string[] = [];
  const scores = { expense: 0, income: 0, transfer: 0, investment: 0, refund: 0 };
  let merchantMatchName: string | null = null;

  const combinedText = [context.description, context.merchant_name, context.category_hint].filter(Boolean).join(' ');
  const merchantEntry = checkMerchantDatabase(combinedText);
  
  if (merchantEntry) {
    scores[merchantEntry.defaultType] += merchantEntry.scoreBonus;
    merchantMatchName = merchantEntry.cleanName;
    breakdown.push(`Merchant DB match (+${merchantEntry.scoreBonus}): ${merchantEntry.cleanName}`);
  }

  if (context.transaction_direction) {
    const dir = String(context.transaction_direction).toLowerCase();
    if (['transfer', 'internal', 'xfer'].some(v => dir.includes(v))) { scores.transfer += 40; breakdown.push('Direction (+40): transfer'); }
    else if (['debit', 'dr', 'withdrawal', 'expense'].some(v => dir.includes(v))) { scores.expense += 40; breakdown.push('Direction (+40): expense'); }
    else if (['credit', 'cr', 'deposit', 'income'].some(v => dir.includes(v))) { scores.income += 40; breakdown.push('Direction (+40): income'); }
  }

  const amt = toNumber(context.amount);
  if (amt !== null && amt < 0) { scores.expense += 20; breakdown.push('Negative amount (+20): expense'); }

  if (toNumber(context.debit_amount) > 0) { scores.expense += 15; breakdown.push('Debit amount present (+15)'); }
  if (toNumber(context.credit_amount) > 0) { scores.income += 15; breakdown.push('Credit amount present (+15)'); }

  const text = normalizeText([context.description, context.merchant_name, context.category_hint]);
  if (hasAny(text, TRANSFER_KEYWORDS)) { scores.transfer += 30; breakdown.push('High Keyword (+30): transfer'); }
  if (hasAny(text, INVESTMENT_KEYWORDS)) { scores.investment += 30; breakdown.push('High Keyword (+30): investment'); }
  if (hasAny(text, REFUND_KEYWORDS)) { scores.refund += 30; breakdown.push('High Keyword (+30): refund'); }
  if (hasAny(text, INCOME_HIGH_KEYWORDS)) { scores.income += 30; breakdown.push('High Keyword (+30): income'); }
  if (hasAny(text, EXPENSE_HIGH_KEYWORDS)) { scores.expense += 30; breakdown.push('High Keyword (+30): expense'); }
  
  if (hasAny(text, INCOME_MEDIUM_KEYWORDS) && !hasAny(text, INCOME_HIGH_KEYWORDS)) { scores.income += 15; breakdown.push('Med Keyword (+15): income'); }
  if (hasAny(text, EXPENSE_MEDIUM_KEYWORDS) && !hasAny(text, EXPENSE_HIGH_KEYWORDS)) { scores.expense += 15; breakdown.push('Med Keyword (+15): expense'); }

  const winner = (Object.keys(scores) as Array<keyof typeof scores>).reduce((a, b) => scores[a] >= scores[b] ? a : b);
  const winningScore = scores[winner];
  
  const confidence = winningScore >= 85 ? 'high' : winningScore >= 50 ? 'medium' : 'low';

  return { score: winningScore, confidence, breakdown, suggestedType: winningScore >= 50 ? winner : null, merchantMatch: merchantMatchName };
}
