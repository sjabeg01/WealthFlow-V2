import type { Metadata } from 'next';
import styles from '../app.module.css';

import { parseDateParams } from '@/lib/dateParams';
import { getFinanceSummary, getByCategory, getTopMerchants, formatCurrency } from '@/lib/financeEngine';
import { getTransactions, getUserSession } from '@/lib/dataService';
import PeriodSelector from '@/components/shared/PeriodSelector';
import CategoryDonut from '@/components/reports/CategoryDonut';
import TopMerchantsList from '@/components/reports/TopMerchantsList';
import Card from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'Reports | Rakam',
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function ReportsPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;
  const { from, to } = parseDateParams(searchParams);

  const { user } = await getUserSession();
  if (!user) return null;

  // Fetch transactions using central service
  const transactions = await getTransactions(from, to);
  
  // Calculate analytics strictly using financeEngine
  const summary = getFinanceSummary(transactions, []);
  const breakdown = getByCategory(transactions);
  const topMerchants = getTopMerchants(transactions, 10);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 600 }}>Reports</h1>
          <p style={{ margin: 0, color: 'var(--color-text)', opacity: 0.7, fontSize: '0.875rem' }}>
            Analytics and insights powered by your trusted ledger.
          </p>
        </div>
        <PeriodSelector />
      </div>

      {transactions.length === 0 ? (
        <div style={{ padding: '4rem 1rem', textAlign: 'center', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          <p style={{ color: 'var(--color-text)', opacity: 0.7, marginBottom: '1rem' }}>No transactions found for this period.</p>
          <a href="/import" style={{ color: 'var(--color-accent)', textDecoration: 'underline', fontWeight: 500 }}>
            Import a Statement
          </a>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <Card style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: '0.5rem' }}>Income</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-success)' }}>
            {formatCurrency(summary.totalIncome, 'NPR')}
          </div>
        </Card>
        <Card style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: '0.5rem' }}>Expenses</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>
            {formatCurrency(summary.totalExpenses, 'NPR')}
          </div>
        </Card>
        <Card style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: '0.5rem' }}>Surplus</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: summary.surplus >= 0 ? 'var(--color-success)' : 'var(--color-warning)' }}>
            {summary.surplus >= 0 ? '+' : ''}{formatCurrency(summary.surplus, 'NPR')}
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <Card>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Category Breakdown</h3>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <CategoryDonut breakdown={breakdown} />
          </div>
        </Card>

        <Card>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Top Merchants</h3>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <TopMerchantsList merchants={topMerchants} />
          </div>
        </Card>
      </div>
      </>
      )}
    </div>
  );
}
