-- 1. data_sources table
CREATE TABLE IF NOT EXISTS data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('csv', 'bank', 'api', 'manual')),
  label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'syncing', 'error', 'disconnected')),
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT CHECK (last_sync_status IN ('success', 'failed', 'partial')),
  last_error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  credentials_encrypted TEXT,
  transaction_count INTEGER DEFAULT 0,
  date_range_from DATE,
  date_range_to DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. sync_logs table
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed', 'partial')),
  transactions_found INTEGER DEFAULT 0,
  transactions_imported INTEGER DEFAULT 0,
  transactions_skipped INTEGER DEFAULT 0,
  error_message TEXT,
  error_details JSONB,
  duration_ms INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 3. Add source_id to transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS source_id UUID REFERENCES data_sources(id) ON DELETE SET NULL;

-- RLS policies
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their sources" ON data_sources FOR ALL USING (auth.uid() = user_id);

ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see their sync logs" ON sync_logs FOR ALL USING (
  source_id IN (SELECT id FROM data_sources WHERE user_id = auth.uid())
);
