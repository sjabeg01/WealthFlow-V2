'use client';

import React from 'react';
import { Plus, Settings2, RefreshCcw, Landmark, Upload } from 'lucide-react';
import type { DataSource } from '@/types';
import StatusDot, { StatusColor } from '@/components/ui/StatusDot';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

export interface DataSourcesPanelProps {
  sources: DataSource[];
  loading?: boolean;
  onAddSource: () => void;
  onSourceClick: (source: DataSource) => void;
}

export default function DataSourcesPanel({ sources, loading, onAddSource, onSourceClick }: DataSourcesPanelProps) {
  const router = useRouter();

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        Loading sources...
      </div>
    );
  }

  const getStatusColor = (status: DataSource['status'], syncStatus?: DataSource['lastSyncStatus']): StatusColor => {
    if (status === 'disconnected' || status === 'error') return 'red';
    if (status === 'syncing') return 'yellow';
    if (syncStatus === 'failed') return 'red';
    if (syncStatus === 'partial') return 'yellow';
    return 'green';
  };

  const getStatusText = (source: DataSource) => {
    if (source.status === 'syncing') return 'Syncing now...';
    if (source.status === 'error' || source.status === 'disconnected') return 'Connection error';
    if (source.lastSyncAt) return `Synced ${formatDistanceToNow(new Date(source.lastSyncAt), { addSuffix: true })}`;
    return 'Active';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Connected Data Sources</h3>
        <button 
          onClick={onAddSource}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)',
            padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)',
            color: 'var(--color-text)', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 500
          }}
        >
          <Plus size={16} /> Add Source
        </button>
      </div>

      {sources.length === 0 ? (
        <div style={{
          padding: '2rem', textAlign: 'center', background: 'var(--color-surface-alt)',
          border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-lg)'
        }}>
          <div style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>No data sources connected yet.</div>
          <button 
            onClick={onAddSource}
            style={{
              padding: '0.5rem 1rem', background: 'var(--color-accent)', color: 'white',
              border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer'
            }}
          >
            Connect your first source
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {sources.map(source => (
            <div 
              key={source.id}
              onClick={() => onSourceClick(source)}
              style={{
                display: 'flex', alignItems: 'center', padding: '1rem',
                background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)', cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.borderColor = 'var(--color-accent)'}
              onMouseOut={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
            >
              <div style={{ 
                width: '40px', height: '40px', borderRadius: '10px',
                background: source.type === 'csv' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(168, 85, 247, 0.1)',
                color: source.type === 'csv' ? '#60a5fa' : '#c084fc',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem'
              }}>
                {source.type === 'csv' ? <Upload size={20} /> : <Landmark size={20} />}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 600 }}>{source.label}</span>
                  <StatusDot 
                    color={getStatusColor(source.status, source.lastSyncStatus)} 
                    animate={source.status === 'syncing'} 
                  />
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                  {getStatusText(source)} • {source.transactionCount} transactions
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); onSourceClick(source); }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: '0.5rem' }}
                  title="Settings"
                >
                  <Settings2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
