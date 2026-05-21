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
  confidence_score: number;
  score_breakdown: string[];
  merchant_clean_name: string | null;
}
