'use client';

import { useState } from 'react';
import type { ImportBatch } from '@/types';
import { Trash2, FileText, Calendar } from 'lucide-react';
import { deleteImportBatch } from '@/app/(app)/import/actions';
import { useRouter } from 'next/navigation';

interface ImportHistoryProps {
  initialHistory: ImportBatch[];
}

export default function ImportHistory({ initialHistory }: ImportHistoryProps) {
  const router = useRouter();
  const [history, setHistory] = useState<ImportBatch[]>(initialHistory);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (batchId: string) => {
    if (!confirm('Are you sure you want to undo this import? All associated transactions will be deleted.')) return;
    
    setIsDeleting(batchId);
    try {
      await deleteImportBatch(batchId);
      setHistory(prev => prev.filter(b => b.id !== batchId));
      router.refresh();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsDeleting(null);
    }
  };

  if (history.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
        No import history found.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {history.map((batch) => (
        <div 
          key={batch.id} 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '1rem',
            background: 'var(--color-bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)'
          }}
        >
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: 'var(--radius-sm)', 
              background: 'var(--color-surface)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '1px solid var(--color-border)'
            }}>
              <FileText size={20} color="var(--color-accent)" />
            </div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.9375rem' }}>
                {batch.file_name}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Calendar size={12} /> {new Date(batch.imported_at).toLocaleDateString()}
                </span>
                <span>• {batch.rows_accepted} transactions</span>
                <span>• {batch.file_type.toUpperCase()}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => handleDelete(batch.id)}
            disabled={isDeleting === batch.id}
            style={{ 
              padding: '0.5rem', 
              borderRadius: 'var(--radius-sm)', 
              border: '1px solid var(--color-border)', 
              background: 'transparent',
              color: 'var(--color-danger)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem'
            }}
          >
            <Trash2 size={16} />
            {isDeleting === batch.id ? 'Deleting...' : 'Undo'}
          </button>
        </div>
      ))}
    </div>
  );
}
