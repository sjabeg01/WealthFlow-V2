'use client';

import React, { useState, useEffect } from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { AlertCircle, CheckCircle2, ChevronRight, FileDown } from 'lucide-react';
import type { ImportPreview, ColumnMapping, Account, ParsedRow } from '@/types';
import { reprocessWithMapping } from '@/lib/import/processor';
import { createInlineAccount, checkDuplicates } from '@/app/(app)/import/actions';

interface ImportPreviewUIProps {
  preview: ImportPreview;
  accounts: Account[];
  selectedAccountId: string;
  onAccountChange: (id: string) => void;
  onCommit: (mapping: ColumnMapping) => void;
  onCancel: () => void;
  isCommitting: boolean;
}

export default function ImportPreviewUI({ 
  preview, 
  accounts: initialAccounts, 
  selectedAccountId, 
  onAccountChange,
  onCommit, 
  onCancel, 
  isCommitting 
}: ImportPreviewUIProps) {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [mapping, setMapping] = useState<ColumnMapping>(preview.columnMapping);
  const [isEditingColumns, setIsEditingColumns] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountInstitution, setNewAccountInstitution] = useState('');
  const [newAccountBalance, setNewAccountBalance] = useState('0');
  
  // Local state for reprocessed rows if mapping changes
  const [localPreview, setLocalPreview] = useState<ImportPreview>(preview);

  // Helper to reprocess when mapping changes
  function updateMapping(newMapping: ColumnMapping) {
    setMapping(newMapping);
    const allRows = [...preview.acceptedRows, ...preview.skippedRows].map(r => r.rawData);
    const { acceptedRows, skippedRows } = reprocessWithMapping(allRows, newMapping);
    
    setLocalPreview({
      ...preview,
      columnMapping: newMapping,
      acceptedRows,
      skippedRows
    });
  }

  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);

  useEffect(() => {
    async function runDuplicateCheck() {
      if (!selectedAccountId || localPreview.acceptedRows.length === 0) return;
      setIsCheckingDuplicates(true);
      try {
        const dupIndices = await checkDuplicates(selectedAccountId, localPreview.acceptedRows);
        if (dupIndices.length > 0) {
          const newAccepted: ParsedRow[] = [];
          const newSkipped = [...localPreview.skippedRows];
          let dupCount = localPreview.duplicateCount || 0;

          localPreview.acceptedRows.forEach((row, index) => {
            if (dupIndices.includes(index)) {
              newSkipped.push({ ...row, reason: 'Duplicate' });
              dupCount++;
            } else {
              newAccepted.push(row);
            }
          });

          setLocalPreview(prev => ({
            ...prev,
            acceptedRows: newAccepted,
            skippedRows: newSkipped,
            duplicateCount: dupCount
          }));
        }
      } catch (err) {
        console.error('Failed to check duplicates', err);
      } finally {
        setIsCheckingDuplicates(false);
      }
    }
    runDuplicateCheck();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccountId, mapping]); // Re-run when account or mapping changes

  const { acceptedRows, skippedRows, headers, duplicateCount } = localPreview;

  // Calculate estimated totals
  const estimatedIncome = acceptedRows.filter(r => (r.amount || 0) > 0).reduce((sum, r) => sum + (r.amount || 0), 0);
  const estimatedExpense = acceptedRows.filter(r => (r.amount || 0) < 0).reduce((sum, r) => sum + Math.abs(r.amount || 0), 0);
  const estimatedNet = estimatedIncome - estimatedExpense;

  const handleSelectChange = (key: keyof ColumnMapping, val: string) => {
    updateMapping({ ...mapping, [key]: val === '' ? null : val });
  };

  const handleCreateAccount = async () => {
    if (!newAccountName) return;
    try {
      const newAcc = await createInlineAccount(newAccountName, newAccountInstitution, parseFloat(newAccountBalance));
      setAccounts([...accounts, newAcc]);
      onAccountChange(newAcc.id);
      setIsCreatingAccount(false);
    } catch (err: any) {
      alert(`Error creating account: ${err.message}`);
    }
  };

  const hasLowConfidence = 
    preview.columnMappingConfidence.dateColumn === 'low' ||
    preview.columnMappingConfidence.descriptionColumn === 'low' ||
    preview.columnMappingConfidence.amountColumn === 'low';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Card>
        <CardHeader 
          title="Import Summary" 
          description={`File: ${preview.fileName}`}
          action={
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Button variant="ghost" onClick={onCancel} disabled={isCommitting}>Cancel</Button>
              <Button onClick={() => onCommit(mapping)} loading={isCommitting} disabled={acceptedRows.length === 0 || !selectedAccountId}>
                Import {acceptedRows.length} Rows
              </Button>
            </div>
          }
        />

        {/* Account Selection Section */}
        <div style={{ padding: '0 1.5rem 1.5rem', borderBottom: '1px solid var(--color-border)', marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Select Target Account</label>
          
          {!isCreatingAccount ? (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <select 
                className="input" 
                style={{ maxWidth: '300px' }} 
                value={selectedAccountId} 
                onChange={(e) => onAccountChange(e.target.value)}
                disabled={isCommitting}
              >
                <option value="" disabled>-- Select Account --</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.institution})</option>
                ))}
              </select>
              <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>or</span>
              <Button size="sm" variant="secondary" onClick={() => setIsCreatingAccount(true)} disabled={isCommitting}>Create New Inline</Button>
            </div>
          ) : (
            <div style={{ background: 'var(--color-surface-alt)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Account Name</label>
                <input className="input" value={newAccountName} onChange={e => setNewAccountName(e.target.value)} placeholder="e.g. Everyday" />
              </div>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Institution</label>
                <input className="input" value={newAccountInstitution} onChange={e => setNewAccountInstitution(e.target.value)} placeholder="e.g. CommBank" />
              </div>
              <div style={{ width: '100px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Balance</label>
                <input className="input" type="number" value={newAccountBalance} onChange={e => setNewAccountBalance(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button size="sm" variant="secondary" onClick={() => setIsCreatingAccount(false)}>Cancel</Button>
                <Button size="sm" onClick={handleCreateAccount}>Save Account</Button>
              </div>
            </div>
          )}
          {!selectedAccountId && !isCreatingAccount && (
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: 'var(--color-danger)' }}>
              An account is required to commit the import.
            </p>
          )}
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', marginBottom: '1.5rem', padding: '0 1.5rem' }}>
          <div style={{ background: 'var(--color-surface-alt)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>{acceptedRows.length + skippedRows.length}</div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Rows</div>
          </div>
          <div style={{ background: 'var(--color-success-light)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-success)' }}>{acceptedRows.length}</div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Accepted</div>
          </div>
          <div style={{ background: 'var(--color-danger-light)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-danger)' }}>{skippedRows.length}</div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Skipped</div>
          </div>
          <div style={{ background: 'var(--color-warning-light)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-warning)' }}>
              {isCheckingDuplicates ? '...' : duplicateCount}
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Duplicates</div>
          </div>
          
          <div style={{ background: 'var(--color-surface-alt)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-success)' }}>+${estimatedIncome.toFixed(2)}</div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Est. Income</div>
          </div>
          <div style={{ background: 'var(--color-surface-alt)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-danger)' }}>-${estimatedExpense.toFixed(2)}</div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Est. Expense</div>
          </div>
          <div style={{ background: 'var(--color-surface-alt)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: estimatedNet >= 0 ? 'var(--color-success)' : 'var(--color-warning)' }}>
              {estimatedNet >= 0 ? '+' : '-'}${Math.abs(estimatedNet).toFixed(2)}
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Net Impact</div>
          </div>
        </div>

        <div style={{ padding: '0 1.5rem' }}>
          {hasLowConfidence && !isEditingColumns && (
             <div style={{ background: 'var(--color-warning-light)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '1.5rem', border: '1px solid rgba(217,119,6,0.2)' }}>
               <AlertCircle size={20} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
               <div style={{ flex: 1 }}>
                 <h4 style={{ color: 'var(--color-warning)', margin: '0 0 0.25rem 0', fontSize: '0.875rem' }}>Check Column Mapping</h4>
                 <p style={{ color: 'var(--color-warning)', margin: 0, fontSize: '0.8125rem', opacity: 0.9 }}>
                   We weren&apos;t entirely sure about some columns. Please review the mapping to ensure data imports correctly.
                 </p>
               </div>
               <Button size="sm" variant="secondary" onClick={() => setIsEditingColumns(true)}>Review</Button>
             </div>
          )}

          {isEditingColumns && (
            <div style={{ background: 'var(--color-surface-alt)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>Map Columns</h4>
                <Button size="sm" variant="ghost" onClick={() => setIsEditingColumns(false)}>Hide</Button>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <ColumnSelect label="Date Column" value={mapping.dateColumn} options={headers} onChange={(v) => handleSelectChange('dateColumn', v)} />
                <ColumnSelect label="Description Column" value={mapping.descriptionColumn} options={headers} onChange={(v) => handleSelectChange('descriptionColumn', v)} />
                <ColumnSelect label="Amount Column" value={mapping.amountColumn} options={headers} onChange={(v) => handleSelectChange('amountColumn', v)} />
                <ColumnSelect label="Debit Column (Optional)" value={mapping.debitColumn} options={headers} onChange={(v) => handleSelectChange('debitColumn', v)} />
                <ColumnSelect label="Credit Column (Optional)" value={mapping.creditColumn} options={headers} onChange={(v) => handleSelectChange('creditColumn', v)} />
              </div>
            </div>
          )}
          
          {!isEditingColumns && !hasLowConfidence && (
            <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
               <Button size="sm" variant="ghost" onClick={() => setIsEditingColumns(true)}>Edit Column Mapping</Button>
            </div>
          )}

          {/* Data Table Preview */}
          <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '1.5rem' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: 'var(--color-surface-alt)', textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--color-text-secondary)', width: '60px' }}>Row</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--color-text-secondary)', width: '120px' }}>Date</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Description</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--color-text-secondary)', width: '100px', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {skippedRows.slice(0, 5).map((row, i) => (
                    <tr key={`skip-${i}`} style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-danger-light)' }}>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>{row.rowIndex}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{row.date || <span style={{ color: 'var(--color-danger)' }}>Missing</span>}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{row.description || <span style={{ color: 'var(--color-danger)' }}>Missing</span>}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{row.amount !== null ? row.amount.toFixed(2) : <span style={{ color: 'var(--color-danger)' }}>Missing</span>}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}><Badge variant="danger" title={row.reason}>Skipped</Badge></td>
                    </tr>
                  ))}
                  
                  {acceptedRows.slice(0, 10).map((row, i) => (
                    <tr key={`acc-${i}`} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>{row.rowIndex}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{row.date}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{row.description}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: row.amount! >= 0 ? 'var(--color-success)' : 'inherit' }}>
                        {row.amount! >= 0 ? '+' : ''}{row.amount!.toFixed(2)}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}><Badge variant="success">OK</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(acceptedRows.length > 10 || skippedRows.length > 5) && (
              <div style={{ padding: '0.75rem 1rem', textAlign: 'center', background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>
                Showing a preview. {Math.max(0, acceptedRows.length - 10)} accepted and {Math.max(0, skippedRows.length - 5)} skipped rows not shown.
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

function ColumnSelect({ label, value, options, onChange }: { label: string, value: string | null, options: string[], onChange: (val: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{label}</label>
      <select 
        className="input" 
        style={{ padding: '0.375rem 0.5rem', height: '34px' }} 
        value={value || ''} 
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">-- None --</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

