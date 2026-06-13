import type { Metadata } from 'next';
import styles from '../app.module.css';
import { getDataSources } from '@/lib/dataService';
import DashboardSources from '@/components/dashboard/DashboardSources';

export const metadata: Metadata = { title: 'Data Sources | Rakam' };

export default async function SourcesPage() {
  const sources = await getDataSources();

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Data Sources</h1>
        <p className={styles.pageDescription}>Manage your connected bank accounts and CSV imports.</p>
      </div>

      <div style={{ maxWidth: '800px' }}>
        <DashboardSources initialSources={sources} />
      </div>
    </div>
  );
}
