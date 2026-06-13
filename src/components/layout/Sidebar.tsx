'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Upload,
  ArrowUpDown,
  Tag,
  BarChart2,
  Target,
  TrendingUp,
  Settings,
  LogOut,
  Database,
} from 'lucide-react';
import { fetchSources } from '@/app/actions';
import type { DataSource } from '@/types';
import SyncStatusIndicator from '@/components/sources/SyncStatusIndicator';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import styles from '@/app/(app)/app.module.css';

const NAV_ITEMS = [
  { href: '/',             label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/import',       label: 'Import',       icon: Upload },
  { href: '/transactions', label: 'Transactions', icon: ArrowUpDown },
  { href: '/categories',   label: 'Categories',   icon: Tag },
  { href: '/reports',      label: 'Reports',      icon: BarChart2 },
];

const INVEST_NAV_ITEMS = [
  { href: '/goals',        label: 'Goals',        icon: Target },
  { href: '/investments',  label: 'Investments',  icon: TrendingUp },
];

const BOTTOM_NAV_ITEMS = [
  { href: '/sources',      label: 'Data Sources', icon: Database },
  { href: '/settings',     label: 'Settings',     icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [sources, setSources] = useState<DataSource[]>([]);

  useEffect(() => {
    fetchSources().then(setSources).catch(console.error);
  }, []);

  async function handleSignOut() {
    try {
      const { disableDemoMode } = await import('@/app/actions');
      await disableDemoMode();
      
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Supabase may not be configured yet
    }
    // Full window reload to login to clear all in-memory states
    window.location.href = '/login';
  }
  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.sidebarLogo}>
        <div className={styles.sidebarLogoMark}>
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
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
        <span className={styles.sidebarLogoText}>Rakam</span>
      </div>

      {/* Navigation */}
      <nav className={styles.sidebarNav}>
        {/* Finance */}
        <div className={styles.sidebarSection}>
          <span className={styles.sidebarSectionLabel}>Finance</span>
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <Icon size={17} className={styles.navItemIcon} />
              {item.label}
            </Link>
          );
        })}

        {/* Investing */}
        <div className={styles.sidebarSection}>
          <span className={styles.sidebarSectionLabel}>Investing</span>
        </div>
        {INVEST_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <Icon size={17} className={styles.navItemIcon} />
              {item.label}
            </Link>
          );
        })}

        {/* Account */}
        <div className={styles.sidebarSection}>
          <span className={styles.sidebarSectionLabel}>Account</span>
        </div>
        {BOTTOM_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <Icon size={17} className={styles.navItemIcon} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={styles.sidebarFooter} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <SyncStatusIndicator sources={sources} />
        <button className={styles.signOutBtn} onClick={handleSignOut} id="sign-out">
          <LogOut size={17} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
