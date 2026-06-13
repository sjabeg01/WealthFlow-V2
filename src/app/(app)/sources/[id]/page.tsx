import { getDataSources, getSyncLogs, updateDataSourceStatus } from '@/lib/dataService';
import { redirect } from 'next/navigation';
import { formatDistanceToNow, format } from 'date-fns';
import { ArrowLeft, RefreshCcw, Trash2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import StatusDot, { StatusColor } from '@/components/ui/StatusDot';

export const metadata = {
  title: 'Data Source Details | Rakam',
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;
type Params = Promise<{ id: string }>;

export default async function SourceDetailPage(props: { params: Params, searchParams: SearchParams }) {
  const params = await props.params;
  const sourceId = params.id;
  
  const sources = await getDataSources();
  const source = sources.find(s => s.id === sourceId);
  
  if (!source) {
    redirect('/');
  }

  const logs = await getSyncLogs(sourceId, 10);

  const getStatusColor = (status: string, syncStatus?: string): StatusColor => {
    if (status === 'disconnected' || status === 'error') return 'red';
    if (status === 'syncing') return 'yellow';
    if (syncStatus === 'failed') return 'red';
    if (syncStatus === 'partial') return 'yellow';
    return 'green';
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px' }}>
      {/* Header */}
      <div>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', textDecoration: 'none', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>{source.label}</h1>
              <StatusDot 
                color={getStatusColor(source.status, source.lastSyncStatus)} 
                animate={source.status === 'syncing'} 
              />
            </div>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
              {source.type === 'csv' ? 'CSV Upload' : 'Bank Connection'} • Added {formatDistanceToNow(new Date(source.createdAt), { addSuffix: true })}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem',
              background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)', color: 'var(--color-text)', cursor: 'pointer', fontWeight: 500
            }}>
              <RefreshCcw size={16} /> Sync Now
            </button>
            <button style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem',
              background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: 'var(--radius-md)', color: '#ef4444', cursor: 'pointer', fontWeight: 500
            }}>
              <Trash2 size={16} /> Disconnect
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Transactions Imported</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{source.transactionCount}</div>
        </div>
        <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Last Sync</div>
          <div style={{ fontSize: '1.125rem', fontWeight: 500 }}>
            {source.lastSyncAt ? formatDistanceToNow(new Date(source.lastSyncAt), { addSuffix: true }) : 'Never'}
          </div>
        </div>
        <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Status</div>
          <div style={{ fontSize: '1.125rem', fontWeight: 500, textTransform: 'capitalize' }}>
            {source.status}
          </div>
        </div>
      </div>

      {/* Error State if any */}
      {source.status === 'error' && source.lastErrorMessage && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <ShieldAlert color="#ef4444" size={24} style={{ flexShrink: 0 }} />
          <div>
            <div style={{ color: '#ef4444', fontWeight: 600, marginBottom: '0.25rem' }}>Sync Error</div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>{source.lastErrorMessage}</div>
          </div>
        </div>
      )}

      {/* Sync Logs Table */}
      <div>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Recent Sync Logs</h3>
        {logs.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', color: 'var(--color-text-secondary)' }}>
            No sync logs available.
          </div>
        ) : (
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--color-surface-alt)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Date</th>
                  <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Status</th>
                  <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Found</th>
                  <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Imported</th>
                  <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                      {format(new Date(log.startedAt), 'MMM d, yyyy h:mm a')}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                        fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.5rem', borderRadius: '999px',
                        background: log.status === 'success' ? 'rgba(34, 197, 94, 0.1)' : log.status === 'failed' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                        color: log.status === 'success' ? '#22c55e' : log.status === 'failed' ? '#ef4444' : '#eab308'
                      }}>
                        {log.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{log.transactionsFound}</td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{log.transactionsImported}</td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                      {(log.durationMs / 1000).toFixed(1)}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
