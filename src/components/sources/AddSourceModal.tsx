'use client';

import React, { useState } from 'react';
import { Upload, Landmark, Wallet, X, ChevronRight } from 'lucide-react';
import BankConnectModal from './BankConnectModal';
import { useRouter } from 'next/navigation';

export interface AddSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSourceAdded: (source: any) => void;
  initialView?: 'csv' | 'bank' | null;
}

export default function AddSourceModal({ isOpen, onClose, onSourceAdded, initialView }: AddSourceModalProps) {
  const router = useRouter();
  const [bankModalOpen, setBankModalOpen] = useState(initialView === 'bank');

  if (!isOpen && !bankModalOpen) return null;

  // If initialView was passed and bankModal is open, we hide the main modal
  // and just show the bank modal.

  const handleCsvClick = () => {
    router.push('/import');
    onClose();
  };

  const handleBankClick = () => {
    setBankModalOpen(true);
  };

  return (
    <>
      {isOpen && !bankModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '500px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            animation: 'modalFadeIn 0.2s ease-out forwards'
          }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Add Another Source</h2>
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* CSV Option */}
              <div 
                onClick={handleCsvClick}
                style={{
                  padding: '1.25rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: 'var(--color-surface-alt)'
                }}
                onMouseOver={e => e.currentTarget.style.borderColor = 'var(--color-accent)'}
                onMouseOut={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
              >
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', padding: '0.75rem', borderRadius: '12px' }}>
                  <Upload size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Upload Bank Statement (CSV/Excel)</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Supports all banks & wallets</div>
                </div>
                <ChevronRight size={20} color="var(--color-text-secondary)" />
              </div>

              {/* Bank Option */}
              <div 
                onClick={handleBankClick}
                style={{
                  padding: '1.25rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: 'var(--color-surface-alt)'
                }}
                onMouseOver={e => e.currentTarget.style.borderColor = 'var(--color-accent)'}
                onMouseOut={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
              >
                <div style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#c084fc', padding: '0.75rem', borderRadius: '12px' }}>
                  <Landmark size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Connect Bank (Auto-Sync)</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Nabil, SBL, NIBL, Himalayan...</div>
                </div>
                <ChevronRight size={20} color="var(--color-text-secondary)" />
              </div>

              {/* Wallet Option */}
              <div 
                onClick={() => alert('Coming soon!')}
                style={{
                  padding: '1.25rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: 'var(--color-surface-alt)',
                  opacity: 0.6
                }}
              >
                <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', padding: '0.75rem', borderRadius: '12px' }}>
                  <Wallet size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Connect Wallet</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Coming soon — eSewa, Khalti</div>
                </div>
                <ChevronRight size={20} color="var(--color-text-secondary)" />
              </div>
            </div>

            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)', textAlign: 'right' }}>
              <button 
                onClick={onClose}
                style={{
                  padding: '0.5rem 1.5rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'transparent',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Cancel
              </button>
            </div>
          </div>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes modalFadeIn {
              from { opacity: 0; transform: scale(0.95) translateY(10px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
          `}} />
        </div>
      )}

      {bankModalOpen && (
        <BankConnectModal 
          isOpen={true} 
          onClose={() => {
            setBankModalOpen(false);
            if (initialView) onClose();
          }} 
        />
      )}
    </>
  );
}
