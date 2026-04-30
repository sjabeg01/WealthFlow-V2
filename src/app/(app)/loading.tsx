import Card from '@/components/ui/Card';

export default function Loading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ height: '2rem', width: '200px', background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-md)', marginBottom: '0.5rem' }}></div>
          <div style={{ height: '1rem', width: '300px', background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-md)' }}></div>
        </div>
        <div style={{ height: '2.5rem', width: '350px', background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-md)' }}></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} style={{ padding: '1.5rem', height: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ height: '1rem', width: '80px', background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-md)' }}></div>
            <div style={{ height: '2rem', width: '120px', background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-md)' }}></div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {[1, 2].map((i) => (
          <Card key={i} style={{ height: '400px' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ height: '1.5rem', width: '150px', background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-md)' }}></div>
            </div>
            <div style={{ padding: '1.5rem', height: '100%' }}>
              <div style={{ width: '100%', height: 'calc(100% - 3rem)', background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-md)' }}></div>
            </div>
          </Card>
        ))}
      </div>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      `}</style>
    </div>
  );
}
