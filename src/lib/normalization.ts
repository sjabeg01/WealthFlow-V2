// ============================================================
// Rakam v2 — Transaction Normalization Utilities
// Used by the import pipeline to clean and classify raw data.
// ============================================================

import type {
  FinalType,
  TransactionConfidence,
} from '@/types';

// -----------------------------------------------
// Merchant name cleaning
// -----------------------------------------------

/** Strip payment noise from raw description to extract a clean merchant name */
export function cleanMerchant(rawDescription: string): string {
  if (!rawDescription) return '';

  let cleaned = rawDescription.trim();

  // Remove common bank noise patterns
  const noisePatterns = [
    /\bVISA\s+PURCHASE\b/gi,
    /\bEFTPOS\b/gi,
    /\bDEBIT\s+CARD\b/gi,
    /\bCARD\s+PURCHASE\b/gi,
    /\bDIRECT\s+DEBIT\b/gi,
    /\bINTERNET\s+TRANSFER\b/gi,
    /\bONLINE\s+TRANSFER\b/gi,
    /\bBANK\s+TRANSFER\b/gi,
    /\bTRANSFER\s+FROM\b/gi,
    /\bTRANSFER\s+TO\b/gi,
    /\bRECURRING\s+PAYMENT\b/gi,
    /\bPAYMENT\s+THANK\s+YOU\b/gi,
    /\bAUSTRALIA\b/gi,
    /\bAUS\b/gi,
    /\s{2,}/g,    // Multiple spaces → single space
  ];

  for (const pattern of noisePatterns) {
    cleaned = cleaned.replace(pattern, ' ');
  }

  // Remove trailing numbers (e.g. reference IDs, dates in description)
  cleaned = cleaned.replace(/\s+\d{4,}\s*$/g, '');

  // Remove special chars except &, -, '
  cleaned = cleaned.replace(/[^a-zA-Z0-9\s&'-]/g, '');

  // Title case
  cleaned = cleaned
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return cleaned || rawDescription.trim();
}

// -----------------------------------------------
// Category detection (rule-based, supplementary only)
// Users always review and can override.
// -----------------------------------------------

export interface CategoryRule {
  id?: string;
  match_type: 'exact' | 'keyword';
  pattern: string;
  category_id: string; // The UUID of the category
  priority: number;
}

// Built-in static fallback rules for keyword matching. 
// These map to Category names, which the caller will need to resolve to IDs if needed.
interface StaticRule {
  pattern: RegExp;
  categoryName: string;
}

const STATIC_CATEGORY_RULES: StaticRule[] = [
  { pattern: /\b(coles|woolworths|aldi|iga|harris farm|costco|supermarket|grocery|groceries|food)\b/i, categoryName: 'Groceries' },
  { pattern: /\b(mcdonald|kfc|subway|domino|pizza|burger|grill|bistro|cafe|coffee|restaurant|sushi|thai|chinese|indian)\b/i, categoryName: 'Dining Out' },
  { pattern: /\b(uber|lyft|taxi|cab|ola|didi|bus|train|ferry|opal|myki|go card|translink)\b/i, categoryName: 'Transport' },
  { pattern: /\b(bp|shell|caltex|ampol|7-eleven|petrol|fuel|service station)\b/i, categoryName: 'Fuel' },
  { pattern: /\b(rent|mortgage|strata|realestate|real estate|ray white|harcourt|housing)\b/i, categoryName: 'Rent / Mortgage' },
  { pattern: /\b(electricity|gas|water|internet|broadband|optus|telstra|vodafone|tpg|aussie broadband|bill|utility)\b/i, categoryName: 'Utilities' },
  { pattern: /\b(doctor|gp|pharmacy|chemist|hospital|dental|physiotherapy|health)\b/i, categoryName: 'Health' },
  { pattern: /\b(insurance|nrma|racq|rac|budget direct|allianz|medibank|bupa)\b/i, categoryName: 'Insurance' },
  { pattern: /\b(netflix|spotify|apple|google|amazon prime|disney|stan|binge|subscription|membership)\b/i, categoryName: 'Subscriptions' },
  { pattern: /\b(cinema|movies|event|concert|ticketek|ticketmaster|steam|playstation|xbox)\b/i, categoryName: 'Entertainment' },
  { pattern: /\b(amazon|ebay|asos|zara|h&m|cotton on|uniqlo|target|kmart|big w|david jones|myer)\b/i, categoryName: 'Shopping' },
  { pattern: /\b(salary|payroll|pay|wages|income|dividend|interest earned|bonus)\b/i, categoryName: 'Salary / Income' },
  { pattern: /\b(transfer|bpay|pay anyone|send money|payment to|payment from)\b/i, categoryName: 'Transfers' },
  { pattern: /\b(atm fee|monthly fee|account fee|overdraft|dishonour|bank charge)\b/i, categoryName: 'Fees & Charges' },
  { pattern: /\b(commsec|selfwealth|stake|pearler|vanguard|blackrock|etf|asx|shares)\b/i, categoryName: 'Investments' },
  { pattern: /\b(flight|qantas|jetstar|virgin|airbnb|hotel|booking|expedia)\b/i, categoryName: 'Travel' },
];

/** 
 * Suggest a category based on description/merchant and user rules.
 * Returns either a Category UUID (if matched by user rule) or a Category Name (if matched by static fallback), or null.
 */
export function detectCategory(
  description: string,
  merchant: string | null = null,
  userRules: CategoryRule[] = []
): { categoryId: string | null; categoryName: string | null } {
  const text = `${description} ${merchant ?? ''}`.toLowerCase();
  const cleanMerchLower = merchant?.toLowerCase() || '';

  // Sort rules by priority (highest first)
  const sortedRules = [...userRules].sort((a, b) => b.priority - a.priority);

  // 1. User Rules (Exact first, then Keyword)
  for (const rule of sortedRules) {
    if (rule.match_type === 'exact') {
      if (cleanMerchLower === rule.pattern.toLowerCase()) {
        return { categoryId: rule.category_id, categoryName: null };
      }
    } else if (rule.match_type === 'keyword') {
      if (text.includes(rule.pattern.toLowerCase())) {
        return { categoryId: rule.category_id, categoryName: null };
      }
    }
  }

  // 2. Static Keyword Mapping Fallback
  for (const rule of STATIC_CATEGORY_RULES) {
    if (rule.pattern.test(text)) {
      return { categoryId: null, categoryName: rule.categoryName };
    }
  }

  return { categoryId: null, categoryName: null };
}

// -----------------------------------------------
// Transfer detection
// -----------------------------------------------

const TRANSFER_KEYWORDS = [
  /\btransfer\b/i,
  /\bpay anyone\b/i,
  /\bbpay\b/i,
  /\binternal\b/i,
  /\bfrom account\b/i,
  /\bto account\b/i,
  /\bown account\b/i,
];

/** Returns true if the description looks like a transfer */
export function isLikelyTransfer(description: string): boolean {
  return TRANSFER_KEYWORDS.some((p) => p.test(description));
}

// -----------------------------------------------
// Investment detection
// -----------------------------------------------

const INVESTMENT_KEYWORDS = [
  /\bcommsec\b/i,
  /\bselfwealth\b/i,
  /\bstake\b/i,
  /\bpearler\b/i,
  /\bvanguard\b/i,
  /\bshares\b/i,
  /\betf\b/i,
  /\basx\b/i,
  /\bbrokerage\b/i,
  /\bdividend\b/i,
  /\binvestment\b/i,
];

/** Returns true if the description looks like an investment transaction */
export function isLikelyInvestment(description: string): boolean {
  return INVESTMENT_KEYWORDS.some((p) => p.test(description));
}

// -----------------------------------------------
// Final Type Classification (Single Source of Truth)
// -----------------------------------------------

/**
 * Determine final_type from keyword rules and amount direction.
 * Category must never influence this classification.
 */
export function classifyFinalType(
  amount: number,
  description: string,
  merchant?: string | null
): { finalType: FinalType; confidence: TransactionConfidence } {
  const text = `${description} ${merchant ?? ''}`.toLowerCase();

  // 1. Keyword rules
  if (isLikelyTransfer(text)) {
    return { finalType: 'transfer', confidence: 'medium' };
  }

  if (isLikelyInvestment(text)) {
    return { finalType: 'investment', confidence: 'medium' };
  }

  // 2. Amount direction heuristics
  if (amount >= 0) {
    if (/\b(salary|payroll|wages|pay|refund|return|reversal|credit back)\b/i.test(text)) {
      return { finalType: 'income', confidence: 'high' };
    }
    return { finalType: 'income', confidence: 'medium' };
  }

  return { finalType: 'expense', confidence: 'high' };
}

// -----------------------------------------------
// Date parsing
// -----------------------------------------------

const MONTH_NAMES: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04',
  may: '05', jun: '06', jul: '07', aug: '08',
  sep: '09', oct: '10', nov: '11', dec: '12',
};

/** Parse a date string into ISO YYYY-MM-DD format. Returns null if unparseable. Supports an optional preference to resolve ambiguous D/M/Y vs M/D/Y. */
export function parseDate(raw: string, formatPreference?: 'US' | 'AU'): string | null {
  if (!raw) return null;
  let str = raw.trim();

  // Strip time part if present
  if (str.includes(':')) {
    const parts = str.split(/[\sT]+/);
    if (parts.length > 0) {
      str = parts[0];
    }
  }

  // Normalize separators: convert dots, slashes, spaces to hyphens
  str = str.replace(/[./\s]+/g, '-');

  // 1. Try ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  // 2. Try YYYY-M-D (e.g. 2024-1-15 or 2024-01-05)
  const yyyymd = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (yyyymd) {
    const [, yyyy, mm, dd] = yyyymd;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }

  // 3. Try D-M-Y or M-D-Y
  const dmy = str.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
  if (dmy) {
    let [, p1, p2, yyyy] = dmy;
    if (yyyy.length === 2) {
      yyyy = parseInt(yyyy) > 50 ? `19${yyyy}` : `20${yyyy}`;
    }

    const n1 = parseInt(p1);
    const n2 = parseInt(p2);

    if (n1 > 12 && n2 <= 12) {
      return `${yyyy}-${p2.padStart(2, '0')}-${p1.padStart(2, '0')}`;
    }
    if (n2 > 12 && n1 <= 12) {
      return `${yyyy}-${p1.padStart(2, '0')}-${p2.padStart(2, '0')}`;
    }

    if (formatPreference === 'US') {
      return `${yyyy}-${p1.padStart(2, '0')}-${p2.padStart(2, '0')}`;
    } else {
      return `${yyyy}-${p2.padStart(2, '0')}-${p1.padStart(2, '0')}`;
    }
  }

  // 4. Try DD-MMM-YY or DD-MMM-YYYY (e.g. 15-Jan-24 or 15-Jan-2024)
  const dmmm = str.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2,4})$/);
  if (dmmm) {
    let [, dd, mon, yyyy] = dmmm;
    if (yyyy.length === 2) {
      yyyy = parseInt(yyyy) > 50 ? `19${yyyy}` : `20${yyyy}`;
    }
    const mm = MONTH_NAMES[mon.toLowerCase()];
    if (mm) {
      return `${yyyy}-${mm}-${dd.padStart(2, '0')}`;
    }
  }

  // 5. Try YYYYMMDD raw number
  const yyyymmdd = str.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (yyyymmdd) {
    const [, yyyy, mm, dd] = yyyymmdd;
    return `${yyyy}-${mm}-${dd}`;
  }

  return null;
}

/** Parse an amount string to a number. Handles commas, currency symbols, brackets for negatives, trailing minus. */
export function parseAmount(raw: string, isDebit = false): number | null {
  if (!raw) return null;

  let str = raw.trim();
  if (str === '') return null;

  // Check if negative
  const isBracketed = /^\(.*\)$/.test(str);
  const isNegative = str.startsWith('-') || str.endsWith('-') || isBracketed;

  // Clean all characters except digits and decimal point
  str = str.replace(/[()$£€AUD,\s\-]/g, '');

  const num = parseFloat(str);
  if (isNaN(num)) return null;

  let result = num;
  if (isNegative || isDebit) {
    result = -Math.abs(result);
  } else {
    result = Math.abs(result);
  }

  return result;
}
