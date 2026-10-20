-- ============================================================================
-- TIZL BACKEND: VISITOR ANALYTICS EVENTS MIGRATION (Phase 2, Step 4)
-- ============================================================================
-- Note: This is an additive migration script for Supabase PostgreSQL.
-- It defines the analytics_events table for tracking visitor and page view events,
-- establishes high-performance indexes, and enforces Row-Level Security (RLS).
-- ============================================================================

CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  event_name text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_profile ON analytics_events(profile_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Insertion policy: Allow anonymous or authenticated clients/visitors to insert analytics events
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON analytics_events;
CREATE POLICY "Anyone can insert analytics events" ON analytics_events
  FOR INSERT WITH CHECK (true);

-- Read policy: Only authorized administrators can read analytics events
DROP POLICY IF EXISTS "Admins can view analytics events" ON analytics_events;
CREATE POLICY "Admins can view analytics events" ON analytics_events
  FOR SELECT USING (is_admin(auth.uid()));

-- Prevent tampering/modification of analytics events (Immutable log)
CREATE OR REPLACE FUNCTION prevent_analytics_events_tampering()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Analytics events are immutable and cannot be updated or deleted.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_analytics_events_tampering ON analytics_events;
CREATE TRIGGER trg_prevent_analytics_events_tampering
BEFORE UPDATE OR DELETE ON analytics_events
FOR EACH ROW EXECUTE FUNCTION prevent_analytics_events_tampering();
