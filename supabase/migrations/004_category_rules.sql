-- ============================================================
-- Rakam v2 — Migration 004: Category Rules
-- Supports user-defined categorization logic
-- ============================================================

CREATE TABLE IF NOT EXISTS public.category_rules (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  match_type  text NOT NULL CHECK (match_type IN ('exact', 'keyword')),
  pattern     text NOT NULL,
  priority    int NOT NULL DEFAULT 0,
  is_enabled  boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Indexes for fast lookup during import
CREATE INDEX IF NOT EXISTS category_rules_user_idx 
  ON public.category_rules(user_id, is_enabled) INCLUDE (match_type, pattern, priority);

-- ============================================================
-- RLS Policies
-- ============================================================
ALTER TABLE public.category_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own category rules"
  ON public.category_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own category rules"
  ON public.category_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own category rules"
  ON public.category_rules FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own category rules"
  ON public.category_rules FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at (optional but good practice)
CREATE OR REPLACE FUNCTION update_category_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_category_rules_modtime
BEFORE UPDATE ON public.category_rules
FOR EACH ROW
EXECUTE FUNCTION update_category_rules_updated_at();
