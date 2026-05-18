import type { Metadata } from 'next';
import styles from '../app.module.css';

import { parseDateParams } from '@/lib/dateParams';
import { getByCategory } from '@/lib/financeEngine';
import { getTransactions, getUserSession } from '@/lib/dataService';
import PeriodSelector from '@/components/shared/PeriodSelector';
import CategoryList from '@/components/categories/CategoryList';
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

  // Fetch transactions using central service
  const transactions = await getTransactions(from, to);
  
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

      <Card>
        <CategoryList breakdown={breakdown} />
      </Card>
    </div>
  );
}
