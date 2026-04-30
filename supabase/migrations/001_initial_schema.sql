-- ============================================================
-- WealthFlow v2 — Migration 001: Initial Schema
-- Run this in your Supabase SQL editor or via Supabase CLI.
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------
-- accounts
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.accounts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        text NOT NULL,
  institution text,
  type        text NOT NULL DEFAULT 'checking'
              CHECK (type IN ('checking', 'savings', 'credit', 'investment', 'other')),
  currency    text NOT NULL DEFAULT 'AUD',
  last4       text,
  is_active   boolean NOT NULL DEFAULT true,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------
-- categories
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        text NOT NULL,
  color       text,
  icon        text,
  is_system   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

-- -----------------------------------------------
-- import_batches (audit log header)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.import_batches (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id     uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  file_name      text NOT NULL,
  file_type      text NOT NULL CHECK (file_type IN ('csv', 'xlsx', 'pdf')),
  rows_detected  int NOT NULL DEFAULT 0,
  rows_accepted  int NOT NULL DEFAULT 0,
  rows_skipped   int NOT NULL DEFAULT 0,
  duplicates     int NOT NULL DEFAULT 0,
  transfers      int NOT NULL DEFAULT 0,
  status         text NOT NULL DEFAULT 'preview'
                 CHECK (status IN ('preview', 'committed', 'rolled_back')),
  imported_at    timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------
-- import_rows (audit log rows)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.import_rows (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id    uuid REFERENCES public.import_batches(id) ON DELETE CASCADE NOT NULL,
  row_index   int NOT NULL,
  raw_data    jsonb NOT NULL,
  status      text NOT NULL CHECK (status IN ('accepted', 'skipped', 'duplicate')),
  skip_reason text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------
-- transactions (normalized ledger)
-- Amounts are signed: positive = income, negative = expense
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id       uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  import_batch_id  uuid REFERENCES public.import_batches(id) ON DELETE SET NULL,
  date             date NOT NULL,
  description      text NOT NULL,
  merchant         text,
  amount           numeric(15,2) NOT NULL,  -- SIGNED: + income / - expense
  direction        text NOT NULL CHECK (direction IN ('credit', 'debit')),
  type             text NOT NULL DEFAULT 'expense'
                   CHECK (type IN ('income', 'expense', 'transfer', 'investment', 'refund')),
  category_id      uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  is_transfer      boolean NOT NULL DEFAULT false,
  is_investment    boolean NOT NULL DEFAULT false,
  transfer_pair_id uuid,  -- links both legs of a transfer
  source           text NOT NULL DEFAULT 'import'
                   CHECK (source IN ('import', 'manual')),
  confidence       text NOT NULL DEFAULT 'high'
                   CHECK (confidence IN ('high', 'medium', 'low')),
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------
-- goals (manual-entry only)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.goals (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name                 text NOT NULL,
  target_amount        numeric(15,2) NOT NULL,
  current_amount       numeric(15,2) NOT NULL DEFAULT 0,
  monthly_contribution numeric(15,2) DEFAULT 0,
  deadline             date,
  notes                text,
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------
-- investments (manual holdings only)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.investments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ticker        text,
  name          text NOT NULL,
  units         numeric(15,6),
  avg_cost      numeric(15,4),
  current_price numeric(15,4),
  asset_type    text NOT NULL DEFAULT 'stock'
                CHECK (asset_type IN ('stock', 'etf', 'bond', 'property', 'cash', 'other')),
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------
-- Indexes for common query patterns
-- -----------------------------------------------
CREATE INDEX IF NOT EXISTS transactions_user_date
  ON public.transactions(user_id, date DESC);

CREATE INDEX IF NOT EXISTS transactions_user_category
  ON public.transactions(user_id, category_id);

CREATE INDEX IF NOT EXISTS transactions_import_batch
  ON public.transactions(import_batch_id);

CREATE INDEX IF NOT EXISTS import_batches_user
  ON public.import_batches(user_id, imported_at DESC);
