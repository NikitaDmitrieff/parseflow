-- Demo hit analytics: lightweight tracking of demo endpoint usage
CREATE TABLE IF NOT EXISTS pf_demo_hits (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario    text NOT NULL DEFAULT 'invoice',
  user_agent  text,
  ip_hash     text, -- sha256 of IP for privacy-preserving dedup
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index for time-series queries
CREATE INDEX pf_demo_hits_created_at_idx ON pf_demo_hits (created_at DESC);

-- RLS: allow insert from service role, no user reads
ALTER TABLE pf_demo_hits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON pf_demo_hits FOR ALL TO service_role USING (true) WITH CHECK (true);
