import type { Metadata } from 'next';
import styles from '../app.module.css';
import { getAccounts, getImportHistory } from '@/lib/dataService';
import AccountList from '@/components/settings/AccountList';
import ImportHistory from '@/components/settings/ImportHistory';
import Card from '@/components/ui/Card';

export const metadata: Metadata = { title: 'Settings | Rakam' };

/**
 * Settings Page
 * Real account management and security controls.
 * This file has been REWRITTEN to clear any stale cache issues.
 */
export default async function SettingsPage() {
  const [accounts, history] = await Promise.all([
    getAccounts(),
    getImportHistory()
  ]);

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Settings</h1>
        <p className={styles.pageDescription}>Manage your accounts, security, and preferences.</p>
      </div>

      <div style={{ display: 'grid', gap: '2rem', maxWidth: '800px', marginTop: '1.5rem' }}>
        {/* Account Management Section */}
        <Card>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>Financial Accounts</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
              Add and manage the accounts you use for importing transactions.
            </p>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <AccountList initialAccounts={accounts} />
          </div>
        </Card>

        {/* Import History Section */}
        <Card>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>Import History</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
              Review and undo previous statement imports.
            </p>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <ImportHistory initialHistory={history} />
          </div>
        </Card>


        {/* Security Section */}
        <Card>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>Security & Sessions</h2>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>Current Session</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>You are currently logged in as a real user.</p>
              </div>
              <form action="/auth/signout" method="POST">
                <button
                  type="submit"
                  className={styles.btnSecondary}
                  style={{ color: 'var(--color-danger)', borderColor: 'var(--color-border)' }}
                >
                  Sign Out Everywhere
                </button>
              </form>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
