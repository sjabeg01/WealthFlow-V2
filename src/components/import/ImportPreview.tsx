'use client';

import React, { useState, useEffect } from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { AlertCircle, CheckCircle2, ChevronRight, FileDown } from 'lucide-react';
import type { ImportPreview, ColumnMapping, Account, ParsedRow, Category } from '@/types';
import { reprocessWithMapping } from '@/lib/import/processor';
import { createInlineAccount, checkDuplicates } from '@/app/(app)/import/actions';
import { MAPPABLE_COLUMNS } from '@/lib/importPipeline/columnConfig';
import { deriveFinalType, type ClassificationContext, type FinalType } from '@/lib/importPipeline/deriveFinalType';
import { normalizeAmount } from '@/lib/importPipeline/normalizeAmount';
import { cleanMerchant } from '@/lib/normalization';

interface ImportPreviewUIProps {
  preview: ImportPreview;
  accounts: Account[];
  selectedAccountId: string;
  onAccountChange: (id: string) => void;
  onCommit: (mapping: ColumnMapping) => void;
  onCancel: () => void;
  isCommitting: boolean;
  categories: Category[];
}

export default function ImportPreviewUI({ 
  preview, 
  accounts: initialAccounts, 
  selectedAccountId, 
  onAccountChange,
  onCommit, 
  onCancel, 
  isCommitting,
  categories
}: ImportPreviewUIProps) {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [mapping, setMapping] = useState<ColumnMapping>(preview.columnMapping);
  
  const hasLowConfidence = 
    preview.columnMappingConfidence.dateColumn === 'low' ||
    preview.columnMappingConfidence.descriptionColumn === 'low' ||
    preview.columnMappingConfidence.amountColumn === 'low';

  const [isEditingColumns, setIsEditingColumns] = useState(hasLowConfidence);
  const [hasConfirmedMapping, setHasConfirmedMapping] = useState(!hasLowConfidence);
  
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountInstitution, setNewAccountInstitution] = useState('');
  const [newAccountBalance, setNewAccountBalance] = useState('0');

  // Client-side template persistence state
  const [templateName, setTemplateName] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);
  
  // Local state for reprocessed rows if mapping changes
  const [localPreview, setLocalPreview] = useState<ImportPreview>(preview);

  // Load templates from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rakam_import_templates');
      if (saved) {
        try {
          setTemplates(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  // Save ColumnMapping Template helper
  const saveTemplate = () => {
    if (!templateName.trim()) return;
    const newTemplate = {
      name: templateName.trim(),
      headers: preview.headers,
      mapping: mapping
    };
    const updated = [...templates.filter(t => t.name !== newTemplate.name), newTemplate];
    localStorage.setItem('rakam_import_templates', JSON.stringify(updated));
    setTemplates(updated);
    setTemplateName('');
    alert(`Template "${newTemplate.name}" saved successfully!`);
  };

  // Apply template helper
  const applyTemplate = (tmpl: any) => {
    updateMapping(tmpl.mapping);
    setHasConfirmedMapping(true);
  };

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
    setHasConfirmedMapping(false); // Reset confirmation so they confirm new custom mapping
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Card>
        <CardHeader 
          title="Import Summary" 
          description={`File: ${preview.fileName}`}
          action={
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Button variant="ghost" onClick={onCancel} disabled={isCommitting}>Cancel</Button>
              <Button 
                onClick={() => onCommit(mapping)} 
                loading={isCommitting} 
                disabled={acceptedRows.length === 0 || !selectedAccountId || (!hasConfirmedMapping && hasLowConfidence)}
              >
                Import {acceptedRows.length} Rows
              </Button>
            </div>
          }
        />

        {/* Warnings Display Section */}
        {localPreview.warnings && localPreview.warnings.length > 0 && (
          <div style={{ padding: '0 1.5rem 1rem' }}>
            {localPreview.warnings.map((w, idx) => (
              <div key={idx} style={{ background: 'var(--color-warning-light)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '0.5rem', border: '1px solid rgba(217,119,6,0.15)' }}>
                <AlertCircle size={18} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ color: 'var(--color-warning)', margin: 0, fontSize: '0.8125rem', fontWeight: 500 }}>
                  {w}
                </p>
              </div>
            ))}
          </div>
        )}

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
                 <h4 style={{ color: 'var(--color-warning)', margin: '0 0 0.25rem 0', fontSize: '0.875rem' }}>Check Column Mapping Required</h4>
                 <p style={{ color: 'var(--color-warning)', margin: 0, fontSize: '0.8125rem', opacity: 0.9 }}>
                   Confidence in auto-detection is low. Please manually map the columns and confirm them before proceeding.
                 </p>
               </div>
               <Button size="sm" variant="secondary" onClick={() => setIsEditingColumns(true)}>Map Now</Button>
             </div>
          )}

          {isEditingColumns && (
            <div style={{ background: 'var(--color-surface-alt)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>Map Columns</h4>
                {!hasLowConfidence && <Button size="sm" variant="ghost" onClick={() => setIsEditingColumns(false)}>Hide</Button>}
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                <ColumnSelect label="Date Column" value={mapping.dateColumn} options={headers} onChange={(v) => handleSelectChange('dateColumn', v)} />
                <ColumnSelect label="Description Column" value={mapping.descriptionColumn} options={headers} onChange={(v) => handleSelectChange('descriptionColumn', v)} />
                <ColumnSelect label="Amount Column" value={mapping.amountColumn} options={headers} onChange={(v) => handleSelectChange('amountColumn', v)} />
                <ColumnSelect label="Debit Amount (Money Out)" value={mapping.debitColumn} options={headers} onChange={(v) => handleSelectChange('debitColumn', v)} />
                <ColumnSelect label="Credit Amount (Money In)" value={mapping.creditColumn} options={headers} onChange={(v) => handleSelectChange('creditColumn', v)} />
                <ColumnSelect label="Transaction Type / Direction" value={mapping.transactionDirectionColumn ?? null} options={headers} onChange={(v) => handleSelectChange('transactionDirectionColumn', v)} />
                <ColumnSelect label="Category (Bank-Provided)" value={mapping.categoryHintColumn ?? null} options={headers} onChange={(v) => handleSelectChange('categoryHintColumn', v)} />
                <ColumnSelect label="Account Column (Optional)" value={mapping.accountColumn ?? null} options={headers} onChange={(v) => handleSelectChange('accountColumn', v)} />
              </div>

              {/* Template Saving / Loading UI */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input 
                    className="input" 
                    style={{ maxWidth: '200px', height: '34px', padding: '0 0.5rem' }} 
                    placeholder="e.g. My Bank Layout" 
                    value={templateName} 
                    onChange={e => setTemplateName(e.target.value)} 
                  />
                  <Button size="sm" onClick={saveTemplate} disabled={!templateName.trim()}>Save Template</Button>
                </div>
                {templates.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Apply Saved Template:</span>
                    <select 
                      className="input" 
                      style={{ maxWidth: '200px', height: '34px', padding: '0 0.5rem' }} 
                      onChange={e => {
                        const t = templates.find(temp => temp.name === e.target.value);
                        if (t) applyTemplate(t);
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>-- Select Template --</option>
                      {templates.map(t => (
                        <option key={t.name} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Force mapping confirmation button for low confidence */}
              {hasLowConfidence && (
                <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '1rem', paddingTop: '1rem', textAlign: 'right' }}>
                  <Button size="sm" variant={hasConfirmedMapping ? 'secondary' : 'primary'} onClick={() => {
                    setHasConfirmedMapping(true);
                    setIsEditingColumns(false);
                  }}>
                    {hasConfirmedMapping ? 'Mapping Confirmed ✓' : 'Confirm Column Mapping'}
                  </Button>
                </div>
              )}
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
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--color-text-secondary)', width: '180px' }}>Category Preview</th>
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
                      <td style={{ padding: '0.75rem 1rem' }}>-</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{row.amount !== null ? row.amount.toFixed(2) : <span style={{ color: 'var(--color-danger)' }}>Missing</span>}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}><Badge variant="danger" title={row.reason}>Skipped</Badge></td>
                    </tr>
                  ))}
                  
                  {acceptedRows.slice(0, 10).map((row, i) => (
                    <tr key={`acc-${i}`} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>{row.rowIndex}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{row.date}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{row.description}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.125rem 0.375rem', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface-alt)', color: 'var(--color-text-primary)' }}>
                          {row.inferredCategoryName || 'Uncategorized'}
                        </span>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)', marginLeft: '0.25rem' }}>
                          ({row.inferredCategoryType || 'expense'})
                        </span>
                      </td>
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
          <ClassificationPreview 
            rows={acceptedRows}
            mapping={mapping}
            categories={categories}
            onRowsChange={(newRows) => {
              setLocalPreview(prev => ({ ...prev, acceptedRows: newRows }));
            }}
          />
        </div>
      </Card>
    </div>
  );
}

function ClassificationPreview({ 
  rows, 
  mapping, 
  categories, 
  onRowsChange 
}: { 
  rows: ParsedRow[]; 
  mapping: ColumnMapping; 
  categories: Category[]; 
  onRowsChange: (rows: ParsedRow[]) => void; 
}) {
  const [overrides, setOverrides] = React.useState<Record<number, FinalType>>({});

  const classifiedRows = React.useMemo(() => {
    return rows.map((row) => {
      const rawDebit = mapping.debitColumn ? row.rawData[mapping.debitColumn] : undefined;
      const rawCredit = mapping.creditColumn ? row.rawData[mapping.creditColumn] : undefined;
      const rawDir = mapping.transactionDirectionColumn ? row.rawData[mapping.transactionDirectionColumn] : undefined;
      const rawCategoryHint = mapping.categoryHintColumn ? row.rawData[mapping.categoryHintColumn] : undefined;

      const cleanMerchantName = row.description ? cleanMerchant(row.description) : undefined;

      let matchedCategoryType: 'expense_only' | 'income_only' | 'mixed' | undefined = undefined;
      if (row.inferredCategoryName) {
        const cat = categories.find(c => c.name.toLowerCase() === row.inferredCategoryName!.toLowerCase());
        if (cat) {
          matchedCategoryType = cat.type;
        }
      }

      const context: ClassificationContext = {
        amount: row.amount ?? undefined,
        debit_amount: rawDebit ? parseFloat(String(rawDebit).replace(/[,$\s]/g, '')) : undefined,
        credit_amount: rawCredit ? parseFloat(String(rawCredit).replace(/[,$\s]/g, '')) : undefined,
        transaction_direction: rawDir ?? undefined,
        merchant_name: cleanMerchantName ?? row.description ?? undefined,
        category_hint: rawCategoryHint ?? undefined,
        user_category_type: matchedCategoryType
      };

      const result = deriveFinalType(context);
      const user_override = overrides[row.rowIndex] ?? row.user_override;
      const finalType = user_override ?? result.final_type;
      const rawAmountForNorm = row.amount ?? context.debit_amount ?? context.credit_amount ?? 0;
      
      return {
        ...row,
        final_type: result.final_type,
        user_override,
        signed_amount: normalizeAmount(rawAmountForNorm, finalType),
        confidence: user_override ? 'high' : result.confidence,
        reason: user_override ? `User manual override to ${user_override}` : result.classification_reason
      };
    });
  }, [rows, mapping, categories, overrides]);

  React.useEffect(() => {
    // Notify parent of updated overrides
    const updatedRows = rows.map(r => ({
      ...r,
      user_override: overrides[r.rowIndex] ?? r.user_override
    }));
    const hasOverrideDiff = rows.some(r => r.user_override !== (overrides[r.rowIndex] ?? r.user_override));
    if (hasOverrideDiff) {
      onRowsChange(updatedRows);
    }
  }, [overrides, rows, onRowsChange]);

  const summary = React.useMemo(() => {
    const effective = classifiedRows.map(r => ({
      ...r,
      final_type: r.user_override ?? r.final_type
    }));

    return {
      expense_count:      effective.filter(r => r.final_type === 'expense').length,
      income_count:       effective.filter(r => r.final_type === 'income').length,
      transfer_count:     effective.filter(r => r.final_type === 'transfer').length,
      refund_count:       effective.filter(r => r.final_type === 'refund').length,
      needs_review_count: effective.filter(r => r.final_type === 'needs_review').length,
      high_confidence:    effective.filter(r => r.confidence === 'high').length,
      medium_confidence:  effective.filter(r => r.confidence === 'medium').length,
      low_confidence:     effective.filter(r => r.confidence === 'low').length,
      total_income:       effective
        .filter(r => r.final_type === 'income' || r.final_type === 'refund')
        .reduce((s, r) => s + Math.abs(r.signed_amount), 0),
      total_expense:      effective
        .filter(r => r.final_type === 'expense')
        .reduce((s, r) => s + Math.abs(r.signed_amount), 0),
    };
  }, [classifiedRows]);

  const netSurplus = summary.total_income - summary.total_expense;

  function handleOverride(rowIndex: number, override: FinalType) {
    setOverrides(prev => ({
      ...prev,
      [rowIndex]: override
    }));
  }

  return (
    <div style={{ marginTop: '2rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
      <h3 style={{ margin: '0 0 1rem 0' }}>Classification Summary</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'var(--color-surface-alt)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '1rem', color: 'var(--color-text-secondary)' }}>Expenses</div>
          <strong style={{ fontSize: '1.25rem', color: 'var(--color-danger)' }}>{summary.expense_count}</strong>
        </div>
        <div style={{ background: 'var(--color-surface-alt)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '1rem', color: 'var(--color-text-secondary)' }}>Income</div>
          <strong style={{ fontSize: '1.25rem', color: 'var(--color-success)' }}>{summary.income_count}</strong>
        </div>
        <div style={{ background: 'var(--color-surface-alt)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '1rem', color: 'var(--color-text-secondary)' }}>Transfers</div>
          <strong style={{ fontSize: '1.25rem' }}>{summary.transfer_count}</strong>
        </div>
        <div style={{ background: 'var(--color-surface-alt)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '1rem', color: 'var(--color-text-secondary)' }}>Refunds</div>
          <strong style={{ fontSize: '1.25rem', color: 'var(--color-success)' }}>{summary.refund_count}</strong>
        </div>
        {summary.needs_review_count > 0 && (
          <div style={{ background: 'var(--color-warning-light)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '1rem', color: 'var(--color-text-secondary)' }}>Needs Review</div>
            <strong style={{ fontSize: '1.25rem', color: 'var(--color-warning)' }}>{summary.needs_review_count}</strong>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
        <span>🟢 High conf: {summary.high_confidence}</span>
        <span>🟡 Med conf: {summary.medium_confidence}</span>
        <span>🚩 Low conf: {summary.low_confidence}</span>
      </div>

      <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', padding: '1rem', background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-md)' }}>
        <div>Total Income: <strong style={{ color: 'var(--color-success)' }}>+{summary.total_income.toFixed(2)}</strong></div>
        <div>Total Expenses: <strong style={{ color: 'var(--color-danger)' }}>-{summary.total_expense.toFixed(2)}</strong></div>
        <div>Net Surplus: <strong style={{ color: netSurplus >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{netSurplus >= 0 ? '+' : ''}{netSurplus.toFixed(2)}</strong></div>
      </div>

      {classifiedRows.some(r => r.confidence !== 'high') && (
        <div style={{ border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <div style={{ background: 'var(--color-warning-light)', padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-warning)' }}>
            <h4 style={{ margin: 0, color: 'var(--color-warning)' }}>⚠️ Review Suggested — {classifiedRows.filter(r => r.confidence !== 'high').length} rows</h4>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--color-surface-alt)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Merchant</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Amount</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Suggested Type</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Confidence</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Override</th>
                </tr>
              </thead>
              <tbody>
                {classifiedRows
                  .filter(r => r.confidence !== 'high')
                  .map((row, i) => (
                    <tr key={i} style={{ borderTop: '1px solid var(--color-border)', background: row.confidence === 'low' ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                      <td style={{ padding: '0.75rem 1rem' }}>{row.date}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{row.description}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{Math.abs(row.signed_amount).toFixed(2)}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ 
                          color: (row.user_override ?? row.final_type) === 'expense' ? 'var(--color-danger)' : 
                                 (row.user_override ?? row.final_type) === 'income' || (row.user_override ?? row.final_type) === 'refund' ? 'var(--color-success)' : 'inherit',
                          fontWeight: 600
                        }}>
                          {row.user_override ?? row.final_type}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>{row.confidence}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <select
                          className="input"
                          style={{ padding: '0.25rem 0.5rem', height: '30px' }}
                          value={row.user_override ?? row.final_type}
                          onChange={e => handleOverride(row.rowIndex, e.target.value as FinalType)}
                        >
                          <option value="expense">Expense</option>
                          <option value="income">Income</option>
                          <option value="transfer">Transfer</option>
                          <option value="refund">Refund</option>
                          <option value="needs_review">Skip (Review Later)</option>
                        </select>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
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
