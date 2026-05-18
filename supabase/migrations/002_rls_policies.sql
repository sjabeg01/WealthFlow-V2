-- ============================================================
-- Rakam v2 — Migration 002: Row-Level Security Policies
-- Run AFTER 001_initial_schema.sql
-- ============================================================

-- -----------------------------------------------
-- Enable RLS on all user-data tables
-- -----------------------------------------------
ALTER TABLE public.accounts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_rows    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments    ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------
-- accounts: users can only see/modify their own
-- -----------------------------------------------
CREATE POLICY "accounts: own rows only"
  ON public.accounts FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- -----------------------------------------------
-- categories: users can only see/modify their own
-- -----------------------------------------------
CREATE POLICY "categories: own rows only"
  ON public.categories FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- -----------------------------------------------
-- import_batches: users can only see/modify their own
-- -----------------------------------------------
CREATE POLICY "import_batches: own rows only"
  ON public.import_batches FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- -----------------------------------------------
-- import_rows: accessible if the parent batch belongs to the user
-- -----------------------------------------------
CREATE POLICY "import_rows: own batches only"
  ON public.import_rows FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.import_batches b
      WHERE b.id = import_rows.batch_id
        AND b.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.import_batches b
      WHERE b.id = import_rows.batch_id
        AND b.user_id = auth.uid()
    )
  );

-- -----------------------------------------------
-- transactions: users can only see/modify their own
-- -----------------------------------------------
CREATE POLICY "transactions: own rows only"
  ON public.transactions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- -----------------------------------------------
-- goals: users can only see/modify their own
-- -----------------------------------------------
CREATE POLICY "goals: own rows only"
  ON public.goals FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- -----------------------------------------------
-- investments: users can only see/modify their own
-- -----------------------------------------------
CREATE POLICY "investments: own rows only"
  ON public.investments FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
