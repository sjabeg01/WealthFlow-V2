// ============================================================
// WealthFlow V2 — Universal CSV Normalizer Utility
// ============================================================

import type { ClassificationContext } from './classificationTypes';
import { cleanMerchant } from '../normalization';

const NOTES_MAPPING: Record<string, 'income' | 'expense' | 'transfer' | null> = {
  'regular monthly salary': 'income',
  'monthly rent payment': 'expense',
  'recurring household bill': 'expense',
  'variable household spending': 'expense',
  'investment contribution': 'expense',
  'refund or reversal': 'income',
  'refund / reversal': 'income',
  'internal transfer': 'transfer',
  'incoming transfer': 'transfer',
  'multi-account transfer': 'transfer',
  'investment transfer': 'transfer',
  'ambiguous transfer': 'transfer',
  'ambiguous debit': 'expense',
  'ambiguous credit': 'income',
  'could be salary, repayment, or cash top-up': null,
  'quarterly / seasonal transaction': null,
};

/**
 * Validates a date checking year, month, and month capacity.
 */
function isValidDate(year: number, month: number, day: number): boolean {
  if (year < 1000 || year > 3000) return false;
  if (month < 1 || month > 12) return false;
  const maxDays = new Date(year, month, 0).getDate();
  return day >= 1 && day <= maxDays;
}

/**
 * Formats a valid date back into ISO YYYY-MM-DD.
 */
function formatIso(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Robust date parser implementing the exact fallback priority:
 * 1. D/M/YYYY
 * 2. DD/MM/YYYY
 * 3. YYYY-MM-DD
 * 4. DD-MM-YYYY
 * 5. MM/DD/YYYY
 * 6. YYYY/MM/DD
 * 7. D-M-YYYY
 */
export function parsePriorityDate(rawDateStr: string): { parsedDate: string | null; needsReview: boolean } {
  let str = String(rawDateStr).trim();
  
  // Strip time part if present
  const timeIndex = str.search(/[\sT]/);
  if (timeIndex !== -1) {
    str = str.substring(0, timeIndex);
  }
  str = str.trim();

  // Try slash-separated formats with 4-digit years at the end (D/M/YYYY, DD/MM/YYYY, MM/DD/YYYY)
  const slashMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const p1 = parseInt(slashMatch[1], 10);
    const p2 = parseInt(slashMatch[2], 10);
    const y = parseInt(slashMatch[3], 10);

    // 1 & 2. Try Day/Month/Year first
    if (isValidDate(y, p2, p1)) {
      return { parsedDate: formatIso(y, p2, p1), needsReview: false };
    }
    // 5. Try Month/Day/Year next
    if (isValidDate(y, p1, p2)) {
      return { parsedDate: formatIso(y, p1, p2), needsReview: false };
    }
  }

  // 3. YYYY-MM-DD (also accepts YYYY-M-D)
  const hyphenYmdMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (hyphenYmdMatch) {
    const y = parseInt(hyphenYmdMatch[1], 10);
    const m = parseInt(hyphenYmdMatch[2], 10);
    const d = parseInt(hyphenYmdMatch[3], 10);
    if (isValidDate(y, m, d)) {
      return { parsedDate: formatIso(y, m, d), needsReview: false };
    }
  }

  // 4 & 7. DD-MM-YYYY / D-M-YYYY
  const hyphenDmyMatch = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (hyphenDmyMatch) {
    const d = parseInt(hyphenDmyMatch[1], 10);
    const m = parseInt(hyphenDmyMatch[2], 10);
    const y = parseInt(hyphenDmyMatch[3], 10);
    if (isValidDate(y, m, d)) {
      return { parsedDate: formatIso(y, m, d), needsReview: false };
    }
  }

  // 6. YYYY/MM/DD
  const slashYmdMatch = str.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (slashYmdMatch) {
    const y = parseInt(slashYmdMatch[1], 10);
    const m = parseInt(slashYmdMatch[2], 10);
    const d = parseInt(slashYmdMatch[3], 10);
    if (isValidDate(y, m, d)) {
      return { parsedDate: formatIso(y, m, d), needsReview: false };
    }
  }

  // Return raw string and mark as needs review if not parseable
  return { parsedDate: rawDateStr, needsReview: true };
}

/**
 * Standardize amount field value.
 */
function parseCleanAmount(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  const str = String(val)
    .replace(/['",$\s£€₹]|^NPR\s*|^Rs\.?\s*/gi, '')
    .trim();
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

/**
 * Universal CSV Row Normalizer. Standardizes all fields, detects direction,
 * and parses dates in a guaranteed structured flow.
 */
export function normalizeRawRow(rawRow: any, mapping?: any): ClassificationContext {
  const data = rawRow?.rawData || rawRow || {};

  // 1. Amount & Direction Normalization
  let debitAmount: number | null = null;
  let creditAmount: number | null = null;
  let direction: 'expense' | 'income' | 'transfer' = 'expense';

  // Exact block requested by user:
  let rawAmountStr = String(rawRow[mapping?.amount || 'Amount'] || '');
  const cleanAmountStr = rawAmountStr.replace(/[^\d.-]/g, '');
  let amount = 0;
  let direction_source: 'explicit_column' | 'notes_hint' | 'amount_sign' | 'unknown' = 'unknown';

  if (cleanAmountStr && cleanAmountStr !== '-' && cleanAmountStr !== '.') {
    const parsedAmount = parseFloat(cleanAmountStr);
    if (!isNaN(parsedAmount)) {
      amount = Math.abs(parsedAmount);
      direction = parsedAmount < 0 ? 'expense' : 'income';
      direction_source = 'amount_sign';
    }
  } else {
    amount = 0;
    direction_source = 'unknown';
  }

  // Fallback to explicit column mapping for amount if rawAmountStr is empty
  if (!rawAmountStr && mapping?.amountColumn) {
    const rawAmount = data[mapping.amountColumn];
    const parsed = parseCleanAmount(rawAmount);
    if (parsed !== null) {
      amount = Math.abs(parsed);
      direction = parsed < 0 ? 'expense' : 'income';
      direction_source = 'amount_sign';
    } else {
      amount = 0;
      direction = 'expense';
      direction_source = 'unknown';
    }
  }

  if (mapping?.debitColumn || mapping?.creditColumn) {
    const rawDebit = mapping.debitColumn ? data[mapping.debitColumn] : null;
    const rawCredit = mapping.creditColumn ? data[mapping.creditColumn] : null;

    const parsedDebit = parseCleanAmount(rawDebit);
    const parsedCredit = parseCleanAmount(rawCredit);

    debitAmount = parsedDebit !== null ? Math.abs(parsedDebit) : null;
    creditAmount = parsedCredit !== null ? Math.abs(parsedCredit) : null;

    if (debitAmount !== null && debitAmount > 0) {
      amount = debitAmount;
      direction = 'expense';
      direction_source = 'amount_sign';
    } else if (creditAmount !== null && creditAmount > 0) {
      amount = creditAmount;
      direction = 'income';
      direction_source = 'amount_sign';
    } else {
      amount = 0;
      direction = 'expense';
      direction_source = 'unknown';
    }
  } else if (!rawAmountStr && !mapping?.amountColumn) {
    // Robust fallback case-insensitive lookup
    let found = false;
    const keys = Object.keys(data);
    const debitKey = keys.find(k => k.toLowerCase() === 'debit');
    const creditKey = keys.find(k => k.toLowerCase() === 'credit');
    const amountKey = keys.find(k => k.toLowerCase() === 'amount');

    if (debitKey || creditKey) {
      const rawDebit = debitKey ? data[debitKey] : null;
      const rawCredit = creditKey ? data[creditKey] : null;
      const parsedDebit = parseCleanAmount(rawDebit);
      const parsedCredit = parseCleanAmount(rawCredit);
      debitAmount = parsedDebit !== null ? Math.abs(parsedDebit) : null;
      creditAmount = parsedCredit !== null ? Math.abs(parsedCredit) : null;

      if (debitAmount !== null && debitAmount > 0) {
        amount = debitAmount;
        direction = 'expense';
        direction_source = 'amount_sign';
        found = true;
      } else if (creditAmount !== null && creditAmount > 0) {
        amount = creditAmount;
        direction = 'income';
        direction_source = 'amount_sign';
        found = true;
      }
    }

    if (!found && amountKey) {
      const parsed = parseCleanAmount(data[amountKey]);
      if (parsed !== null) {
        amount = Math.abs(parsed);
        direction = parsed < 0 ? 'expense' : 'income';
        direction_source = 'amount_sign';
        found = true;
      }
    }

    if (!found) {
      amount = 0;
      direction = 'expense';
      direction_source = 'unknown';
    }
  }

  // 2. Text fields and notes mapping
  const getCategoryHintValue = (): string | null => {
    if (mapping?.categoryHintColumn && data[mapping.categoryHintColumn]) {
      return String(data[mapping.categoryHintColumn]).trim();
    }
    const keys = Object.keys(data);
    const notesKey = keys.find(k => ['notes', 'note', 'category_hint', 'category hint'].includes(k.toLowerCase()));
    if (notesKey && data[notesKey]) {
      return String(data[notesKey]).trim();
    }
    return null;
  };

  const rawCategoryHint = getCategoryHintValue();
  const categoryHint = rawCategoryHint ? rawCategoryHint.trim().toLowerCase() : null;

  if (categoryHint && categoryHint in NOTES_MAPPING) {
    const mappedDir = NOTES_MAPPING[categoryHint];
    if (mappedDir !== null) {
      direction = mappedDir;
      direction_source = 'notes_hint';
    } else {
      direction_source = 'amount_sign';
    }
  } else {
    // Try explicit direction column if notes did not match
    if (mapping?.transactionDirectionColumn && data[mapping.transactionDirectionColumn]) {
      const rawDirStr = String(data[mapping.transactionDirectionColumn]).toLowerCase().trim();
      if (['debit', 'dr', 'withdrawal', 'expense'].some(kw => rawDirStr.includes(kw))) {
        direction = 'expense';
        direction_source = 'explicit_column';
      } else if (['credit', 'cr', 'deposit', 'income'].some(kw => rawDirStr.includes(kw))) {
        direction = 'income';
        direction_source = 'explicit_column';
      } else if (['transfer', 'internal', 'xfer'].some(kw => rawDirStr.includes(kw))) {
        direction = 'transfer';
        direction_source = 'explicit_column';
      }
    }
  }

  // 3. Trim and lowercase remaining text fields
  const getDescriptionVal = (): string | null => {
    if (mapping?.descriptionColumn && data[mapping.descriptionColumn]) {
      return String(data[mapping.descriptionColumn]).trim();
    }
    const keys = Object.keys(data);
    const descKey = keys.find(k => ['description', 'details', 'payee', 'merchant'].includes(k.toLowerCase()));
    if (descKey && data[descKey]) {
      return String(data[descKey]).trim();
    }
    return null;
  };
  const rawDescription = getDescriptionVal();
  const description = rawDescription ? rawDescription.trim().toLowerCase() : null;

  const merchantRaw = cleanMerchant(rawDescription || '');
  const merchant_name = merchantRaw ? merchantRaw.trim().toLowerCase() : null;

  const getReferenceVal = (): string | null => {
    const keys = Object.keys(data);
    const refKey = keys.find(k => k.toLowerCase() === 'reference');
    if (refKey && data[refKey]) return String(data[refKey]).trim();
    return null;
  };
  const rawReference = getReferenceVal();
  const reference = rawReference ? rawReference.trim().toLowerCase() : null;

  const getChannelVal = (): string | null => {
    const keys = Object.keys(data);
    const chanKey = keys.find(k => ['channel', 'payment_channel', 'payment channel'].includes(k.toLowerCase()));
    if (chanKey && data[chanKey]) return String(data[chanKey]).trim();
    return null;
  };
  const rawChannel = getChannelVal();
  const payment_channel = rawChannel ? rawChannel.trim().toLowerCase() : null;

  const getCurrencyVal = (): string | null => {
    const keys = Object.keys(data);
    const curKey = keys.find(k => k.toLowerCase() === 'currency');
    if (curKey && data[curKey]) return String(data[curKey]).trim();
    return null;
  };
  const rawCurrency = getCurrencyVal();
  const currency = rawCurrency ? rawCurrency.trim().toLowerCase() : null;

  const getBalanceVal = (): number | null => {
    if (mapping?.balanceColumn && data[mapping.balanceColumn]) {
      const parsed = parseCleanAmount(data[mapping.balanceColumn]);
      return parsed;
    }
    const keys = Object.keys(data);
    const balKey = keys.find(k => ['balance', 'running_balance', 'running balance'].includes(k.toLowerCase()));
    if (balKey && data[balKey]) {
      const parsed = parseCleanAmount(data[balKey]);
      return parsed;
    }
    return null;
  };
  const running_balance = getBalanceVal();

  // 4. Date Parsing and Validation
  const getDateVal = (): string | null => {
    if (mapping?.dateColumn && data[mapping.dateColumn]) {
      return String(data[mapping.dateColumn]).trim();
    }
    const keys = Object.keys(data);
    const dateKey = keys.find(k => k.toLowerCase() === 'date');
    if (dateKey && data[dateKey]) {
      return String(data[dateKey]).trim();
    }
    return null;
  };
  const rawDateStr = getDateVal();
  let date: string | null = null;
  let date_needs_review = false;

  if (rawDateStr) {
    const parsed = parsePriorityDate(rawDateStr);
    date = parsed.parsedDate;
    date_needs_review = parsed.needsReview;
  } else {
    date_needs_review = true;
  }

  return {
    amount,
    debit_amount: debitAmount,
    credit_amount: creditAmount,
    transaction_direction: direction,
    description,
    merchant_name,
    category_hint: categoryHint,
    reference,
    payment_channel,
    running_balance,
    direction_source,
    date,
    date_needs_review,
    currency,
  };
}
