'use client';

import React, { useState } from 'react';
import { Upload, Landmark, Wallet, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import BankConnectModal from './BankConnectModal';
interface SetupWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

export default function SetupWizard({ onComplete, onSkip }: SetupWizardProps) {
  const router = useRouter();
  const [showBankModal, setShowBankModal] = useState(false);

  const handleCsvClick = () => {
    router.push('/import');
    onComplete(); // Dismiss wizard as they are now onboarding via CSV
  };

  const handleBankClick = () => {
    setShowBankModal(true);
  };

  const handleBankClose = () => {
    setShowBankModal(false);
    onComplete(); // Once they finish the bank modal (or cancel), consider it complete.
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '2rem',
      overflowY: 'auto'
    }}>
      <div style={{
        maxWidth: '1000px',
        width: '100%',
        margin: 'auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '64px', height: '64px', 
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
            marginBottom: '1.5rem'
          }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 24V8H16.5C18.9853 8 21 10.0147 21 12.5C21 14.9853 18.9853 17 16.5 17H10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 17L21 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{ color: 'white', fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>
            Welcome to Rakam
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto' }}>
            Let&apos;s get your finances in one place. Choose how you want to connect your data.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem'
        }}>
          {/* Option 1: CSV */}
          <div 
            onClick={handleCsvClick}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              padding: '2rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative'
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <div style={{
              background: 'rgba(59, 130, 246, 0.2)',
              color: '#60a5fa',
              width: '48px', height: '48px',
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '1.5rem'
            }}>
              <Upload size={24} />
            </div>
            <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
              Upload Bank Statement
            </h3>
            <ul style={{ color: '#94a3b8', listStyle: 'none', padding: 0, margin: '0 0 2rem 0', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ color: '#22c55e' }}>✓</span> Recommended — Works with ALL banks
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ color: '#22c55e' }}>✓</span> Drag & drop — takes 10 seconds
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ color: '#22c55e' }}>✓</span> 12+ bank formats supported
              </li>
            </ul>
            <div style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              color: '#60a5fa', fontWeight: 500, marginTop: 'auto'
            }}>
              Get Started with CSV <ChevronRight size={20} />
            </div>
          </div>

          {/* Option 2: Bank Sync */}
          <div 
            onClick={handleBankClick}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              padding: '2rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative'
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(234, 179, 8, 0.2)', color: '#facc15', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
              Beta
            </div>
            <div style={{
              background: 'rgba(168, 85, 247, 0.2)',
              color: '#c084fc',
              width: '48px', height: '48px',
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '1.5rem'
            }}>
              <Landmark size={24} />
            </div>
            <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
              Connect Bank
            </h3>
            <ul style={{ color: '#94a3b8', listStyle: 'none', padding: 0, margin: '0 0 2rem 0', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ color: '#facc15' }}>⚡</span> Auto-sync Nabil, SBL, NIBL, Himalayan
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ color: '#c084fc' }}>✓</span> We log in & sync transactions daily
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ color: '#c084fc' }}>✓</span> Encrypted & secure
              </li>
            </ul>
            <div style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              color: '#c084fc', fontWeight: 500, marginTop: 'auto'
            }}>
              Connect Bank <ChevronRight size={20} />
            </div>
          </div>

          {/* Option 3: Wallet */}
          <div 
            onClick={() => alert('Thanks for your interest! We will notify you when eSewa & Khalti integrations are ready.')}
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '24px',
              padding: '2rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              opacity: 0.7
            }}
            onMouseOver={e => {
              e.currentTarget.style.opacity = '1';
            }}
            onMouseOut={e => {
              e.currentTarget.style.opacity = '0.7';
            }}
          >
            <div style={{
              background: 'rgba(34, 197, 94, 0.2)',
              color: '#4ade80',
              width: '48px', height: '48px',
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '1.5rem'
            }}>
              <Wallet size={24} />
            </div>
            <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
              Connect Wallet
            </h3>
            <ul style={{ color: '#94a3b8', listStyle: 'none', padding: 0, margin: '0 0 2rem 0', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                Coming soon — eSewa, Khalti, Fonepay
              </li>
            </ul>
            <div style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              color: '#94a3b8', fontWeight: 500, marginTop: 'auto'
            }}>
              Notify Me When Available <ChevronRight size={20} />
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button 
            onClick={onSkip}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '1rem',
              cursor: 'pointer',
              padding: '0.5rem 1rem',
              textDecoration: 'underline'
            }}
          >
            Skip — I&apos;ll explore first
          </button>
        </div>
      </div>

      <BankConnectModal 
        isOpen={showBankModal} 
        onClose={handleBankClose}
      />
    </div>
  );
}
