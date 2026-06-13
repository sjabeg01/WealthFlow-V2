'use client';

import React, { useEffect, useState } from 'react';
import StatusDot, { StatusColor } from '@/components/ui/StatusDot';
import type { DataSource } from '@/types';
import { formatDistanceToNow } from 'date-fns';

export interface SyncStatusIndicatorProps {
  sources: DataSource[];
}

export default function SyncStatusIndicator({ sources }: SyncStatusIndicatorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Determine overall status
  let overallColor: StatusColor = 'gray';
  let overallText = 'No sources';

  if (sources.length > 0) {
    const hasSyncing = sources.some(s => s.status === 'syncing');
    const hasErrors = sources.some(s => s.status === 'error' || s.status === 'disconnected' || s.lastSyncStatus === 'failed');
    
    if (hasSyncing) {
      overallColor = 'yellow';
      overallText = 'Syncing...';
    } else if (hasErrors) {
      overallColor = 'red';
      overallText = 'Sync error';
    } else {
      overallColor = 'green';
      
      // Find most recent sync
      const sortedBySync = [...sources]
        .filter(s => s.lastSyncAt)
        .sort((a, b) => new Date(b.lastSyncAt!).getTime() - new Date(a.lastSyncAt!).getTime());
        
      if (sortedBySync.length > 0) {
        overallText = `Synced ${formatDistanceToNow(new Date(sortedBySync[0].lastSyncAt!), { addSuffix: true })}`;
      } else {
        overallText = 'Up to date';
      }
    }
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem',
      borderRadius: 'var(--radius-md)',
      background: 'var(--color-surface-alt)',
      fontSize: '0.75rem',
      color: 'var(--color-text-secondary)',
      border: '1px solid var(--color-border)',
      marginTop: 'auto'
    }}>
      <StatusDot color={overallColor} animate={overallColor === 'yellow'} />
      <span style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {overallText}
      </span>
    </div>
  );
}
