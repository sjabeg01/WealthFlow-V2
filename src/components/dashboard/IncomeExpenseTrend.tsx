'use client';

import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { TrendData } from '@/lib/financeEngine';
import { formatCurrency } from '@/lib/financeEngine';
import { format, parseISO } from 'date-fns';

interface IncomeExpenseTrendProps {
  data: TrendData[];
}

export default function IncomeExpenseTrend({ data }: IncomeExpenseTrendProps) {
  if (data.length === 0) {
    return (
      <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--color-text)', opacity: 0.5 }}>No trend data available</span>
      </div>
    );
  }

  // Format labels nicely
  const chartData = data.map(item => {
    let displayLabel = item.label;
    try {
      if (item.label.length === 7) {
        // YYYY-MM
        displayLabel = format(parseISO(`${item.label}-01`), 'MMM yyyy');
      } else if (item.label.length === 10) {
        // YYYY-MM-DD
        displayLabel = format(parseISO(item.label), 'd MMM');
      }
    } catch (e) {
      // fallback
    }

    return {
      ...item,
      displayLabel,
    };
  });

  return (
    <div style={{ width: '100%', height: '300px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <XAxis 
            dataKey="displayLabel" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: 'var(--color-text)', opacity: 0.6 }} 
            dy={10}
          />
          <Tooltip 
            formatter={(value: number, name: string) => [formatCurrency(value, 'NPR'), name.charAt(0).toUpperCase() + name.slice(1)]}
            contentStyle={{ 
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text)'
            }}
            cursor={{ fill: 'var(--color-surface-alt)', opacity: 0.4 }}
          />
          <Bar dataKey="income" fill="var(--color-success)" radius={[4, 4, 0, 0]} maxBarSize={40} />
          <Bar dataKey="expenses" fill="var(--color-danger)" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
