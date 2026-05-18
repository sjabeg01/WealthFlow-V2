'use client';

import type { Transaction } from '@/types';
import { formatCurrency } from '@/lib/financeEngine';
import Badge from '@/components/ui/Badge';
import Link from 'next/link';

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
        const isIncome = tx.direction === 'credit';
        let badge = null;
        if (tx.is_transfer) {
          badge = <Badge variant="info" style={{ marginLeft: '0.5rem' }}>Transfer</Badge>;
        } else if (tx.type === 'refund') {
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
            
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: isIncome ? 'var(--color-success)' : 'var(--color-text)' }}>
              {isIncome ? '+' : ''}{formatCurrency(Math.abs(tx.amount), 'AUD')}
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
