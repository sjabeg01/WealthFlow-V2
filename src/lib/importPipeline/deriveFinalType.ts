import {
  type FinalType,
  type ConfidenceLevel,
  type ClassificationContext,
  type ClassificationResult,
} from './classificationTypes';
import { toNumber } from './utils';
import { normalizeText, hasAny } from './keywordUtils';
import {
  TRANSFER_KEYWORDS,
  INVESTMENT_KEYWORDS,
  REFUND_KEYWORDS,
  INCOME_HIGH_KEYWORDS,
  EXPENSE_HIGH_KEYWORDS,
  INCOME_MEDIUM_KEYWORDS,
  EXPENSE_MEDIUM_KEYWORDS,
} from './keywords';

export {
  type FinalType,
  type ConfidenceLevel,
  type ClassificationContext,
  type ClassificationResult,
};

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
