'use client';

import { useState, useTransition } from 'react';
import type { Category } from '@/types';
import { updateCategoryType } from '@/app/(app)/categories/actions';
import Card from '@/components/ui/Card';
import { Loader2 } from 'lucide-react';

interface CategorySettingsProps {
  categories: Category[];
}

export default function CategorySettings({ categories }: CategorySettingsProps) {
  const [isPending, startTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [localCategories, setLocalCategories] = useState<Category[]>(categories);

  const handleTypeChange = async (categoryId: string, type: 'expense_only' | 'income_only' | 'mixed') => {
    setUpdatingId(categoryId);
    // Optimistic update
    setLocalCategories(prev =>
      prev.map(c => (c.id === categoryId ? { ...c, type } : c))
    );

    startTransition(async () => {
      try {
        await updateCategoryType(categoryId, type);
      } catch (err) {
        console.error('Failed to update category type', err);
        // Rollback
        setLocalCategories(categories);
      } finally {
        setUpdatingId(null);
      }
    });
  };

  return (
    <Card>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Category Rules & Types</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: '0.25rem 0 0 0' }}>
          Configure categories as Expense-only or Income-only to enforce strict auto-classification constraints during import.
        </p>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'var(--color-surface-alt)', textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '0.75rem 1.5rem', fontWeight: 500 }}>Category Name</th>
              <th style={{ padding: '0.75rem 1.5rem', fontWeight: 500 }}>Enforced Direction (Classification Signal 1)</th>
            </tr>
          </thead>
          <tbody>
            {localCategories.map((category) => (
              <tr key={category.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: category.color || 'var(--color-text-muted)',
                      display: 'inline-block'
                    }}
                  />
                  <span style={{ fontWeight: 500 }}>{category.name}</span>
                  {category.is_system && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', background: 'var(--color-surface-alt)', padding: '0.125rem 0.375rem', borderRadius: 'var(--radius-sm)' }}>
                      System
                    </span>
                  )}
                </td>
                <td style={{ padding: '0.75rem 1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <select
                      className="input"
                      style={{ padding: '0.25rem 0.5rem', height: '32px', width: '180px' }}
                      value={category.type || 'mixed'}
                      onChange={(e) => handleTypeChange(category.id, e.target.value as any)}
                      disabled={isPending && updatingId === category.id}
                    >
                      <option value="mixed">Mixed (Default)</option>
                      <option value="expense_only">Expense Only</option>
                      <option value="income_only">Income Only</option>
                    </select>
                    {updatingId === category.id && (
                      <Loader2 size={16} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
