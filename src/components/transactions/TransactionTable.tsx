'use client';

import { useState, useTransition } from 'react';
import type { Transaction, Category } from '@/types';
import { formatCurrency } from '@/lib/financeEngine';
import { updateTransactionCategory } from '@/app/(app)/transactions/actions';
import Badge from '@/components/ui/Badge';
import { useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';

function formatAmount(amount: number, finalType: string): string {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  switch (finalType) {
    case 'expense':
      return `-${formatted}`;
    case 'income':
      return `+${formatted}`;
    case 'refund':
      return `+${formatted}`;
    case 'transfer':
      return formatted;
    default:
      return formatted;
  }
}

function getAmountColor(finalType: string): string {
  switch (finalType) {
    case 'expense':
      return 'var(--color-danger)';
    case 'income':
    case 'refund':
      return 'var(--color-success)';
    case 'transfer':
      return 'var(--color-muted)';
    default:
      return 'var(--color-muted)';
  }
}

interface TransactionTableProps {
  transactions: Transaction[];
  categories: Category[];
}

export default function TransactionTable({ transactions, categories }: TransactionTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticCategories, setOptimisticCategories] = useState<Record<string, string | null>>({});
  const [saveStatus, setSaveStatus] = useState<Record<string, 'saving' | 'saved' | 'error'>>({});

  const handleCategoryChange = (transactionId: string, categoryId: string | null) => {
    // Optimistic UI update
    setOptimisticCategories(prev => ({ ...prev, [transactionId]: categoryId }));
    setSaveStatus(prev => ({ ...prev, [transactionId]: 'saving' }));
    
    startTransition(async () => {
      try {
        await updateTransactionCategory(transactionId, categoryId);
        setSaveStatus(prev => ({ ...prev, [transactionId]: 'saved' }));
        
        // Clear the success status after a few seconds
        setTimeout(() => {
          setSaveStatus(prev => ({ ...prev, [transactionId]: undefined as any }));
        }, 2000);
        
        // Refresh the server data
        router.refresh();
      } catch (err) {
        console.error('Failed to update category', err);
        setSaveStatus(prev => ({ ...prev, [transactionId]: 'error' }));
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
            const currentCategoryId = optimisticCategories[tx.id] !== undefined 
              ? optimisticCategories[tx.id] 
              : tx.category_id;
              
            const isIncome = tx.final_type === 'income' || tx.final_type === 'refund';
            
            // Determine if it needs a badge
            let badge = null;
            if (tx.final_type === 'transfer') {
              badge = <Badge variant="info" style={{ marginLeft: '0.5rem' }}>Transfer</Badge>;
            } else if (tx.final_type === 'investment') {
              badge = <Badge variant="warning" style={{ marginLeft: '0.5rem' }}>Investment</Badge>;
            } else if (tx.final_type === 'refund') {
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <select
                      value={currentCategoryId || ''}
                      onChange={(e) => handleCategoryChange(tx.id, e.target.value || null)}
                      disabled={saveStatus[tx.id] === 'saving'}
                      style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface)',
                        color: 'var(--color-text)',
                        fontSize: '0.875rem',
                        width: '150px',
                        outline: 'none',
                        opacity: saveStatus[tx.id] === 'saving' ? 0.7 : 1,
                      }}
                    >
                      <option value="">Uncategorized</option>
                      {sortedCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    {saveStatus[tx.id] === 'saving' && <Loader2 size={16} className="animate-spin text-muted" style={{ color: 'var(--color-text-secondary)' }} />}
                    {saveStatus[tx.id] === 'saved' && <Check size={16} style={{ color: 'var(--color-success)' }} />}
                    {saveStatus[tx.id] === 'error' && <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem' }}>Error</span>}
                  </div>
                </td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: getAmountColor(tx.final_type) }}>
                  {formatAmount(tx.amount, tx.final_type)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
