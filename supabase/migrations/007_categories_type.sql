-- ============================================================
-- Migration 007: Add type to categories
-- ============================================================

ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'mixed'
CHECK (type IN ('expense_only', 'income_only', 'mixed'));
