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
];

const INVESTMENT_KEYWORDS = [
  'investment',
  'invest',
  'etf',
  'vgs',
  'vas',
  'shares',
  'stocks',
  'fund',
  'portfolio',
  'brokerage',
  'crypto',
  'bitcoin',
];

const REFUND_KEYWORDS = [
  'refund',
  'reimbursement',
  'cashback',
  'cash back',
];

const INCOME_HIGH_KEYWORDS = [
  'salary',
  'wage',
  'wages',
  'payroll',
  'revenue',
  'bonus',
  'commission',
  'dividend',
  'interest',
  'payment received',
  'deposit received',
  'grant',
  'stipend',
  'pension',
  'benefit',
  'allowance',
];

const INCOME_MEDIUM_KEYWORDS = [
  'income',
  'earning',
  'earnings',
  'profit',
  'freelance',
  'invoice',
  'client',
  'deposit',
];

const EXPENSE_HIGH_KEYWORDS = [
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
  'loan',
  'supermarket',
  'petrol',
  'gas',
  'parking',
  'toll',
  'subscription',
  'netflix',
  'spotify',
  'amazon',
];

const EXPENSE_MEDIUM_KEYWORDS = [
  'food',
  'coffee',
  'dining',
  'shopping',
  'clothes',
  'accessories',
  'gym',
  'tax',
  'fee',
  'charge',
  'repair',
  'maintenance',
  'hardware',
  'furniture',
  'equipment',
  'supplies',
  'printing',
  'postage',
  'courier',
  'education',
  'school',
  'tuition',
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

  return {
    final_type: 'needs_review',
    confidence: 'low',
    classification_reason: 'No reliable classification signal found',
  };
}
