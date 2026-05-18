import type { Metadata } from 'next';
import styles from '../app.module.css';
import { getInvestments } from '@/lib/dataService';
import InvestmentsClient from './InvestmentsClient';

export const metadata: Metadata = { title: 'Investments | Rakam' };

export default async function InvestmentsPage() {
  const investments = await getInvestments();

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Investments</h1>
        <p className={styles.pageDescription}>Track your manual portfolio holdings and performance.</p>
      </div>

      <InvestmentsClient initialInvestments={investments} />
    </div>
  );
}
