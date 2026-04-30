'use client';

import type { MerchantSummary } from '@/types';
import { formatCurrency } from '@/lib/financeEngine';

interface TopMerchantsListProps {
  merchants: MerchantSummary[];
}

export default function TopMerchantsList({ merchants }: TopMerchantsListProps) {
  if (merchants.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5, fontSize: '0.875rem' }}>
        No merchant data available
      </div>
    );
  }

  // Find max total for progress bar scaling
  const maxSpend = merchants.length > 0 ? merchants[0].total : 1;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {merchants.map((merchant, index) => {
        const widthPercent = Math.max(2, (merchant.total / maxSpend) * 100);
        
        return (
          <div key={`${merchant.merchant}-${index}`} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ fontWeight: 500 }}>{merchant.merchant}</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(merchant.total, 'AUD')}</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div 
                style={{ 
                  height: '6px', 
                  width: `${widthPercent}%`, 
                  background: 'var(--color-primary)', 
                  borderRadius: 'var(--radius-full)',
                  opacity: 0.8
                }} 
              />
              <span style={{ fontSize: '0.75rem', opacity: 0.5, whiteSpace: 'nowrap' }}>
                {merchant.transactionCount} tx
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
