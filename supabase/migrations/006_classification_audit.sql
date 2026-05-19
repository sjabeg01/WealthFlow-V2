-- ============================================================
-- Migration 006: Add classification audit columns
-- ============================================================

ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS classification_reason text,
ADD COLUMN IF NOT EXISTS confidence text;
