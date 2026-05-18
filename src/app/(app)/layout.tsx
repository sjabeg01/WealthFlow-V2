import { createClient } from '@/lib/supabase/server';
import { isDemoModeActive, getUserSession } from '@/lib/dataService';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import DemoBanner from '@/components/layout/DemoBanner';
import styles from './app.module.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rakam',
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDemo = await isDemoModeActive();
  
  if (!isDemo) {
    const { user } = await getUserSession();
    if (!user) {
      redirect('/login');
    }
  }

  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.main}>
        <DemoBanner visible={isDemo} />
        <main className={styles.pageContent}>{children}</main>
      </div>
    </div>
  );
}
