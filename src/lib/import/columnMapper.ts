// ============================================================
// Rakam v2 — Column Mapper
// Auto-detects columns for Date, Description, Amount from CSV headers.
// Handles both single-amount columns and split debit/credit columns.
// ============================================================

import type { ColumnMapping, ColumnMappingConfidence } from '@/types';

const DATE_KEYWORDS = ['date', 'transaction date', 'time', 'post date', 'value date'];
const DESC_KEYWORDS = ['description', 'details', 'narrative', 'payee', 'merchant', 'particulars', 'transaction details'];
const AMOUNT_KEYWORDS = ['amount', 'value', 'transaction amount'];
const DEBIT_KEYWORDS = ['debit', 'withdrawal', 'out', 'dr'];
const CREDIT_KEYWORDS = ['credit', 'deposit', 'in', 'cr'];
const BALANCE_KEYWORDS = ['balance', 'running balance'];

export function detectColumns(headers: string[]): {
  mapping: ColumnMapping;
  confidence: ColumnMappingConfidence;
} {
  const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());

  let dateCol: string | null = null;
  let descCol: string | null = null;
  let amountCol: string | null = null;
  let debitCol: string | null = null;
  let creditCol: string | null = null;
  let balanceCol: string | null = null;

  // Confidence trackers
  let dateConf: 'low' | 'medium' | 'high' = 'low';
  let descConf: 'low' | 'medium' | 'high' = 'low';
  let amtConf: 'low' | 'medium' | 'high' = 'low';

  normalizedHeaders.forEach((h, index) => {
    const originalHeader = headers[index];

    // Date
    if (!dateCol && DATE_KEYWORDS.some((k) => h.includes(k))) {
      dateCol = originalHeader;
      dateConf = h === 'date' ? 'high' : 'medium';
    }

    // Description
    if (!descCol && DESC_KEYWORDS.some((k) => h.includes(k))) {
      descCol = originalHeader;
      descConf = h === 'description' || h === 'details' ? 'high' : 'medium';
    }

    // Amount (Single column)
    if (!amountCol && AMOUNT_KEYWORDS.some((k) => h === k || h.includes(k))) {
      amountCol = originalHeader;
      amtConf = h === 'amount' ? 'high' : 'medium';
    }

    // Debit (Split columns)
    if (!amountCol && !debitCol && DEBIT_KEYWORDS.some((k) => h === k || h.includes(k))) {
      debitCol = originalHeader;
    }

    // Credit (Split columns)
    if (!amountCol && !creditCol && CREDIT_KEYWORDS.some((k) => h === k || h.includes(k))) {
      creditCol = originalHeader;
    }

    // Balance
    if (!balanceCol && BALANCE_KEYWORDS.some((k) => h.includes(k))) {
      balanceCol = originalHeader;
    }
  });

  // If we have both debit and credit, amount confidence is based on finding both
  if (!amountCol && debitCol && creditCol) {
    amtConf = 'high';
  } else if (!amountCol && (debitCol || creditCol)) {
    // Found only one half of a split amount system
    amtConf = 'low';
  }

  return {
    mapping: {
      dateColumn: dateCol,
      descriptionColumn: descCol,
      amountColumn: amountCol,
      debitColumn: debitCol,
      creditColumn: creditCol,
      balanceColumn: balanceCol,
    },
    confidence: {
      dateColumn: dateCol ? dateConf : 'low',
      descriptionColumn: descCol ? descConf : 'low',
      amountColumn: (amountCol || (debitCol && creditCol)) ? amtConf : 'low',
    },
  };
}
