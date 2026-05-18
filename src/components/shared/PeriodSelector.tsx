'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { getPresetRanges } from '@/lib/dateParams';
import { useCallback } from 'react';

export default function PeriodSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const presetRanges = getPresetRanges();

  // Determine current active label if it matches a preset exactly
  let activeLabel = 'Custom';
  for (const preset of presetRanges) {
    if (from === preset.range.from && to === preset.range.to) {
      activeLabel = preset.label;
      break;
    }
  }
  // If no params, default is "All Time" per our dateParams logic
  if (!from && !to) {
    activeLabel = 'All Time';
  }

  const handleSelect = useCallback((presetFrom: string, presetTo: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('from', presetFrom);
    params.set('to', presetTo);
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {presetRanges.map((preset) => (
        <button
          key={preset.label}
          onClick={() => handleSelect(preset.range.from, preset.range.to)}
          style={{
            padding: '0.4rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${activeLabel === preset.label ? 'var(--color-accent)' : 'var(--color-border)'}`,
            background: activeLabel === preset.label ? 'var(--color-accent)' : 'var(--color-surface)',
            color: activeLabel === preset.label ? '#fff' : 'var(--color-text)',
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontWeight: activeLabel === preset.label ? 500 : 400,
          }}
        >
          {preset.label}
        </button>
      ))}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 0.75rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          fontSize: '0.875rem',
          color: 'var(--color-text)',
        }}
      >
        <span style={{ opacity: 0.7 }}>From</span>
        <input 
          type="date" 
          value={from || presetRanges[0].range.from} 
          onChange={(e) => handleSelect(e.target.value, to || presetRanges[0].range.to)}
          style={{ border: 'none', background: 'transparent', outline: 'none', color: 'inherit', fontFamily: 'inherit' }}
        />
        <span style={{ opacity: 0.7 }}>To</span>
        <input 
          type="date" 
          value={to || presetRanges[0].range.to} 
          onChange={(e) => handleSelect(from || presetRanges[0].range.from, e.target.value)}
          style={{ border: 'none', background: 'transparent', outline: 'none', color: 'inherit', fontFamily: 'inherit' }}
        />
      </div>
    </div>
  );
}
