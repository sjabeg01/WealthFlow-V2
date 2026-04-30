'use client';

import { useState, useEffect } from 'react';
import { Plus, Building2, CreditCard, PiggyBank, Briefcase, HelpCircle, Pencil } from 'lucide-react';
import type { Account, AccountType } from '@/types';
import AccountModal from './AccountModal';
import styles from '@/app/(app)/app.module.css';

interface AccountListProps {
  initialAccounts: Account[];
}

const TYPE_ICONS: Record<AccountType, any> = {
  checking: Building2,
  savings: PiggyBank,
  credit: CreditCard,
  investment: Briefcase,
  other: HelpCircle,
};

export default function AccountList({ initialAccounts }: AccountListProps) {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setAccounts(initialAccounts);
  }, [initialAccounts]);

  function handleOpenModal(account?: Account) {
    setEditingAccount(account || null);
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setEditingAccount(null);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--color-text)' }}>Your Accounts</h3>
        <button onClick={() => handleOpenModal()} className={styles.btnPrimary} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={16} />
          Add Account
        </button>
      </div>

      {accounts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)' }}>
          <Building2 size={40} style={{ margin: '0 auto 1rem', color: 'var(--color-text-muted)' }} />
          <p style={{ color: 'var(--color-text)', fontWeight: 500, marginBottom: '0.5rem' }}>No accounts found</p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Add your first account to start importing transactions.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {accounts.map((acc) => {
            const Icon = TYPE_ICONS[acc.type] || TYPE_ICONS.other;
            return (
              <div 
                key={acc.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '1rem', 
                  border: '1px solid var(--color-border)', 
                  borderRadius: 'var(--radius-md)',
                  opacity: acc.is_active ? 1 : 0.6
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-full)', background: 'var(--color-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 500, color: 'var(--color-text)' }}>
                      {acc.name} {!acc.is_active && <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--color-text-muted)', marginLeft: '0.5rem', background: 'var(--color-bg-secondary)', padding: '2px 6px', borderRadius: '4px' }}>Inactive</span>}
                    </h4>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                      {acc.institution} {acc.last4 ? `•••• ${acc.last4}` : ''}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => handleOpenModal(acc)}
                  className={styles.btnSecondary}
                  style={{ padding: '0.5rem', border: 'none' }}
                  aria-label="Edit account"
                >
                  <Pencil size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <AccountModal account={editingAccount} onClose={handleCloseModal} />
      )}
    </div>
  );
}
