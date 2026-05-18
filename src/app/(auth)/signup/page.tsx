'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TrendingUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import styles from '../auth.module.css';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        },
      });

      if (authError) {
        setError(authError.message);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('Supabase is not yet configured. Please add your credentials to .env.local');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className={styles.authCard}>
        <div className={styles.authLogo}>
          <div className={styles.authLogoMark}>
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="url(#rkm_grad)" />
              <path d="M10 24V8H16.5C18.9853 8 21 10.0147 21 12.5C21 14.9853 18.9853 17 16.5 17H10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 17L21 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="rkm_grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#3B82F6" />
                  <stop offset="1" stopColor="#1D4ED8" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className={styles.authLogoText}>
            <span style={{ color: '#0F172A' }}>Rakam</span>
          </span>
        </div>
        <h1 className={styles.authTitle}>Check your email</h1>
        <p className={styles.authSubtitle}>
          We sent a confirmation link to <strong>{email}</strong>.
          Click it to activate your account.
        </p>
        <div className={styles.authFooter} style={{ marginTop: '2rem' }}>
          <Link href="/login">Back to sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authCard}>
      {/* Logo */}
      <div className={styles.authLogo}>
        <div className={styles.authLogoMark}>
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="url(#rkm_grad)" />
            <path d="M10 24V8H16.5C18.9853 8 21 10.0147 21 12.5C21 14.9853 18.9853 17 16.5 17H10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15 17L21 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <defs>
              <linearGradient id="rkm_grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="#3B82F6" />
                <stop offset="1" stopColor="#1D4ED8" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span className={styles.authLogoText}>
          <span style={{ color: '#0F172A' }}>Rakam</span>
        </span>
      </div>

      <h1 className={styles.authTitle}>Create your account</h1>
      <p className={styles.authSubtitle}>
        Start tracking your finances with confidence
      </p>

      {error && <div className={styles.authError}>{error}</div>}

      <form className={styles.authForm} onSubmit={handleSignup}>
        <div className="input-group">
          <label className="input-label" htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            className="input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="input"
            placeholder="Minimum 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="confirm-password">
            Confirm password
          </label>
          <input
            id="confirm-password"
            type="password"
            className="input"
            placeholder="Repeat your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          className={styles.authSubmitBtn}
          disabled={loading}
          id="signup-submit"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <div className={styles.authFooter}>
        Already have an account?{' '}
        <Link href="/login">Sign in</Link>
      </div>
    </div>
  );
}
