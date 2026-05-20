export type FinalType =
  | 'expense'
  | 'income'
  | 'refund'
  | 'transfer'
  | 'investment'
  | 'needs_review';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export interface ClassificationContext {
  amount?: number | string | null;
  debit_amount?: number | string | null;
  credit_amount?: number | string | null;
  transaction_direction?: string | null;
  description?: string | null;
  merchant_name?: string | null;
  category_hint?: string | null;
  user_category_type?: 'expense_only' | 'income_only' | 'mixed' | null;
}
export interface ClassificationResult {
  final_type: FinalType;
  confidence: ConfidenceLevel;
  classification_reason: string;
}
function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed =
    typeof value === 'number'
      ? value
      : Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : null;
}
// Current normalization supports English and transliterated Nepali keywords.
// Current normalization does NOT preserve Nepali Unicode script.
// Nepali script support would require a later dedicated enhancement.
function normalizeText(parts: Array<string | null | undefined>): string {
  return ` ${parts
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()} `;
}
function hasAny(text: string, phrases: string[]): string | null {
  for (const phrase of phrases) {
    const normalized = ` ${phrase.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `;
    if (text.includes(normalized)) return phrase;
  }
  return null;
}
const TRANSFER_KEYWORDS = [
  'transfer',
  'savings transfer',
  'monthly savings',
  'internal transfer',
  'account transfer',
  'between accounts',
  'tfr',
  'transfer to',
  'transfer from',
  'own account',
  'fund transfer',
  'bank transfer',
  'wire transfer',
  'wallet load',
  'topup',
  'top-up',
  'connectips',
  'swift transfer',
  'neft',
  'rtgs',
  'esewa topup',
  'esewa load',
  'khalti load',
  'ime pay load',
  'fonepay transfer',
  'connectips debit',
  'mobile banking transfer',
  'bachat transfer',
  'chalti to bachat',
  'fd transfer',
  'prabhu transfer',
  'nabil transfer',
  'nic asia transfer',
];
const INVESTMENT_KEYWORDS = [
  // Removed "fund", "shares", "portfolio" to avoid false positives
  'investment',
  'invest',
  'etf',
  'vgs',
  'vas',
  'stocks',
  'brokerage',
  'crypto',
  'bitcoin',
  'stock purchase',
  'equity',
  'vanguard',
  'fidelity',
  'blackrock',
  'index fund',
  'mutual fund',
  'etf fund',
  'stock shares',
  'share purchase',
  'btc',
  'ethereum',
  'eth',
  'binance',
  'coinbase',
  'gold purchase',
  'silver',
  'commodity',
  'ipo',
  'rights share',
  'fd',
  'fixed deposit',
  'nepse',
  'tms',
  'demat',
  'ipo application',
  'merolagani',
  'sharesansar',
  'cdsc',
  'meroshare',
  'mutual fund nepal',
  'nabil invest',
  'nlic',
  'lagani',
  'sip',
  'systematic investment',
  'laxmi sunrise',
];
const REFUND_KEYWORDS = [
  // Contains refund and cashback words strictly for refund scenarios
  'refund',
  'reimbursement',
  'cashback',
  'cash back',
  'reversal',
  'chargeback',
  'return credit',
  'money back',
  'adjustment credit',
  'credit note',
  'firta',
  'wapas',
  'return payment',
  'esewa refund',
  'khalti refund',
  'daraz refund',
  'refund credit',
  'reward',
];
const INCOME_HIGH_KEYWORDS = [
  // Removed refund overlaps ("refund credit", "cashback", "reward")
  // Removed broad overlaps ("deposit", "payment received")
  'salary',
  'wage',
  'wages',
  'payroll',
  'revenue',
  'bonus',
  'commission',
  'dividend',
  'grant',
  'stipend',
  'pension',
  'benefit',
  'allowance',
  'direct deposit',
  'employment income',
  'freelance',
  'consulting fee',
  'contract payment',
  'invoice payment',
  'incentive',
  'performance pay',
  'interest credit',
  'byaj',
  'interest earned',
  'byaj credit',
  'bachat byaj',
  'rental income',
  'tenant payment',
  'lease income',
  'cashback bonus',
  'loyalty reward earned',
  'salary deposit',
  'bank deposit received',
  'freelance payment received',
  'client payment received',
  'interest income',
  'scholarship',
  'annuity',
  'retirement income',
  'remittance',
  'foreign remittance',
  'international transfer received',
  'esewa received',
  'khalti received',
  'ime pay received',
  'connectips credit',
  'labh',
  'munafa',
  'talab',
  'tirtha',
];
const INCOME_MEDIUM_KEYWORDS = [
  // Removed "client", "deposit", "earning"
  'income',
  'earnings',
  'profit',
  'invoice',
  'freelance income',
  'client income',
  'income earned',
];
const EXPENSE_HIGH_KEYWORDS = [
  // Removed broad keywords like "loan", "interest", "deposit" (if any existed)
  'rent',
  'groceries',
  'grocery',
  'electricity',
  'internet',
  'fuel',
  'transport',
  'restaurant',
  'takeaway',
  'insurance',
  'health insurance',
  'medical',
  'doctor',
  'dentist',
  'hospital',
  'pharmacy',
  'utility',
  'utilities',
  'bill',
  'mortgage',
  'loan repayment',
  'loan emi',
  'home loan emi',
  'interest charge',
  'account interest charge',
  'security deposit',
  'security deposit held',
  'supermarket',
  'petrol',
  'gas',
  'parking',
  'toll',
  'subscription',
  'netflix',
  'spotify',
  'amazon',
  'lease payment',
  'foodmart',
  'bhatbhateni',
  'bigmart',
  'nea',
  'nea bill',
  'water bill',
  'internet bill',
  'wifi',
  'broadband',
  'worldlink',
  'subisu',
  'vianet',
  'cg telecom',
  'diesel',
  'gas station',
  'cafe',
  'dining',
  'food delivery',
  'foodmandu',
  'clinic',
  'medicine',
  'health',
  'school fee',
  'tuition',
  'college fee',
  'university fee',
  'insurance premium',
  'beema',
  'life insurance',
  'taxi',
  'uber',
  'pathao',
  'bus fare',
  'youtube premium',
  'mobile recharge',
  'sim recharge',
  'ncell',
  'ntc',
  'namaste',
  'shopping',
  'daraz',
  'clothing',
  'maintenance',
  'repair',
  'service charge',
  'parking fee',
  'khalti payment',
  'esewa payment',
  'fonepay debit',
  'daraz payment',
  'kharcha',
  'bhuktani',
];
const EXPENSE_MEDIUM_KEYWORDS = [
  'food',
  'coffee',
  'clothes',
  'accessories',
  'gym',
  'tax',
  'fee',
  'charge',
  'hardware',
  'furniture',
  'equipment',
  'supplies',
  'printing',
  'postage',
  'courier',
  'education',
  'school',
  'childcare',
  'pet',
  'vet',
  'cleaning',
  'laundry',
  'haircut',
  'beauty',
  'travel',
  'hotel',
  'accommodation',
  'airfare',
  'flight',
  'ticket',
  'entertainment',
  'cinema',
  'dinner',
  'trip',
];
export function deriveFinalType(
  context: ClassificationContext
): ClassificationResult {
  if (context.user_category_type === 'expense_only') {
    return {
      final_type: 'expense',
      confidence: 'high',
      classification_reason: 'Category type override: expense_only',
    };
  }
  if (context.user_category_type === 'income_only') {
    return {
      final_type: 'income',
      confidence: 'high',
      classification_reason: 'Category type override: income_only',
    };
  }
  if (context.transaction_direction) {
    const dir = String(context.transaction_direction).toLowerCase().trim();
    if (
      ['transfer', 'internal', 'xfer', 'inter account'].some(v =>
        dir.includes(v)
      )
    ) {
      return {
        final_type: 'transfer',
        confidence: 'high',
        classification_reason: `Direction classified as transfer: ${context.transaction_direction}`,
      };
    }
    if (
      ['debit', 'dr', 'withdrawal', 'withdraw', 'expense', 'out', 'purchase'].some(v =>
        dir.includes(v)
      )
    ) {
      return {
        final_type: 'expense',
        confidence: 'high',
        classification_reason: `Direction classified as expense: ${context.transaction_direction}`,
      };
    }
    if (
      ['credit', 'cr', 'deposit', 'income', 'received'].some(v =>
        dir.includes(v)
      )
    ) {
      return {
        final_type: 'income',
        confidence: 'high',
        classification_reason: `Direction classified as income: ${context.transaction_direction}`,
      };
    }
  }

  // Negative amount check executes immediately after direction checks, before keyword matching
  const amount = toNumber(context.amount);
  if (amount !== null && amount < 0) {
    return {
      final_type: 'expense',
      confidence: 'high',
      classification_reason: 'Negative amount signal',
    };
  }

  const text = normalizeText([
    context.description,
    context.merchant_name,
    context.category_hint,
  ]);
  const transferMatch = hasAny(text, TRANSFER_KEYWORDS);
  if (transferMatch) {
    return {
      final_type: 'transfer',
      confidence: 'high',
      classification_reason: `Transfer keyword match: ${transferMatch}`,
    };
  }
  const investmentMatch = hasAny(text, INVESTMENT_KEYWORDS);
  if (investmentMatch) {
    return {
      final_type: 'investment',
      confidence: 'high',
      classification_reason: `Investment keyword match: ${investmentMatch}`,
    };
  }
  const refundMatch = hasAny(text, REFUND_KEYWORDS);
  if (refundMatch) {
    return {
      final_type: 'refund',
      confidence: 'high',
      classification_reason: `Refund keyword match: ${refundMatch}`,
    };
  }
  const incomeHighMatch = hasAny(text, INCOME_HIGH_KEYWORDS);
  if (incomeHighMatch) {
    return {
      final_type: 'income',
      confidence: 'high',
      classification_reason: `Income keyword match: ${incomeHighMatch}`,
    };
  }
  const expenseHighMatch = hasAny(text, EXPENSE_HIGH_KEYWORDS);
  if (expenseHighMatch) {
    return {
      final_type: 'expense',
      confidence: 'high',
      classification_reason: `Expense keyword match: ${expenseHighMatch}`,
    };
  }
  const incomeMediumMatch = hasAny(text, INCOME_MEDIUM_KEYWORDS);
  if (incomeMediumMatch) {
    return {
      final_type: 'income',
      confidence: 'medium',
      classification_reason: `Income keyword match: ${incomeMediumMatch}`,
    };
  }
  const expenseMediumMatch = hasAny(text, EXPENSE_MEDIUM_KEYWORDS);
  if (expenseMediumMatch) {
    return {
      final_type: 'expense',
      confidence: 'medium',
      classification_reason: `Expense keyword match: ${expenseMediumMatch}`,
    };
  }
  const debitAmount = toNumber(context.debit_amount);
  if (debitAmount !== null && debitAmount > 0) {
    return {
      final_type: 'expense',
      confidence: 'high',
      classification_reason: 'Positive debit_amount signal',
    };
  }
  const creditAmount = toNumber(context.credit_amount);
  if (creditAmount !== null && creditAmount > 0) {
    return {
      final_type: 'income',
      confidence: 'high',
      classification_reason: 'Positive credit_amount signal',
    };
  }
  return {
    final_type: 'needs_review',
    confidence: 'low',
    classification_reason: 'No reliable classification signal found',
  };
}
