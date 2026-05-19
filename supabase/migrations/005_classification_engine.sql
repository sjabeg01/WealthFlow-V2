-- ============================================================
-- Rakam v2 — Migration 005: Classification Engine
-- This migration enforces the strict 3-layer architecture by 
-- adding final_type as the single source of truth for financial meaning.
-- ============================================================

-- 1. Add final_type column
ALTER TABLE public.transactions ADD COLUMN final_type text;

-- 2. Migrate existing data
UPDATE public.transactions
SET final_type = 
  CASE
    WHEN is_transfer = true THEN 'transfer'
    WHEN is_investment = true THEN 'investment'
    WHEN type = 'income' THEN 'income'
    WHEN type = 'refund' THEN 'refund'
    ELSE 'expense'
  END;

-- 3. Make final_type NOT NULL and add constraint
ALTER TABLE public.transactions ALTER COLUMN final_type SET NOT NULL;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_final_type_check 
  CHECK (final_type IN ('income', 'expense', 'transfer', 'investment', 'refund'));

-- 4. Drop old mixed-logic columns
ALTER TABLE public.transactions DROP COLUMN direction;
ALTER TABLE public.transactions DROP COLUMN type;
ALTER TABLE public.transactions DROP COLUMN is_transfer;
ALTER TABLE public.transactions DROP COLUMN is_investment;
