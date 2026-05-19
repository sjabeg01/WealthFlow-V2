'use client';

import type { Transaction } from '@/types';
import { formatCurrency } from '@/lib/financeEngine';
import Badge from '@/components/ui/Badge';
import Link from 'next/link';

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

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export default function RecentTransactions({ transactions }: RecentTransactionsProps) {
  if (transactions.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5, fontSize: '0.875rem' }}>
        No recent transactions
      </div>
    );
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      {transactions.map((tx, index) => {
        const isIncome = tx.final_type === 'income' || tx.final_type === 'refund';
        let badge = null;
        if (tx.final_type === 'transfer') {
          badge = <Badge variant="info" style={{ marginLeft: '0.5rem' }}>Transfer</Badge>;
        } else if (tx.final_type === 'investment') {
          badge = <Badge variant="warning" style={{ marginLeft: '0.5rem' }}>Investment</Badge>;
        } else if (tx.final_type === 'refund') {
          badge = <Badge variant="success" style={{ marginLeft: '0.5rem' }}>Refund</Badge>;
        }

        return (
          <div 
            key={tx.id} 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '0.75rem 0',
              borderBottom: index < transactions.length - 1 ? '1px solid var(--color-border)' : 'none'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                {tx.merchant || tx.description} {badge}
              </div>
              <div style={{ fontSize: '0.75rem', opacity: 0.6, color: 'var(--color-text)' }}>
                {tx.date} &bull; {tx.category?.name || 'Uncategorized'}
              </div>
            </div>
            
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: getAmountColor(tx.final_type) }}>
              {formatAmount(tx.amount, tx.final_type)}
            </div>
          </div>
        );
      })}
      
      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        <Link href="/transactions" style={{ fontSize: '0.875rem', color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 500 }}>
          View all transactions &rarr;
        </Link>
      </div>
    </div>
  );
}
