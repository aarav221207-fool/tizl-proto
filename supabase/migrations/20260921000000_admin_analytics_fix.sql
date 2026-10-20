
-- ============================================================================
-- TIZL FINAL IDEMPOTENT ADMIN, DATABASE & ANALYTICS MIGRATION
-- File: supabase/migrations/20260921000000_admin_analytics_fix.sql
-- ============================================================================
-- Fully idempotent schema migration ensuring all required columns, indexes,
-- is_admin() function, audit_logs, admin_users, and analytics_events tables & RLS policies exist.
-- ============================================================================

-- 1. Ensure core columns on public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'customer';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. Ensure admin_users table exists
CREATE TABLE IF NOT EXISTS public.admin_users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    designation text DEFAULT 'admin',
    permissions jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- 3. Ensure is_admin function exists with robust SECURITY DEFINER, search_path & enum cast safety
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users WHERE profile_id = user_id
  ) OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = user_id AND role::text = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 4. Ensure audit_logs table exists
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    action text NOT NULL,
    table_name text NOT NULL,
    record_id text,
    old_data jsonb,
    new_data jsonb,
    ip_address text,
    user_agent text,
    created_at timestamptz DEFAULT now()
);

-- 5. Ensure analytics_events table exists
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    visitor_id text,
    event_name text NOT NULL,
    event_data jsonb DEFAULT '{}'::jsonb,
    path text,
    referrer text,
    user_agent text,
    ip_address text,
    created_at timestamptz DEFAULT now()
);

-- Crucial: Ensure dedicated columns exist if analytics_events was created previously without them
ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS visitor_id text;
ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS path text;
ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS referrer text;
ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS user_agent text;
ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS ip_address text;
ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS event_data jsonb DEFAULT '{}'::jsonb;

-- 6. Ensure bookings table columns exist
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_number text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending_confirmation';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS hourly_rate numeric DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS subtotal numeric DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS tax_amount numeric DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS platform_fee numeric DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS total_amount numeric DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS otp text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS otp_verified boolean DEFAULT false;

-- 7. Ensure addresses and cooks columns exist
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE public.cooks ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false;
ALTER TABLE public.cooks ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'pending';
ALTER TABLE public.cooks ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 8. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_event_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_profile_id ON public.analytics_events(profile_id);
CREATE INDEX IF NOT EXISTS idx_analytics_visitor_id ON public.analytics_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_cook_id ON public.bookings(cook_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_users_profile_id ON public.admin_users(profile_id);

-- 9. Row Level Security Policies
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Analytics policies: Allow public/guest/user to insert telemetry, admin to view
DROP POLICY IF EXISTS "Allow public insert analytics" ON public.analytics_events;
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics_events;
CREATE POLICY "Allow public insert analytics" ON public.analytics_events
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin only select analytics" ON public.analytics_events;
DROP POLICY IF EXISTS "Admins can view analytics events" ON public.analytics_events;
CREATE POLICY "Admin only select analytics" ON public.analytics_events
    FOR SELECT USING (public.is_admin(auth.uid()));

-- Audit logs policies: Admin only select, system insert
DROP POLICY IF EXISTS "Admin only select audit_logs" ON public.audit_logs;
CREATE POLICY "Admin only select audit_logs" ON public.audit_logs
    FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Service role insert audit_logs" ON public.audit_logs;
CREATE POLICY "Service role insert audit_logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

-- Admin users table policies: Admin only
DROP POLICY IF EXISTS "Admin only all admin_users" ON public.admin_users;
CREATE POLICY "Admin only all admin_users" ON public.admin_users
    FOR ALL USING (public.is_admin(auth.uid()));

-- 10. Foreign Key Alignment: Ensure fk_bookings_cook references cooks(id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc 
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_name = 'fk_bookings_cook' AND ccu.table_name = 'profiles'
  ) THEN
    ALTER TABLE public.bookings DROP CONSTRAINT fk_bookings_cook;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_bookings_cook'
  ) THEN
    ALTER TABLE public.bookings 
      ADD CONSTRAINT fk_bookings_cook FOREIGN KEY (cook_id) REFERENCES public.cooks(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 11. Profile Auto-Repair for Existing Auth Users with Missing Profiles
INSERT INTO public.profiles (id, email, role, full_name, created_at, updated_at)
SELECT 
  u.id,
  COALESCE(u.email, 'user_' || SUBSTRING(u.id::text, 1, 8) || '@tizl.in'),
  COALESCE(u.raw_user_meta_data->>'role', 'customer'),
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  COALESCE(u.created_at, NOW()),
  NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;


