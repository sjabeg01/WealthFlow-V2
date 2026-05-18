import type { Metadata } from 'next';
import styles from '../app.module.css';
import { getGoals } from '@/lib/dataService';
import GoalsClient from './GoalsClient';

export const metadata: Metadata = { title: 'Goals | Rakam' };

export default async function GoalsPage() {
  const goals = await getGoals();

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Goals</h1>
        <p className={styles.pageDescription}>Track your savings and financial targets.</p>
      </div>

      <GoalsClient initialGoals={goals} />
    </div>
  );
}
