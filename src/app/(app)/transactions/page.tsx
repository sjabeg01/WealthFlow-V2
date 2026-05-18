import type { Metadata } from 'next';
import styles from '../app.module.css';

import { parseDateParams } from '@/lib/dateParams';
import { getTransactions, getCategories, getUserSession } from '@/lib/dataService';
import TransactionTable from '@/components/transactions/TransactionTable';
import PeriodSelector from '@/components/shared/PeriodSelector';
import Card from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'Transactions | Rakam',
};

// Next.js 15 requires async searchParams handling
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function TransactionsPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;
  const { from, to } = parseDateParams(searchParams);

  const { user } = await getUserSession();
  
  if (!user) return null;

  // Fetch transactions using central service
  const transactions = await getTransactions(from, to);

  // Fetch all categories for the dropdown
  const allCategories = await getCategories();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 600 }}>Transactions</h1>
          <p style={{ margin: 0, color: 'var(--color-text)', opacity: 0.7, fontSize: '0.875rem' }}>
            Review and categorize your imported ledger.
          </p>
        </div>
        <PeriodSelector />
      </div>

      <Card>
        <TransactionTable transactions={transactions} categories={allCategories} />
      </Card>
    </div>
  );
}
