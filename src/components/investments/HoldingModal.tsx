'use client';

import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import styles from '@/app/(app)/app.module.css';
import type { Investment, AssetType } from '@/types';
import { addInvestmentAction, editInvestmentAction, deleteInvestmentAction } from '@/app/(app)/investments/actions';

interface HoldingModalProps {
  investment?: Investment | null;
  onClose: () => void;
}

export default function HoldingModal({ investment, onClose }: HoldingModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(investment?.name || '');
  const [ticker, setTicker] = useState(investment?.ticker || '');
  const [assetType, setAssetType] = useState<AssetType>(investment?.asset_type || 'stock');
  const [units, setUnits] = useState(investment?.units?.toString() || '');
  const [avgCost, setAvgCost] = useState(investment?.avg_cost?.toString() || '');
  const [currentPrice, setCurrentPrice] = useState(investment?.current_price?.toString() || '');
  const [notes, setNotes] = useState(investment?.notes || '');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: Partial<Investment> = {
        name,
        ticker: ticker || null,
        asset_type: assetType,
        units: units ? parseFloat(units) : null,
        avg_cost: avgCost ? parseFloat(avgCost) : null,
        current_price: currentPrice ? parseFloat(currentPrice) : null,
        notes: notes || null,
      };

      if (investment) {
        await editInvestmentAction(investment.id, payload);
      } else {
        await addInvestmentAction(payload);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save holding');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!investment || !confirm('Are you sure you want to delete this holding?')) return;
    setLoading(true);
    try {
      await deleteInvestmentAction(investment.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete holding');
      setLoading(false);
    }
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} style={{ maxWidth: '500px' }}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{investment ? 'Edit Holding' : 'Add Holding'}</h2>
          <button onClick={onClose} className={styles.modalClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {error && <div className={styles.formError}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.formGroup} style={{ gap: '1rem', display: 'flex', flexDirection: 'column', marginTop: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
            <div>
              <label className={styles.formLabel}>Ticker (Optional)</label>
              <input
                type="text"
                className={styles.formInput}
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="e.g. AAPL"
              />
            </div>
            <div>
              <label className={styles.formLabel}>Asset Name *</label>
              <input
                type="text"
                className={styles.formInput}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Apple Inc."
              />
            </div>
          </div>

          <div>
            <label className={styles.formLabel}>Asset Type *</label>
            <select
              className={styles.formSelect}
              value={assetType}
              onChange={(e) => setAssetType(e.target.value as AssetType)}
              required
            >
              <option value="stock">Stock</option>
              <option value="etf">ETF / Mutual Fund</option>
              <option value="bond">Bond</option>
              <option value="property">Real Estate</option>
              <option value="cash">Cash / Term Deposit</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label className={styles.formLabel}>Units</label>
              <input
                type="number"
                step="any"
                min="0"
                className={styles.formInput}
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className={styles.formLabel}>Avg Cost</label>
              <input
                type="number"
                step="any"
                min="0"
                className={styles.formInput}
                value={avgCost}
                onChange={(e) => setAvgCost(e.target.value)}
                placeholder="$0.00"
              />
            </div>
            <div>
              <label className={styles.formLabel}>Current Price</label>
              <input
                type="number"
                step="any"
                min="0"
                className={styles.formInput}
                value={currentPrice}
                onChange={(e) => setCurrentPrice(e.target.value)}
                placeholder="$0.00"
              />
            </div>
          </div>

          <div>
            <label className={styles.formLabel}>Notes (Optional)</label>
            <textarea
              className={styles.formInput}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Employee stock purchase plan"
              rows={2}
            />
          </div>

          <div className={styles.modalFooter} style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {investment ? (
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
                {loading ? 'Saving...' : 'Save Holding'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
