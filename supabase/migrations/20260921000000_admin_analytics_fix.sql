
-- 1. Ensure is_admin function exists
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE profile_id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id uuid REFERENCES public.profiles(id),
    action text NOT NULL,
    table_name text NOT NULL,
    record_id text,
    old_data jsonb,
    new_data jsonb,
    ip_address text,
    user_agent text,
    created_at timestamptz DEFAULT now()
);

-- 3. Analytics Events Table
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id uuid REFERENCES public.profiles(id),
    visitor_id text,
    event_name text NOT NULL,
    event_data jsonb DEFAULT '{}',
    path text,
    referrer text,
    user_agent text,
    ip_address text,
    created_at timestamptz DEFAULT now()
);

-- 4. Admin Users Table (if missing)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id uuid REFERENCES public.profiles(id) UNIQUE,
    designation text,
    permissions jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_event_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_profile_id ON public.analytics_events(profile_id);
CREATE INDEX IF NOT EXISTS idx_analytics_visitor_id ON public.analytics_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.audit_logs(created_at);

-- 6. RLS Policies
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Allow public to insert analytics (page views)
CREATE POLICY "Allow public insert analytics" ON public.analytics_events
    FOR INSERT WITH CHECK (true);

-- Admin only policies
CREATE POLICY "Admin only select analytics" ON public.analytics_events
    FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admin only select audit_logs" ON public.audit_logs
    FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admin only all admin_users" ON public.admin_users
    USING (is_admin(auth.uid()));
