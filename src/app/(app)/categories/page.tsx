import type { Metadata } from 'next';
import styles from '../app.module.css';

import { parseDateParams } from '@/lib/dateParams';
import { getByCategory } from '@/lib/financeEngine';
import { getTransactions, getUserSession, getCategories } from '@/lib/dataService';
import PeriodSelector from '@/components/shared/PeriodSelector';
import CategoryList from '@/components/categories/CategoryList';
import CategorySettings from '@/components/categories/CategorySettings';
import Card from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'Categories | Rakam',
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function CategoriesPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;
  const { from, to } = parseDateParams(searchParams);

  const { user } = await getUserSession();
  if (!user) return null;

  // Fetch transactions and all categories
  const [transactions, categories] = await Promise.all([
    getTransactions(from, to),
    getCategories()
  ]);
  
  // Calculate breakdown
  const breakdown = getByCategory(transactions);
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 600 }}>Categories</h1>
          <p style={{ margin: 0, color: 'var(--color-text)', opacity: 0.7, fontSize: '0.875rem' }}>
            Spending breakdown and classification rules.
          </p>
        </div>
        <PeriodSelector />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        <Card>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Spending Breakdown</h2>
          </div>
          <CategoryList breakdown={breakdown} />
        </Card>

        <CategorySettings categories={categories} />
      </div>
    </div>
  );
}
