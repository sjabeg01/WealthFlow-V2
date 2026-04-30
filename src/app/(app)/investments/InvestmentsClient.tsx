'use client';

import { useState, useEffect } from 'react';
import { Briefcase, Plus, Pencil, TrendingUp, TrendingDown } from 'lucide-react';
import type { Investment } from '@/types';
import HoldingModal from '@/components/investments/HoldingModal';
import styles from '@/app/(app)/app.module.css';

interface InvestmentsClientProps {
  initialInvestments: Investment[];
}

export default function InvestmentsClient({ initialInvestments }: InvestmentsClientProps) {
  const [investments, setInvestments] = useState<Investment[]>(initialInvestments);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);

  useEffect(() => {
    setInvestments(initialInvestments);
  }, [initialInvestments]);

  function handleOpenModal(investment?: Investment) {
    setEditingInvestment(investment || null);
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setEditingInvestment(null);
  }

  // Calculations
  const totalCostBasis = investments.reduce((sum, inv) => {
    if (inv.units != null && inv.avg_cost != null) return sum + (inv.units * inv.avg_cost);
    return sum;
  }, 0);

  const totalMarketValue = investments.reduce((sum, inv) => {
    if (inv.units != null && inv.current_price != null) return sum + (inv.units * inv.current_price);
    if (inv.units != null && inv.avg_cost != null) return sum + (inv.units * inv.avg_cost); // Fallback to cost if no price
    return sum;
  }, 0);

  const totalGainLoss = totalMarketValue - totalCostBasis;
  const gainLossPercentage = totalCostBasis > 0 ? (totalGainLoss / totalCostBasis) * 100 : 0;
  const isPositive = totalGainLoss >= 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
        <button onClick={() => handleOpenModal()} className={styles.btnPrimary} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={16} />
          Add Holding
        </button>
      </div>

      {investments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          <Briefcase size={48} style={{ margin: '0 auto 1.5rem', color: 'var(--color-text-muted)' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.5rem' }}>No investments found</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>You haven&apos;t added any holdings yet. Add your first asset to track your portfolio.</p>
          <button onClick={() => handleOpenModal()} className={styles.btnPrimary}>
            Add your first holding
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Invested (Cost)</p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--color-text)' }}>
                ${totalCostBasis.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Market Value</p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--color-text)' }}>
                ${totalMarketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Gain / Loss</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 600, color: isPositive ? 'var(--color-success)' : 'var(--color-danger)' }}>
                  {isPositive ? '+' : '-'}${Math.abs(totalGainLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <span style={{ fontSize: '1rem', fontWeight: 500, color: isPositive ? 'var(--color-success)' : 'var(--color-danger)', display: 'flex', alignItems: 'center' }}>
                  {isPositive ? <TrendingUp size={16} style={{ marginRight: '0.25rem' }}/> : <TrendingDown size={16} style={{ marginRight: '0.25rem' }}/>}
                  {Math.abs(gainLossPercentage).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Type</th>
                  <th style={{ textAlign: 'right' }}>Units</th>
                  <th style={{ textAlign: 'right' }}>Avg Cost</th>
                  <th style={{ textAlign: 'right' }}>Price</th>
                  <th style={{ textAlign: 'right' }}>Total Value</th>
                  <th style={{ width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {investments.map((inv) => {
                  const hasValues = inv.units != null && inv.current_price != null;
                  const totalValue = hasValues ? (inv.units! * inv.current_price!) : (inv.units != null && inv.avg_cost != null ? inv.units * inv.avg_cost : null);
                  
                  return (
                    <tr key={inv.id}>
                      <td>
                        <div style={{ fontWeight: 500, color: 'var(--color-text)' }}>{inv.ticker || inv.name}</div>
                        {inv.ticker && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{inv.name}</div>}
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>{inv.asset_type}</td>
                      <td style={{ textAlign: 'right' }}>{inv.units?.toLocaleString(undefined, { maximumFractionDigits: 6 }) || '-'}</td>
                      <td style={{ textAlign: 'right' }}>{inv.avg_cost ? `$${inv.avg_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}` : '-'}</td>
                      <td style={{ textAlign: 'right' }}>{inv.current_price ? `$${inv.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}` : '-'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 500 }}>{totalValue ? `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}</td>
                      <td>
                        <button 
                          onClick={() => handleOpenModal(inv)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '0.25rem' }}
                        >
                          <Pencil size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {isModalOpen && (
        <HoldingModal investment={editingInvestment} onClose={handleCloseModal} />
      )}
    </div>
  );
}
