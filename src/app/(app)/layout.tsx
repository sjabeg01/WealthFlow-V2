import { createClient } from '@/lib/supabase/server';
import { isDemoModeActive, getUserSession, hasAnySources } from '@/lib/dataService';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Sidebar from '@/components/layout/Sidebar';
import DemoBanner from '@/components/layout/DemoBanner';
import SetupWizardWrapper from '@/components/sources/SetupWizardWrapper';
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

  const cookieStore = await cookies();
  const setupDismissed = cookieStore.get('rakam_setup_dismissed')?.value === 'true';
  const hasSources = await hasAnySources();
  const showWizard = !setupDismissed && !hasSources;

  return (
    <div className={styles.shell}>
      {showWizard && <SetupWizardWrapper />}
      <Sidebar />
      <div className={styles.main}>
        <DemoBanner visible={isDemo} />
        <main className={styles.pageContent}>{children}</main>
      </div>
    </div>
  );
}
