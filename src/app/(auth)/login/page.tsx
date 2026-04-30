'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TrendingUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import styles from '../auth.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError('Supabase is not yet configured. Please add your credentials to .env.local');
    } finally {
      setLoading(false);
    }
  }

  async function handleDemo() {
    setLoading(true);
    try {
      const { enableDemoMode } = await import('@/app/actions');
      await enableDemoMode();
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.authCard}>
      {/* Logo */}
      <div className={styles.authLogo}>
        <div className={styles.authLogoMark}>
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="url(#wf_grad)" />
            <path d="M6 10L10 22L14 10L18 22L22 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 10H27" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M20 16H25" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <defs>
              <linearGradient id="wf_grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="#3B82F6" />
                <stop offset="1" stopColor="#1D4ED8" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span className={styles.authLogoText}>
          <span style={{ color: '#0F172A' }}>Wealth</span>
          <span style={{ color: '#2563EB' }}>Flow</span>
        </span>
      </div>

      <h1 className={styles.authTitle}>Welcome back</h1>
      <p className={styles.authSubtitle}>Sign in to your account to continue</p>

      {error && <div className={styles.authError}>{error}</div>}

      <form className={styles.authForm} onSubmit={handleLogin}>
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
            autoComplete="off"
          />
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          className={styles.authSubmitBtn}
          disabled={loading}
          id="login-submit"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className={styles.authDivider}>
        <div className={styles.authDividerLine} />
        <span className={styles.authDividerText}>or</span>
        <div className={styles.authDividerLine} />
      </div>

      <button
        type="button"
        className={styles.authDemoBtn}
        onClick={handleDemo}
        id="try-demo"
      >
        Try with demo data
      </button>

      <div className={styles.authFooter}>
        Don&apos;t have an account?{' '}
        <Link href="/signup">Create one</Link>
      </div>
    </div>
  );
}
