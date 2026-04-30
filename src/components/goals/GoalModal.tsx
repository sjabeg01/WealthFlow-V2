'use client';

import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import styles from '@/app/(app)/app.module.css';
import type { Goal } from '@/types';
import { addGoalAction, editGoalAction, deleteGoalAction } from '@/app/(app)/goals/actions';

interface GoalModalProps {
  goal?: Goal | null;
  onClose: () => void;
}

export default function GoalModal({ goal, onClose }: GoalModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(goal?.name || '');
  const [targetAmount, setTargetAmount] = useState(goal?.target_amount?.toString() || '');
  const [currentAmount, setCurrentAmount] = useState(goal?.current_amount?.toString() || '0');
  const [monthlyContribution, setMonthlyContribution] = useState(goal?.monthly_contribution?.toString() || '');
  const [deadline, setDeadline] = useState(goal?.deadline || '');
  const [notes, setNotes] = useState(goal?.notes || '');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        name,
        target_amount: parseFloat(targetAmount) || 0,
        current_amount: parseFloat(currentAmount) || 0,
        monthly_contribution: monthlyContribution ? parseFloat(monthlyContribution) : null,
        deadline: deadline || null,
        notes: notes || null,
      };

      if (goal) {
        await editGoalAction(goal.id, payload);
      } else {
        await addGoalAction(payload);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save goal');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!goal || !confirm('Are you sure you want to delete this goal?')) return;
    setLoading(true);
    try {
      await deleteGoalAction(goal.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete goal');
      setLoading(false);
    }
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} style={{ maxWidth: '500px' }}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{goal ? 'Edit Goal' : 'Add Goal'}</h2>
          <button onClick={onClose} className={styles.modalClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {error && <div className={styles.formError}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.formGroup} style={{ gap: '1rem', display: 'flex', flexDirection: 'column', marginTop: '1rem' }}>
          <div>
            <label className={styles.formLabel}>Goal Name *</label>
            <input
              type="text"
              className={styles.formInput}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Emergency Fund"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className={styles.formLabel}>Target Amount *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={styles.formInput}
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                required
                placeholder="0.00"
              />
            </div>
            <div>
              <label className={styles.formLabel}>Saved So Far</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={styles.formInput}
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className={styles.formLabel}>Monthly Contribution (Optional)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={styles.formInput}
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className={styles.formLabel}>Target Date (Optional)</label>
              <input
                type="date"
                className={styles.formInput}
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className={styles.formLabel}>Notes (Optional)</label>
            <textarea
              className={styles.formInput}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. For 6 months of expenses"
              rows={2}
            />
          </div>

          <div className={styles.modalFooter} style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {goal ? (
              <button 
                type="button" 
                onClick={handleDelete} 
                className={styles.btnSecondary} 
                style={{ color: 'var(--color-danger)', border: 'none', padding: '0.5rem' }}
                disabled={loading}
              >
                <Trash2 size={18} />
              </button>
            ) : <div></div>}
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" onClick={onClose} className={styles.btnSecondary} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className={styles.btnPrimary} disabled={loading}>
                {loading ? 'Saving...' : 'Save Goal'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
