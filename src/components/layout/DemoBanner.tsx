'use client';

import { disableDemoMode } from '@/app/actions';
import { X, PlayCircle } from 'lucide-react';
import styles from '@/app/(app)/app.module.css';

interface DemoBannerProps {
  visible: boolean;
}

export default function DemoBanner({ visible }: DemoBannerProps) {
  if (!visible) return null;

  return (
    <div className={styles.demoBanner} role="alert" aria-label="Demo mode active">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <PlayCircle size={16} />
        <span className={styles.demoBannerText}>
          <strong>Demo Mode Active:</strong> You are exploring Rakam with a curated financial dataset.
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          onClick={() => disableDemoMode()} 
          style={{ 
            background: 'rgba(255, 255, 255, 0.15)', 
            color: 'white', 
            padding: '0.25rem 0.75rem', 
            borderRadius: 'var(--radius-full)',
            fontSize: '0.75rem',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)')}
        >
          Exit Demo
        </button>
      </div>
    </div>
  );
}
