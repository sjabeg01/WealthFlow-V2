// ============================================================
// Shared TypeScript types for WealthFlow v2
// All domain types live here — import from '@/types' everywhere
// ============================================================

// ------ Auth & User ------

export interface AppUser {
  id: string;
  email: string;
}

// ------ Mode ------

export type AppMode = 'real' | 'demo';

// ------ Accounts ------

export type AccountType = 'checking' | 'savings' | 'credit' | 'investment' | 'other';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  institution: string | null;
  type: AccountType;
  currency: string;
  last4: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

// ------ Categories ------

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  icon: string | null;
  is_system: boolean;
  created_at: string;
}

// ------ Transactions ------

export type TransactionDirection = 'credit' | 'debit';
export type TransactionType = 'income' | 'expense' | 'transfer' | 'investment' | 'refund';
export type TransactionSource = 'import' | 'manual';
export type TransactionConfidence = 'high' | 'medium' | 'low';

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string | null;
  import_batch_id: string | null;
  date: string; // ISO date string YYYY-MM-DD
  description: string;
  merchant: string | null;
  amount: number; // signed: positive = income, negative = expense
  direction: TransactionDirection;
  type: TransactionType;
  category_id: string | null;
  category?: Category; // joined
  is_transfer: boolean;
  is_investment: boolean;
  transfer_pair_id: string | null;
  source: TransactionSource;
  confidence: TransactionConfidence;
  notes: string | null;
  created_at: string;
}

// ------ Import ------

export type ImportFileType = 'csv' | 'xlsx' | 'pdf';
export type ImportBatchStatus = 'preview' | 'committed' | 'rolled_back';

export interface ImportBatch {
  id: string;
  user_id: string;
  account_id: string | null;
  file_name: string;
  file_type: ImportFileType;
  rows_detected: number;
  rows_accepted: number;
  rows_skipped: number;
  duplicates: number;
  transfers: number;
  status: ImportBatchStatus;
  imported_at: string;
}

export type ImportRowStatus = 'accepted' | 'skipped' | 'duplicate';

export interface ImportRow {
  id: string;
  batch_id: string;
  row_index: number;
  raw_data: Record<string, unknown>;
  status: ImportRowStatus;
  skip_reason: string | null;
  created_at: string;
}

// ------ Import Preview (client-side, pre-commit) ------

export interface ParsedRow {
  rowIndex: number;
  date: string | null;
  description: string | null;
  amount: number | null;
  rawData: Record<string, string>;
}

export interface ColumnMapping {
  dateColumn: string | null;
  descriptionColumn: string | null;
  amountColumn: string | null;
  debitColumn: string | null;
  creditColumn: string | null;
  balanceColumn: string | null;
}

export interface ColumnMappingConfidence {
  dateColumn: TransactionConfidence;
  descriptionColumn: TransactionConfidence;
  amountColumn: TransactionConfidence;
}

export interface ImportPreview {
  fileName: string;
  fileType: ImportFileType;
  headers: string[];
  columnMapping: ColumnMapping;
  columnMappingConfidence: ColumnMappingConfidence;
  acceptedRows: ParsedRow[];
  skippedRows: Array<ParsedRow & { reason: string }>;
  duplicateCount: number;
  transferCount: number;
  warnings: string[];
}

// ------ Goals ------

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  monthly_contribution: number | null;
  deadline: string | null;
  notes: string | null;
  created_at: string;
}

// ------ Investments ------

export type AssetType = 'stock' | 'etf' | 'bond' | 'property' | 'cash' | 'other';

export interface Investment {
  id: string;
  user_id: string;
  ticker: string | null;
  name: string;
  units: number | null;
  avg_cost: number | null;
  current_price: number | null;
  asset_type: AssetType;
  notes: string | null;
  created_at: string;
}

// ------ Finance Engine outputs ------

export interface FinanceSummary {
  totalIncome: number;
  totalExpenses: number;
  surplus: number;
  safeToInvest: number;
}

export interface CategoryBreakdown {
  categoryId: string | null;
  categoryName: string;
  color: string | null;
  total: number;
  percentage: number;
  transactionCount: number;
}

export interface MonthlyTrend {
  month: string; // YYYY-MM
  income: number;
  expenses: number;
  surplus: number;
}

export interface MerchantSummary {
  merchant: string;
  total: number;
  transactionCount: number;
}
