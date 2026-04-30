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
} from 'lucide-react';
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
  { href: '/settings',     label: 'Settings',     icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

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
        <span className={styles.sidebarLogoText}>WealthFlow</span>
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
      <div className={styles.sidebarFooter}>
        <button className={styles.signOutBtn} onClick={handleSignOut} id="sign-out">
          <LogOut size={17} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
