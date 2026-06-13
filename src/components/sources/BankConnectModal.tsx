'use client';

import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Search, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface BankConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BANKS = [
  { id: 'nabil', name: 'Nabil Bank', logo: 'N' },
  { id: 'sbl', name: 'Siddhartha Bank', logo: 'S' },
  { id: 'nibl', name: 'NIMB Bank', logo: 'N' },
  { id: 'hbl', name: 'Himalayan Bank', logo: 'H' },
];

export default function BankConnectModal({ isOpen, onClose }: BankConnectModalProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 300,
      padding: '1rem'
    }}>
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '480px',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        animation: 'modalFadeIn 0.2s ease-out forwards',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '500px'
      }}>
        {/* Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
            {step === 1 ? 'Connect to Rakam' : 
             step === 2 ? 'Select your bank' : 
             step === 3 ? 'Syncing...' : 'Complete'}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
          
          {step === 1 && (
            <div style={{ textAlign: 'center', margin: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 24V8H16.5C18.9853 8 21 10.0147 21 12.5C21 14.9853 18.9853 17 16.5 17H10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15 17L21 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center' }}>⇌</div>
                <div style={{ width: '48px', height: '48px', background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text)' }}>
                  🏦
                </div>
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Rakam uses secure connection</h3>
              <ul style={{ textAlign: 'left', listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <ShieldCheck size={24} color="#10b981" />
                  <div>
                    <div style={{ fontWeight: 600 }}>Your data is encrypted</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>We never sell your data to third parties.</div>
                  </div>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <CheckCircle size={24} color="#3b82f6" />
                  <div>
                    <div style={{ fontWeight: 600 }}>Read-only access</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>We cannot move money.</div>
                  </div>
                </li>
              </ul>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ position: 'relative', marginBottom: '1rem' }}>
                <Search size={18} color="var(--color-text-secondary)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  placeholder="Search for your bank..." 
                  style={{
                    width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem',
                    background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)', color: 'var(--color-text)', outline: 'none'
                  }}
                />
              </div>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {BANKS.map(bank => (
                  <div 
                    key={bank.id}
                    onClick={() => setSelectedBank(bank.id)}
                    style={{
                      padding: '1rem', border: `1px solid ${selectedBank === bank.id ? 'var(--color-accent)' : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem',
                      cursor: 'pointer', background: selectedBank === bank.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                      {bank.logo}
                    </div>
                    <div style={{ fontWeight: 500 }}>{bank.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ textAlign: 'center', margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ 
                background: 'rgba(234, 179, 8, 0.1)', 
                color: '#eab308', 
                width: '64px', height: '64px', 
                borderRadius: '50%', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1.5rem' 
              }}>
                <AlertCircle size={32} />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Beta — Coming Soon</h3>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
                Direct bank connection is currently in closed beta. In the meantime, please use the CSV Upload feature which supports all banks.
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between' }}>
          {step > 1 && step < 3 ? (
            <button 
              onClick={() => setStep(step - 1)}
              style={{
                padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', background: 'transparent',
                border: '1px solid var(--color-border)', color: 'var(--color-text)', cursor: 'pointer', fontWeight: 500
              }}
            >
              Back
            </button>
          ) : <div></div>}

          {step === 1 ? (
            <button 
              onClick={() => setStep(2)}
              style={{
                padding: '0.75rem 2rem', borderRadius: 'var(--radius-md)', background: 'var(--color-accent)',
                border: 'none', color: 'white', cursor: 'pointer', fontWeight: 600
              }}
            >
              Continue
            </button>
          ) : step === 2 ? (
            <button 
              onClick={() => setStep(3)}
              disabled={!selectedBank}
              style={{
                padding: '0.75rem 2rem', borderRadius: 'var(--radius-md)', background: 'var(--color-accent)',
                border: 'none', color: 'white', cursor: selectedBank ? 'pointer' : 'not-allowed', fontWeight: 600,
                opacity: selectedBank ? 1 : 0.5
              }}
            >
              Connect
            </button>
          ) : (
            <button 
              onClick={() => {
                onClose();
                router.push('/import');
              }}
              style={{
                padding: '0.75rem 2rem', borderRadius: 'var(--radius-md)', background: 'var(--color-accent)',
                border: 'none', color: 'white', cursor: 'pointer', fontWeight: 600
              }}
            >
              Use CSV Upload instead
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
