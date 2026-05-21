'use client';

import type { Transaction, Goal } from '@/types';
import { getFinanceSummary, getByCategory, getTopMerchants, formatCurrency } from '@/lib/financeEngine';
import { Lightbulb, TrendingDown, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

interface InsightsBlockProps {
  transactions: Transaction[];
  goals: Goal[];
}

export default function InsightsBlock({ transactions, goals }: InsightsBlockProps) {
  if (transactions.length === 0) {
    return (
      <div style={{ display: 'flex', gap: '0.75rem', color: 'var(--color-text)', opacity: 0.6, fontSize: '0.875rem' }}>
        <Lightbulb size={18} />
        <span>Import some transactions to see automated insights.</span>
      </div>
    );
  }

  const summary = getFinanceSummary(transactions, goals);
  const breakdown = getByCategory(transactions);
  const topMerchants = getTopMerchants(transactions, 1);

  // Insight 1: Highest spending category
  const topCategory = breakdown.length > 0 ? breakdown[0] : null;
  
  // Insight 2: Biggest merchant
  const topMerchant = topMerchants.length > 0 ? topMerchants[0] : null;

  // Insight 3: Transfers excluded
  const transfersCount = transactions.filter(t => t.final_type === 'transfer').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Insight: Surplus Status */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        <div style={{ color: summary.surplus >= 0 ? 'var(--color-success)' : 'var(--color-danger)', marginTop: '2px' }}>
          {summary.surplus >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>
          <span style={{ fontWeight: 500 }}>{summary.surplus >= 0 ? 'Positive Cashflow:' : 'Negative Cashflow:'}</span> You have a net surplus of {formatCurrency(summary.surplus, 'NPR')} this period.
        </div>
      </div>

      {/* Insight: Top Category */}
      {topCategory && topCategory.total > 0 && (
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <div style={{ color: 'var(--color-warning)', marginTop: '2px' }}>
            <AlertCircle size={18} />
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>
            <span style={{ fontWeight: 500 }}>Highest Spend:</span> {topCategory.categoryName} accounts for {formatCurrency(topCategory.total, 'NPR')} ({topCategory.percentage.toFixed(0)}% of expenses).
          </div>
        </div>
      )}

      {/* Insight: Safe to Invest */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        <div style={{ color: 'var(--color-info)', marginTop: '2px' }}>
          <CheckCircle2 size={18} />
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>
          <span style={{ fontWeight: 500 }}>Safe to Invest:</span> You have {formatCurrency(summary.safeToInvest, 'NPR')} available to invest after accounting for goal targets.
        </div>
      </div>

      {/* Insight: Top Merchant */}
      {topMerchant && topMerchant.total > 0 && (
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <div style={{ color: 'var(--color-text)', opacity: 0.7, marginTop: '2px' }}>
            <Lightbulb size={18} />
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text)', opacity: 0.9 }}>
            <span style={{ fontWeight: 500 }}>Top Merchant:</span> {topMerchant.merchant} ({formatCurrency(topMerchant.total, 'NPR')}).
          </div>
        </div>
      )}

      {/* Insight: Transfers Excluded */}
      {transfersCount > 0 && (
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <div style={{ color: 'var(--color-text)', opacity: 0.7, marginTop: '2px' }}>
            <Lightbulb size={18} />
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text)', opacity: 0.9 }}>
            <span style={{ fontWeight: 500 }}>Clean Data:</span> {transfersCount} internal transfer{transfersCount !== 1 ? 's were' : ' was'} excluded from your expense calculations.
          </div>
        </div>
      )}
    </div>
  );
}
