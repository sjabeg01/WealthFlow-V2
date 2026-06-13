import { parseDateParams } from '@/lib/dateParams';
import { getFinanceSummary, getByCategory, getTrend, formatCurrency } from '@/lib/financeEngine';
import { getTransactions, getGoals, getUserSession, getDataSources } from '@/lib/dataService';
import { Sparkles } from 'lucide-react';
import PeriodSelector from '@/components/shared/PeriodSelector';
import Card from '@/components/ui/Card';
import CategoryDonut from '@/components/reports/CategoryDonut';
import IncomeExpenseTrend from '@/components/dashboard/IncomeExpenseTrend';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import InsightsBlock from '@/components/dashboard/InsightsBlock';
import DashboardSources from '@/components/dashboard/DashboardSources';

export const metadata = {
  title: 'Dashboard | Rakam',
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function DashboardPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;
  const { from, to } = parseDateParams(searchParams);

  const { user } = await getUserSession();
  if (!user) return null;

  // Fetch transactions using the central service
  const transactions = await getTransactions(from, to);
  const goals = await getGoals();
  const sources = await getDataSources();
  
  // Math is 100% powered by the single source of truth
  const summary = getFinanceSummary(transactions, goals);
  const breakdown = getByCategory(transactions);
  const trend = getTrend(transactions);

  // Top 5 recent transactions
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 600 }}>Dashboard</h1>
          <p style={{ margin: 0, color: 'var(--color-text)', opacity: 0.7, fontSize: '0.875rem' }}>
            Your financial overview.
          </p>
        </div>
        <PeriodSelector />
      </div>

      {/* Row 1: Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <Card style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Income</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-success)' }}>
            {formatCurrency(summary.totalIncome, 'NPR')}
          </div>
        </Card>
        <Card style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Expenses</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-danger)' }}>
            {formatCurrency(summary.totalExpenses, 'NPR')}
          </div>
        </Card>
        <Card style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Net Surplus</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: summary.surplus >= 0 ? 'var(--color-success)' : 'var(--color-warning)' }}>
            {summary.surplus >= 0 ? '+' : ''}{formatCurrency(summary.surplus, 'NPR')}
          </div>
        </Card>
        <Card style={{ 
          padding: '1.5rem', 
          border: '1px solid var(--color-accent)', 
          background: 'var(--color-surface)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-accent)', marginBottom: '0.5rem' }}>Safe to Invest</div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-accent)' }}>
            {formatCurrency(summary.safeToInvest, 'NPR')}
          </div>
        </Card>
      </div>

      {/* Row 2: Visuals */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <Card>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Income vs Expenses</h3>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <IncomeExpenseTrend data={trend} />
          </div>
        </Card>
        
        <Card>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Expense Breakdown</h3>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <CategoryDonut breakdown={breakdown} />
          </div>
        </Card>
      </div>

      {/* Row 3: Insights and Recent Transactions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <DashboardSources initialSources={sources} />
          <Card>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Automated Insights</h3>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <InsightsBlock transactions={transactions} goals={goals} />
            </div>
          </Card>
        </div>

        <Card>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Recent Transactions</h3>
          </div>
          <div style={{ padding: '1.5rem', paddingTop: '0.5rem' }}>
            <RecentTransactions transactions={recentTransactions} />
          </div>
        </Card>
      </div>
    </div>
  );
}
