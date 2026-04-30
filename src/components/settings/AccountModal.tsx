'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import styles from '@/app/(app)/app.module.css';
import type { Account, AccountType } from '@/types';
import { addAccountAction, editAccountAction } from '@/app/(app)/settings/actions';

interface AccountModalProps {
  account?: Account | null;
  onClose: () => void;
}

export default function AccountModal({ account, onClose }: AccountModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(account?.name || '');
  const [type, setType] = useState<AccountType>(account?.type || 'checking');
  const [institution, setInstitution] = useState(account?.institution || '');
  const [last4, setLast4] = useState(account?.last4 || '');
  const [isActive, setIsActive] = useState(account ? account.is_active : true);
  const [notes, setNotes] = useState(account?.notes || '');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        name,
        type,
        institution: institution || null,
        last4: last4 || null,
        is_active: isActive,
        notes: notes || null,
      };

      if (account) {
        await editAccountAction(account.id, payload);
      } else {
        await addAccountAction(payload);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} style={{ maxWidth: '400px' }}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{account ? 'Edit Account' : 'Add Account'}</h2>
          <button onClick={onClose} className={styles.modalClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {error && <div className={styles.formError}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.formGroup} style={{ gap: '1rem', display: 'flex', flexDirection: 'column', marginTop: '1rem' }}>
          <div>
            <label className={styles.formLabel}>Account Name *</label>
            <input
              type="text"
              className={styles.formInput}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Everyday Checking"
            />
          </div>

          <div>
            <label className={styles.formLabel}>Account Type *</label>
            <select
              className={styles.formSelect}
              value={type}
              onChange={(e) => setType(e.target.value as AccountType)}
              required
            >
              <option value="checking">Checking / Everyday</option>
              <option value="savings">Savings</option>
              <option value="credit">Credit Card</option>
              <option value="investment">Investment / Brokerage</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className={styles.formLabel}>Institution (Optional)</label>
            <input
              type="text"
              className={styles.formInput}
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="e.g. Commonwealth Bank"
            />
          </div>

          <div>
            <label className={styles.formLabel}>Last 4 Digits (Optional)</label>
            <input
              type="text"
              className={styles.formInput}
              value={last4}
              onChange={(e) => setLast4(e.target.value)}
              maxLength={4}
              placeholder="e.g. 1234"
            />
          </div>

          <div>
            <label className={styles.formLabel}>Notes (Optional)</label>
            <input
              type="text"
              className={styles.formInput}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Joint account with spouse"
            />
          </div>

          {account && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input
                type="checkbox"
                id="is_active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <label htmlFor="is_active" style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                Account is active
              </label>
            </div>
          )}

          <div className={styles.modalFooter} style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" onClick={onClose} className={styles.btnSecondary} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? 'Saving...' : 'Save Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
