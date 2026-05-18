// ============================================================
// Rakam v2 — Finance Engine
// The ONLY place where financial math is computed.
// All pages must import from here. No local math allowed.
//
// Rules:
// - Income = credits excluding transfers
// - Expenses = debits excluding transfers; refunds reduce spend
// - Surplus = income - expenses
// - All amounts are signed: positive = income, negative = expense
// ============================================================

import type {
  Transaction,
  FinanceSummary,
  CategoryBreakdown,
  MonthlyTrend,
  MerchantSummary,
  Goal,
} from '@/types';
import { format } from 'date-fns';

// -----------------------------------------------
// Core aggregates
// -----------------------------------------------

/** Total income: all credits excluding transfers and refunds */
export function getIncome(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.direction === 'credit' && !t.is_transfer && t.type !== 'refund')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

/** Total expenses: all debits excluding transfers. Refunds reduce spend. */
export function getExpenses(transactions: Transaction[]): number {
  const debits = transactions
    .filter((t) => t.direction === 'debit' && !t.is_transfer && t.type !== 'refund')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const refunds = transactions
    .filter((t) => t.type === 'refund')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return Math.max(0, debits - refunds);
}

/** Net surplus: income minus expenses */
export function getSurplus(transactions: Transaction[]): number {
  return getIncome(transactions) - getExpenses(transactions);
}

/**
 * Safe-to-invest estimate.
 * Surplus minus total goal targets that are not yet reached.
 * Conservative: reserves full outstanding goal amounts.
 */
export function getSafeToInvest(
  transactions: Transaction[],
  goals: Goal[]
): number {
  const surplus = getSurplus(transactions);
  const uncommittedGoalBalance = goals.reduce((sum, g) => {
    const remaining = Math.max(0, g.target_amount - g.current_amount);
    return sum + remaining;
  }, 0);
  return Math.max(0, surplus - uncommittedGoalBalance);
}

/** Full summary object used by dashboard and reports */
export function getFinanceSummary(
  transactions: Transaction[],
  goals: Goal[] = []
): FinanceSummary {
  const totalIncome = getIncome(transactions);
  const totalExpenses = getExpenses(transactions);
  const surplus = totalIncome - totalExpenses;
  const safeToInvest = getSafeToInvest(transactions, goals);

  return { totalIncome, totalExpenses, surplus, safeToInvest };
}

// -----------------------------------------------
// Category breakdown
// -----------------------------------------------

/** Spending grouped by category (expenses only, excluding transfers). Refunds reduce their category totals. */
export function getByCategory(
  transactions: Transaction[]
): CategoryBreakdown[] {
  const expenseTransactions = transactions.filter(
    (t) => t.direction === 'debit' && !t.is_transfer && t.type !== 'refund'
  );

  const refundTransactions = transactions.filter(
    (t) => t.type === 'refund'
  );

  const totals = new Map<
    string,
    {
      categoryId: string | null;
      categoryName: string;
      color: string | null;
      total: number;
      count: number;
    }
  >();

  // Add debits
  for (const t of expenseTransactions) {
    const key = t.category_id ?? 'uncategorized';
    const existing = totals.get(key);
    const amount = Math.abs(t.amount);

    if (existing) {
      existing.total += amount;
      existing.count += 1;
    } else {
      totals.set(key, {
        categoryId: t.category_id,
        categoryName: t.category?.name ?? 'Uncategorized',
        color: t.category?.color ?? '#9E9E9E',
        total: amount,
        count: 1,
      });
    }
  }

  // Subtract refunds
  for (const t of refundTransactions) {
    const key = t.category_id ?? 'uncategorized';
    const existing = totals.get(key);
    const amount = Math.abs(t.amount);

    if (existing) {
      existing.total = Math.max(0, existing.total - amount);
      existing.count += 1;
    } else {
      // If we got a refund but no matching debit, count it as a negative total
      totals.set(key, {
        categoryId: t.category_id,
        categoryName: t.category?.name ?? 'Uncategorized',
        color: t.category?.color ?? '#9E9E9E',
        total: -amount,
        count: 1,
      });
    }
  }

  // Filter out zero totals to avoid cluttering charts
  const list = Array.from(totals.values()).filter(v => v.total !== 0);

  const grandTotal = list.reduce(
    (sum, v) => sum + v.total,
    0
  );

  return list
    .map((v) => ({
      categoryId: v.categoryId,
      categoryName: v.categoryName,
      color: v.color,
      total: v.total,
      percentage: grandTotal > 0 ? (v.total / grandTotal) * 100 : 0,
      transactionCount: v.count,
    }))
    .sort((a, b) => b.total - a.total);
}

// -----------------------------------------------
// Monthly trend
// -----------------------------------------------

/** Income vs expenses by calendar month */
export interface TrendData {
  label: string; // YYYY-MM or YYYY-MM-DD
  income: number;
  expenses: number;
  surplus: number;
}

/** 
 * Dynamically group transactions by day or month depending on date span.
 * Uses exact same math functions to ensure consistency.
 */
export function getTrend(transactions: Transaction[]): TrendData[] {
  if (transactions.length === 0) return [];

  const dates = transactions.map(t => t.date).sort();
  const minDate = new Date(dates[0]);
  const maxDate = new Date(dates[dates.length - 1]);
  
  // If span is <= 31 days, group by day. Otherwise group by month.
  const spanDays = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
  const groupByMonth = spanDays > 31;

  const grouped = new Map<string, Transaction[]>();

  for (const t of transactions) {
    const key = groupByMonth ? t.date.substring(0, 7) : t.date;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(t);
  }

  const sortedKeys = Array.from(grouped.keys()).sort();

  return sortedKeys.map(key => {
    const groupTx = grouped.get(key)!;
    return {
      label: key,
      income: getIncome(groupTx),
      expenses: getExpenses(groupTx),
      surplus: getSurplus(groupTx),
    };
  });
}

// -----------------------------------------------
// Top merchants
// -----------------------------------------------

/** Top spending merchants by total, expenses only. Refunds reduce merchant totals. */
export function getTopMerchants(
  transactions: Transaction[],
  limit = 10
): MerchantSummary[] {
  const expenseTransactions = transactions.filter(
    (t) => t.direction === 'debit' && !t.is_transfer && t.type !== 'refund'
  );

  const refundTransactions = transactions.filter(
    (t) => t.type === 'refund'
  );

  const totals = new Map<string, { total: number; count: number }>();

  // Add debits
  for (const t of expenseTransactions) {
    const key = t.merchant ?? t.description;
    const existing = totals.get(key);
    const amount = Math.abs(t.amount);

    if (existing) {
      existing.total += amount;
      existing.count += 1;
    } else {
      totals.set(key, { total: amount, count: 1 });
    }
  }

  // Subtract refunds
  for (const t of refundTransactions) {
    const key = t.merchant ?? t.description;
    const existing = totals.get(key);
    const amount = Math.abs(t.amount);

    if (existing) {
      existing.total = Math.max(0, existing.total - amount);
      existing.count += 1;
    } else {
      totals.set(key, { total: -amount, count: 1 });
    }
  }

  return Array.from(totals.entries())
    .filter(([_, v]) => v.total !== 0)
    .map(([merchant, v]) => ({
      merchant,
      total: v.total,
      transactionCount: v.count,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

// -----------------------------------------------
// Helpers
// -----------------------------------------------

/** Format a number as currency string (AUD default) */
export function formatCurrency(
  amount: number,
  currency = 'AUD',
  locale = 'en-AU'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/** Filter transactions to a date range */
export function filterByDateRange(
  transactions: Transaction[],
  from: Date,
  to: Date
): Transaction[] {
  const fromStr = format(from, 'yyyy-MM-dd');
  const toStr = format(to, 'yyyy-MM-dd');
  return transactions.filter((t) => t.date >= fromStr && t.date <= toStr);
}

/** Filter to current calendar month */
export function filterCurrentMonth(transactions: Transaction[]): Transaction[] {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return filterByDateRange(transactions, from, to);
}

/** Filter to last calendar month */
export function filterLastMonth(transactions: Transaction[]): Transaction[] {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const to = new Date(now.getFullYear(), now.getMonth(), 0);
  return filterByDateRange(transactions, from, to);
}
