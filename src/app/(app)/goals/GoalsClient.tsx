'use client';

import { useState, useEffect } from 'react';
import { Target, Plus, Pencil } from 'lucide-react';
import type { Goal } from '@/types';
import GoalModal from '@/components/goals/GoalModal';
import styles from '@/app/(app)/app.module.css';

interface GoalsClientProps {
  initialGoals: Goal[];
}

export default function GoalsClient({ initialGoals }: GoalsClientProps) {
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  useEffect(() => {
    setGoals(initialGoals);
  }, [initialGoals]);

  function handleOpenModal(goal?: Goal) {
    setEditingGoal(goal || null);
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setEditingGoal(null);
  }

  const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0);
  const totalSaved = goals.reduce((sum, g) => sum + g.current_amount, 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
        <button onClick={() => handleOpenModal()} className={styles.btnPrimary} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={16} />
          Add Goal
        </button>
      </div>

      {goals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          <Target size={48} style={{ margin: '0 auto 1.5rem', color: 'var(--color-text-muted)' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.5rem' }}>No goals found</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>You have no goals. Create your first goal to track your progress.</p>
          <button onClick={() => handleOpenModal()} className={styles.btnPrimary}>
            Create your first goal
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Saved</p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--color-text)' }}>
                ${totalSaved.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Target</p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--color-text)' }}>
                ${totalTarget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Overall Progress</p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--color-text)' }}>
                {overallProgress.toFixed(1)}%
              </h3>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {goals.map((goal) => {
              const progress = goal.target_amount > 0 ? Math.min((goal.current_amount / goal.target_amount) * 100, 100) : 0;
              
              return (
                <div key={goal.id} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                  <div style={{ padding: '1.5rem', position: 'relative' }}>
                    <button 
                      onClick={() => handleOpenModal(goal)}
                      style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                    >
                      <Pencil size={16} />
                    </button>
                    
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.25rem', paddingRight: '2rem' }}>{goal.name}</h3>
                    {goal.deadline && (
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                        Target: {new Date(goal.deadline).toLocaleDateString()}
                      </p>
                    )}
                    
                    <div style={{ marginTop: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                        <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>${goal.current_amount.toLocaleString()}</span>
                        <span style={{ color: 'var(--color-text-muted)' }}>of ${goal.target_amount.toLocaleString()}</span>
                      </div>
                      <div style={{ height: '8px', background: 'var(--color-bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: 'var(--color-accent)', width: `${progress}%`, transition: 'width 0.3s ease' }} />
                      </div>
                    </div>
                  </div>
                  {goal.monthly_contribution && goal.monthly_contribution > 0 && (
                    <div style={{ background: 'var(--color-bg-secondary)', padding: '0.75rem 1.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)' }}>
                      Contributing ${goal.monthly_contribution.toLocaleString()}/mo
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {isModalOpen && (
        <GoalModal goal={editingGoal} onClose={handleCloseModal} />
      )}
    </div>
  );
}
