'use client';

import { useState, useTransition } from 'react';
import type { Transaction, Category } from '@/types';
import { formatCurrency } from '@/lib/financeEngine';
import { updateTransactionCategory } from '@/app/(app)/transactions/actions';
import Badge from '@/components/ui/Badge';
import { useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';

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
  const [optimisticFinalTypes, setOptimisticFinalTypes] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<Record<string, 'saving' | 'saved' | 'error'>>({});

  const handleCategoryChange = (transactionId: string, categoryId: string | null) => {
    // Optimistic UI update
    setOptimisticCategories(prev => ({ ...prev, [transactionId]: categoryId }));
    setSaveStatus(prev => ({ ...prev, [transactionId]: 'saving' }));

    // Derive final_type optimistically from the selected category's type
    if (categoryId) {
      const selectedCat = categories.find(c => c.id === categoryId);
      if (selectedCat?.type === 'income_only') {
        setOptimisticFinalTypes(prev => ({ ...prev, [transactionId]: 'income' }));
      } else if (selectedCat?.type === 'expense_only') {
        setOptimisticFinalTypes(prev => ({ ...prev, [transactionId]: 'expense' }));
      }
    }
    
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

  const getDisplayAmount = (transaction: any): number => {
    // Use optimistic final_type if available (set immediately on category change)
    const effectiveFinalType = optimisticFinalTypes[transaction.id] || transaction.final_type || transaction.type;
    const isIncome = effectiveFinalType === 'income' || effectiveFinalType === 'transfer_in' || effectiveFinalType === 'refund';
    return isIncome
      ? Math.abs(transaction.amount || 0)
      : -Math.abs(transaction.amount || 0);
  };

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
          {transactions.map((transaction) => {
            const currentCategoryId = optimisticCategories[transaction.id] !== undefined 
              ? optimisticCategories[transaction.id] 
              : transaction.category_id;
              
            const isIncome = transaction.final_type === 'income' || transaction.final_type === 'refund';
            
            let badge = null;
            if (transaction.final_type === 'transfer') {
              badge = <Badge variant="info" style={{ marginLeft: '0.5rem' }}>Transfer</Badge>;
            } else if (transaction.final_type === 'investment') {
              badge = <Badge variant="warning" style={{ marginLeft: '0.5rem' }}>Investment</Badge>;
            } else if (transaction.final_type === 'refund') {
              badge = <Badge variant="success" style={{ marginLeft: '0.5rem' }}>Refund</Badge>;
            }

            return (
              <tr key={transaction.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                  {transaction.date}
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <div style={{ fontWeight: 500 }}>{transaction.merchant || transaction.description}</div>
                  {transaction.merchant && <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{transaction.description}</div>}
                  {badge}
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <select
                      value={currentCategoryId || ''}
                      onChange={(e) => handleCategoryChange(transaction.id, e.target.value || null)}
                      disabled={saveStatus[transaction.id] === 'saving'}
                      style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface)',
                        color: 'var(--color-text)',
                        fontSize: '0.875rem',
                        width: '150px',
                        outline: 'none',
                        opacity: saveStatus[transaction.id] === 'saving' ? 0.7 : 1,
                      }}
                    >
                      <option value="">Uncategorized</option>
                      {sortedCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    {transaction.confidence_score !== undefined && transaction.confidence_score !== null && (
                      <>
                        {transaction.confidence_score >= 85 && (
                          <span title="High Confidence" style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: 'var(--color-success)', borderRadius: '50%', flexShrink: 0 }} />
                        )}
                        {transaction.confidence_score >= 50 && transaction.confidence_score < 85 && (
                          <span title="Medium Confidence" style={{ display: 'inline-block', padding: '0.125rem 0.375rem', backgroundColor: '#fef08a', color: '#854d0e', fontSize: '10px', borderRadius: 'var(--radius-sm)', fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0 }}>
                            Review?
                          </span>
                        )}
                        {transaction.confidence_score < 50 && (
                          <span title="Low Confidence" style={{ display: 'inline-block', padding: '0.125rem 0.375rem', backgroundColor: 'var(--color-danger)', color: '#ffffff', fontSize: '10px', borderRadius: 'var(--radius-sm)', fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0 }}>
                            Review
                          </span>
                        )}
                      </>
                    )}
                    {(transaction.confidence_score === undefined || transaction.confidence_score === null) && (transaction.final_type as string) === 'needs_review' && (
                      <span title="Needs Review" style={{ display: 'inline-block', padding: '0.125rem 0.375rem', backgroundColor: 'var(--color-danger)', color: '#ffffff', fontSize: '10px', borderRadius: 'var(--radius-sm)', fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0 }}>
                        Review
                      </span>
                    )}
                    {saveStatus[transaction.id] === 'saving' && <Loader2 size={16} className="animate-spin text-muted" style={{ color: 'var(--color-text-secondary)' }} />}
                    {saveStatus[transaction.id] === 'saved' && <Check size={16} style={{ color: 'var(--color-success)' }} />}
                    {saveStatus[transaction.id] === 'error' && <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem' }}>Error</span>}
                  </div>
                </td>
                <td
                  className={`text-right font-medium ${
                    getDisplayAmount(transaction) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                  style={{ padding: '0.75rem 1rem' }}
                >
                  {formatCurrency(getDisplayAmount(transaction), (transaction as any).currency || 'NPR')}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
