'use client';

import type { CategoryBreakdown } from '@/types';
import { formatCurrency } from '@/lib/financeEngine';

interface CategoryListProps {
  breakdown: CategoryBreakdown[];
}

export default function CategoryList({ breakdown }: CategoryListProps) {
  if (breakdown.length === 0) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
        <p style={{ color: 'var(--color-text)', opacity: 0.7 }}>No category data found for this period.</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {breakdown.map((item, index) => {
        const isUncategorized = item.categoryId === null || item.categoryId === 'uncategorized';
        
        return (
          <div 
            key={item.categoryId || 'uncat'} 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '1rem',
              borderBottom: index < breakdown.length - 1 ? '1px solid var(--color-border)' : 'none',
              background: isUncategorized ? 'rgba(255, 152, 0, 0.05)' : 'transparent',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div 
                style={{ 
                  width: '12px', 
                  height: '12px', 
                  borderRadius: '50%', 
                  background: isUncategorized ? 'var(--color-warning)' : (item.color || 'var(--color-text)'),
                  opacity: 0.8
                }} 
              />
              <div>
                <div style={{ fontWeight: 500, color: isUncategorized ? 'var(--color-warning)' : 'var(--color-text)' }}>
                  {item.categoryName}
                </div>
                <div style={{ fontSize: '0.75rem', opacity: 0.6, color: 'var(--color-text)' }}>
                  {item.transactionCount} transaction{item.transactionCount !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600 }}>
                {formatCurrency(item.total, 'AUD')}
              </div>
              <div style={{ fontSize: '0.75rem', opacity: 0.6, color: 'var(--color-text)' }}>
                {item.percentage.toFixed(1)}%
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
