'use client';

import React, { useState, useRef, useEffect } from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { UploadCloud, FileType, CheckCircle2 } from 'lucide-react';
import { processDataGrid } from '@/lib/import/processor';
import { parseFileToGrid } from '@/lib/import/fileParser';
import ImportPreviewUI from '@/components/import/ImportPreview';
import type { ImportPreview, ColumnMapping, Account } from '@/types';
import { commitImportBatch } from './actions';
import { useRouter } from 'next/navigation';
import styles from '../app.module.css';

interface ImportClientProps {
  initialAccounts: Account[];
}

export default function ImportClient({ initialAccounts }: ImportClientProps) {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Account Selection
  const [accounts] = useState<Account[]>(initialAccounts.filter(a => a.is_active));
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts.length > 0 ? accounts[0].id : '');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setError(null);
    setIsProcessing(true);

    try {
      const { grid, fileType } = await parseFileToGrid(file);
      const result = processDataGrid(grid, file.name, fileType);
      setPreview(result);
    } catch (err: any) {
      setError(err.message || 'Error processing file');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const [isCommitting, setIsCommitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleCommit = async (finalMapping: ColumnMapping) => {
    if (!preview) return;
    if (!selectedAccountId) {
      setError('Please select an account before importing.');
      return;
    }

    setIsCommitting(true);
    setError(null);

    try {
      // Re-apply final mapping one last time
      const { reprocessWithMapping } = await import('@/lib/import/processor');
      const allRows = [...preview.acceptedRows, ...preview.skippedRows].map(r => r.rawData);
      const { acceptedRows } = reprocessWithMapping(allRows, finalMapping);
      
      await commitImportBatch(selectedAccountId, preview, acceptedRows);
      
      setIsSuccess(true);
    } catch (err: any) {
      setError(`Failed to save import: ${err.message}`);
    } finally {
      setIsCommitting(false);
    }
  };

  const resetState = () => {
    setPreview(null);
    setIsSuccess(false);
    setError(null);
  };

  if (isSuccess) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', paddingTop: '4rem' }}>
        <CheckCircle2 size={64} color="var(--color-success)" style={{ margin: '0 auto 1.5rem' }} />
        <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, marginBottom: '0.5rem' }}>Import Successful!</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
          Your transactions have been successfully analyzed and saved.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Button variant="secondary" onClick={resetState}>Import Another</Button>
          <Button onClick={() => router.push('/transactions')}>View Transactions</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Import Transactions</h1>
        <p className={styles.pageDescription}>
          Upload CSV or Excel (.xlsx) bank statements. You’ll review and confirm transactions before they are saved.
          <br/>
          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Your file is parsed locally first for review before import.</span>
        </p>
      </div>

      {error && (
        <div style={{ background: 'var(--color-danger-light)', color: 'var(--color-danger)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid rgba(220,38,38,0.2)' }}>
          {error}
        </div>
      )}

      <div style={{ maxWidth: '800px' }}>
        {!preview ? (
          <Card>
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${isDragging ? 'var(--color-accent)' : 'var(--color-border-strong)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: '4rem 2rem',
                textAlign: 'center',
                background: isDragging ? 'var(--color-accent-light)' : 'var(--color-surface)',
                transition: 'all var(--transition-fast)',
                cursor: 'pointer',
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud size={48} color={isDragging ? 'var(--color-accent)' : 'var(--color-text-muted)'} style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
                Click or drag your bank statement here
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Supports CSV and Excel (.xlsx) files.
              </p>
              
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                <span style={{ background: 'var(--color-surface-alt)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>CSV</span>
                <span style={{ background: 'var(--color-surface-alt)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>XLSX</span>
              </div>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept=".csv, .xlsx, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
                onChange={handleFileSelect}
              />
            </div>
            {isProcessing && (
              <p style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                Analyzing file...
              </p>
            )}
          </Card>
        ) : (
          <ImportPreviewUI 
            preview={preview} 
            accounts={accounts}
            selectedAccountId={selectedAccountId}
            onAccountChange={setSelectedAccountId}
            onCommit={handleCommit} 
            onCancel={resetState} 
            isCommitting={isCommitting}
          />
        )}
      </div>
    </div>
  );
}
