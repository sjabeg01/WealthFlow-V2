-- ============================================================
-- Migration 008: Add scoring and correction fields to transactions
-- ============================================================

ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS confidence_score integer,
ADD COLUMN IF NOT EXISTS score_breakdown text,
ADD COLUMN IF NOT EXISTS merchant_clean_name text,
ADD COLUMN IF NOT EXISTS user_corrected boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS user_correction_type text;
