'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { CategoryBreakdown } from '@/types';
import { formatCurrency } from '@/lib/financeEngine';

interface CategoryDonutProps {
  breakdown: CategoryBreakdown[];
}

export default function CategoryDonut({ breakdown }: CategoryDonutProps) {
  if (breakdown.length === 0) {
    return (
      <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--color-text)', opacity: 0.5 }}>No spending data</span>
      </div>
    );
  }

  // Map to recharts data format
  const data = breakdown.map(item => ({
    name: item.categoryName,
    value: item.total,
    color: item.categoryId === null || item.categoryId === 'uncategorized' 
      ? 'var(--color-warning)' 
      : (item.color || 'var(--color-text)')
  }));

  const totalSpend = breakdown.reduce((sum, item) => sum + item.total, 0);

  return (
    <div style={{ width: '100%', height: '300px', position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={120}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => formatCurrency(value, 'NPR')}
            contentStyle={{ 
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        pointerEvents: 'none'
      }}>
        <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Total Spent</div>
        <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{formatCurrency(totalSpend, 'NPR')}</div>
      </div>
    </div>
  );
}
