// ============================================================
// Rakam v2 — Demo Mode
// Static curated dataset. NEVER touches real Supabase tables.
// This is the only source of demo data.
// ============================================================

import type {
  Transaction,
  Account,
  Category,
  Goal,
  Investment,
  AppMode,
} from '@/types';

// -----------------------------------------------
// Mode detection
// -----------------------------------------------

export function isDemoMode(mode: AppMode): boolean {
  return mode === 'demo';
}

// -----------------------------------------------
// Demo accounts
// -----------------------------------------------

export const DEMO_ACCOUNTS: Account[] = [
  {
    id: 'demo-account-1',
    user_id: 'demo-user',
    name: 'Everyday Account',
    institution: 'Commonwealth Bank',
    type: 'checking',
    currency: 'AUD',
    last4: '1234',
    is_active: true,
    notes: 'Main spending account',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'demo-account-2',
    user_id: 'demo-user',
    name: 'Savings Account',
    institution: 'Commonwealth Bank',
    type: 'savings',
    currency: 'AUD',
    last4: '5678',
    is_active: true,
    notes: 'High interest savings',
    created_at: '2024-01-01T00:00:00Z',
  },
];

// -----------------------------------------------
// Demo categories
// -----------------------------------------------

export const DEMO_CATEGORIES: Category[] = [
  { id: 'cat-1', user_id: 'demo-user', name: 'Groceries',       color: '#4CAF50', icon: 'ShoppingCart',   is_system: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'cat-2', user_id: 'demo-user', name: 'Dining Out',      color: '#FF9800', icon: 'Utensils',       is_system: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'cat-3', user_id: 'demo-user', name: 'Transport',       color: '#2196F3', icon: 'Car',            is_system: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'cat-4', user_id: 'demo-user', name: 'Rent / Mortgage', color: '#9C27B0', icon: 'Home',           is_system: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'cat-5', user_id: 'demo-user', name: 'Utilities',       color: '#00BCD4', icon: 'Zap',            is_system: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'cat-6', user_id: 'demo-user', name: 'Health',          color: '#F44336', icon: 'Heart',          is_system: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'cat-7', user_id: 'demo-user', name: 'Subscriptions',   color: '#3F51B5', icon: 'Repeat',         is_system: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'cat-8', user_id: 'demo-user', name: 'Entertainment',   color: '#E91E63', icon: 'Tv',             is_system: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'cat-9', user_id: 'demo-user', name: 'Salary / Income', color: '#4CAF50', icon: 'Banknote',       is_system: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'cat-10',user_id: 'demo-user', name: 'Investments',     color: '#8BC34A', icon: 'TrendingUp',     is_system: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'cat-11',user_id: 'demo-user', name: 'Transfers',       color: '#9E9E9E', icon: 'ArrowLeftRight', is_system: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'cat-12',user_id: 'demo-user', name: 'Uncategorized',   color: '#9E9E9E', icon: 'HelpCircle',     is_system: true, created_at: '2024-01-01T00:00:00Z' },
];

const catMap = Object.fromEntries(DEMO_CATEGORIES.map((c) => [c.id, c]));

// -----------------------------------------------
// Demo transactions (3 months of realistic data)
// -----------------------------------------------

function tx(
  id: string,
  date: string,
  description: string,
  merchant: string,
  amount: number,
  catId: string,
  type: Transaction['type'] = 'expense',
  isTransfer = false
): Transaction {
  return {
    id,
    user_id: 'demo-user',
    account_id: 'demo-account-1',
    import_batch_id: 'demo-batch-1',
    date,
    description,
    merchant,
    amount,
    direction: amount >= 0 ? 'credit' : 'debit',
    type,
    category_id: catId,
    category: catMap[catId],
    is_transfer: isTransfer,
    is_investment: type === 'investment',
    transfer_pair_id: null,
    source: 'import',
    confidence: 'high',
    notes: null,
    created_at: `${date}T00:00:00Z`,
  };
}

export const DEMO_TRANSACTIONS: Transaction[] = [
  // April 2026 — current month
  tx('dt-001', '2026-04-01', 'Salary - Acme Corp', 'Acme Corp', 7200.00, 'cat-9', 'income'),
  tx('dt-002', '2026-04-02', 'Woolworths Sydney CBD', 'Woolworths', -89.40, 'cat-1'),
  tx('dt-003', '2026-04-03', 'Domain Rent Payment', 'Domain', -2400.00, 'cat-4'),
  tx('dt-004', '2026-04-04', 'Netflix Monthly', 'Netflix', -22.99, 'cat-7'),
  tx('dt-005', '2026-04-05', 'Spotify Premium', 'Spotify', -12.99, 'cat-7'),
  tx('dt-006', '2026-04-06', "Uber Eats - Grill'd", "Grill'd", -34.50, 'cat-2'),
  tx('dt-007', '2026-04-07', 'Opal Card Top Up', 'Opal', -50.00, 'cat-3'),
  tx('dt-008', '2026-04-08', 'Coles Surry Hills', 'Coles', -112.30, 'cat-1'),
  tx('dt-009', '2026-04-09', 'CommSec - VAS ETF', 'CommSec', -1000.00, 'cat-10', 'investment'),
  tx('dt-010', '2026-04-10', 'SoulOrigin - Lunch', 'SoulOrigin', -16.50, 'cat-2'),
  tx('dt-011', '2026-04-11', 'AGL Electricity Bill', 'AGL', -148.00, 'cat-5'),
  tx('dt-012', '2026-04-12', 'Optus Mobile Plan', 'Optus', -55.00, 'cat-5'),
  tx('dt-013', '2026-04-14', 'Uber Pool - CBD', 'Uber', -18.30, 'cat-3'),
  tx('dt-014', '2026-04-15', 'IGA Double Bay', 'IGA', -67.80, 'cat-1'),
  tx('dt-015', '2026-04-16', 'Dinner - Nobu Sydney', 'Nobu', -185.00, 'cat-2'),
  tx('dt-016', '2026-04-17', 'Bupa Health Insurance', 'Bupa', -132.00, 'cat-6'),
  tx('dt-017', '2026-04-18', 'Amazon - Book', 'Amazon', -42.99, 'cat-8'),
  tx('dt-018', '2026-04-19', 'Apple One Subscription', 'Apple', -29.95, 'cat-7'),
  tx('dt-019', '2026-04-20', 'Woolworths Paddington', 'Woolworths', -95.20, 'cat-1'),
  tx('dt-020', '2026-04-21', 'Freelance - Web project', 'Client', 1200.00, 'cat-9', 'income'),
  tx('dt-021', '2026-04-22', 'Coffee - Market Lane', 'Market Lane', -8.50, 'cat-2'),
  tx('dt-022', '2026-04-23', 'Transfer to Savings', 'Transfer', -500.00, 'cat-11', 'transfer', true),

  // March 2026
  tx('dt-101', '2026-03-01', 'Salary - Acme Corp', 'Acme Corp', 7200.00, 'cat-9', 'income'),
  tx('dt-102', '2026-03-03', 'Woolworths City', 'Woolworths', -76.40, 'cat-1'),
  tx('dt-103', '2026-03-04', 'Domain Rent Payment', 'Domain', -2400.00, 'cat-4'),
  tx('dt-104', '2026-03-05', 'Netflix Monthly', 'Netflix', -22.99, 'cat-7'),
  tx('dt-105', '2026-03-06', 'Sushi Train - Westfield', 'Sushi Train', -28.50, 'cat-2'),
  tx('dt-106', '2026-03-08', 'Coles Bondi', 'Coles', -143.20, 'cat-1'),
  tx('dt-107', '2026-03-10', 'CommSec - VAS ETF', 'CommSec', -1000.00, 'cat-10', 'investment'),
  tx('dt-108', '2026-03-12', 'Opal Card Top Up', 'Opal', -50.00, 'cat-3'),
  tx('dt-109', '2026-03-14', 'AGL Electricity Bill', 'AGL', -155.20, 'cat-5'),
  tx('dt-110', '2026-03-15', 'GP Consultation', 'Bondi Medical', -85.00, 'cat-6'),
  tx('dt-111', '2026-03-18', 'Dinner - Rockpool', 'Rockpool', -210.00, 'cat-2'),
  tx('dt-112', '2026-03-20', 'Amazon Prime', 'Amazon', -9.99, 'cat-7'),
  tx('dt-113', '2026-03-22', 'Spotify Premium', 'Spotify', -12.99, 'cat-7'),
  tx('dt-114', '2026-03-25', 'Refund - Amazon Return', 'Amazon', 42.99, 'cat-8', 'refund'),
  tx('dt-115', '2026-03-28', 'Transfer to Savings', 'Transfer', -500.00, 'cat-11', 'transfer', true),

  // February 2026
  tx('dt-201', '2026-02-01', 'Salary - Acme Corp', 'Acme Corp', 7200.00, 'cat-9', 'income'),
  tx('dt-202', '2026-02-03', 'Coles Newtown', 'Coles', -98.60, 'cat-1'),
  tx('dt-203', '2026-02-04', 'Domain Rent Payment', 'Domain', -2400.00, 'cat-4'),
  tx('dt-204', '2026-02-05', 'Netflix Monthly', 'Netflix', -22.99, 'cat-7'),
  tx('dt-205', '2026-02-07', 'Optus Mobile Plan', 'Optus', -55.00, 'cat-5'),
  tx('dt-206', '2026-02-10', 'Dinner - Aria', 'Aria', -320.00, 'cat-2'),
  tx('dt-207', '2026-02-12', 'CommSec - NDQ ETF', 'CommSec', -500.00, 'cat-10', 'investment'),
  tx('dt-208', '2026-02-14', 'Flowers - Valentines', 'Interflora', -89.00, 'cat-8'),
  tx('dt-209', '2026-02-18', 'IGA Randwick', 'IGA', -54.30, 'cat-1'),
  tx('dt-210', '2026-02-20', 'Bupa Health Insurance', 'Bupa', -132.00, 'cat-6'),
  tx('dt-211', '2026-02-22', 'Freelance - Design work', 'Client', 800.00, 'cat-9', 'income'),
  tx('dt-212', '2026-02-25', 'AGL Electricity Bill', 'AGL', -161.40, 'cat-5'),
  tx('dt-213', '2026-02-26', 'Transfer to Savings', 'Transfer', -500.00, 'cat-11', 'transfer', true),

];

// -----------------------------------------------
// Demo goals
// -----------------------------------------------

export const DEMO_GOALS: Goal[] = [
  {
    id: 'demo-goal-1',
    user_id: 'demo-user',
    name: 'Emergency Fund',
    target_amount: 20000,
    current_amount: 14500,
    monthly_contribution: 500,
    deadline: '2025-12-31',
    notes: '3 months of expenses',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'demo-goal-2',
    user_id: 'demo-user',
    name: 'Europe Trip',
    target_amount: 8000,
    current_amount: 3200,
    monthly_contribution: 400,
    deadline: '2025-09-01',
    notes: 'Italy, Spain, France — 3 weeks',
    created_at: '2024-06-01T00:00:00Z',
  },
  {
    id: 'demo-goal-3',
    user_id: 'demo-user',
    name: 'Investment Portfolio',
    target_amount: 50000,
    current_amount: 18500,
    monthly_contribution: 1000,
    deadline: '2027-01-01',
    notes: 'ETF-focused long-term portfolio',
    created_at: '2024-01-01T00:00:00Z',
  },
];

// -----------------------------------------------
// Demo investments
// -----------------------------------------------

export const DEMO_INVESTMENTS: Investment[] = [
  {
    id: 'demo-inv-1',
    user_id: 'demo-user',
    ticker: 'VAS',
    name: 'Vanguard Australian Shares ETF',
    units: 85,
    avg_cost: 92.40,
    current_price: 98.70,
    asset_type: 'etf',
    notes: null,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'demo-inv-2',
    user_id: 'demo-user',
    ticker: 'NDQ',
    name: 'Betashares NASDAQ 100 ETF',
    units: 42,
    avg_cost: 38.20,
    current_price: 44.15,
    asset_type: 'etf',
    notes: null,
    created_at: '2024-06-01T00:00:00Z',
  },
  {
    id: 'demo-inv-3',
    user_id: 'demo-user',
    ticker: null,
    name: 'High-Interest Savings',
    units: null,
    avg_cost: null,
    current_price: null,
    asset_type: 'cash',
    notes: 'ING Savings Maximiser — 5.5% p.a.',
    created_at: '2024-01-01T00:00:00Z',
  },
];
