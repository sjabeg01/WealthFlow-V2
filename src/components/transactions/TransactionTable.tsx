'use client';

import { useState, useTransition } from 'react';
import type { Transaction, Category } from '@/types';
import { formatCurrency } from '@/lib/financeEngine';
import { updateTransactionCategory } from '@/app/(app)/transactions/actions';
import Badge from '@/components/ui/Badge';

interface TransactionTableProps {
  transactions: Transaction[];
  categories: Category[];
}

export default function TransactionTable({ transactions, categories }: TransactionTableProps) {
  const [isPending, startTransition] = useTransition();

  const handleCategoryChange = (transactionId: string, categoryId: string | null) => {
    startTransition(async () => {
      try {
        await updateTransactionCategory(transactionId, categoryId);
        // We could offer to create a rule here by opening a modal, 
        // but the user said "optionally offer" and "do not force a prompt every time, keep it lightweight".
        // A toast notification with an "Create Rule" action would be ideal, but for now we just save silently.
      } catch (err) {
        console.error('Failed to update category', err);
      }
    });
  };

  if (transactions.length === 0) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
        <p style={{ color: 'var(--color-text)', opacity: 0.7, marginBottom: '1rem' }}>No transactions found for this period.</p>
        <a href="/import" style={{ color: 'var(--color-accent)', textDecoration: 'underline', fontWeight: 500 }}>
          Import a Statement
        </a>
      </div>
    );
  }

  // Pre-sort categories alphabetically for the dropdown
  const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <th style={{ padding: '0.75rem 1rem', fontWeight: 500, color: 'var(--color-text)', opacity: 0.7 }}>Date</th>
            <th style={{ padding: '0.75rem 1rem', fontWeight: 500, color: 'var(--color-text)', opacity: 0.7 }}>Description</th>
            <th style={{ padding: '0.75rem 1rem', fontWeight: 500, color: 'var(--color-text)', opacity: 0.7 }}>Category</th>
            <th style={{ padding: '0.75rem 1rem', fontWeight: 500, color: 'var(--color-text)', opacity: 0.7, textAlign: 'right' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => {
            const isIncome = tx.direction === 'credit';
            // Determine if it needs a badge
            let badge = null;
            if (tx.is_transfer) {
              badge = <Badge variant="info" style={{ marginLeft: '0.5rem' }}>Transfer</Badge>;
            } else if (tx.type === 'refund') {
              badge = <Badge variant="success" style={{ marginLeft: '0.5rem' }}>Refund</Badge>;
            }

            return (
              <tr key={tx.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                  {tx.date}
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <div style={{ fontWeight: 500 }}>{tx.merchant || tx.description}</div>
                  {tx.merchant && <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{tx.description}</div>}
                  {badge}
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <select
                    value={tx.category_id || ''}
                    onChange={(e) => handleCategoryChange(tx.id, e.target.value || null)}
                    disabled={isPending}
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text)',
                      fontSize: '0.875rem',
                      width: '150px',
                      outline: 'none',
                    }}
                  >
                    <option value="">Uncategorized</option>
                    {sortedCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: isIncome ? 'var(--color-success)' : 'var(--color-text)' }}>
                  {isIncome ? '+' : ''}{formatCurrency(Math.abs(tx.amount), 'AUD')}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
