-- ============================================================================
-- TIZL UNIFIED DATABASE REPAIR MIGRATION
-- File: supabase/migrations/05_unified_repair.sql
-- ============================================================================
-- Idempotent, safe SQL script to synchronize database schemas, foreign keys,
-- is_admin() function, RLS policies, and profile repair.
-- ============================================================================

-- 1. Ensure is_admin function exists with proper SECURITY DEFINER & search_path
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users WHERE profile_id = user_id
  ) OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 2. Foreign Key Alignment: Ensure fk_bookings_cook references cooks(id)
DO $$
BEGIN
  -- If fk_bookings_cook mistakenly references profiles, drop and recreate referencing cooks(id)
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

-- 3. Profile Auto-Repair for Existing Auth Users with Missing Profiles
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

-- 4. Enable RLS on analytics_events and ensure anonymous + authenticated insert policy
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics_events;
CREATE POLICY "Anyone can insert analytics events"
  ON public.analytics_events
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view analytics events" ON public.analytics_events;
CREATE POLICY "Admins can view analytics events"
  ON public.analytics_events
  FOR SELECT
  USING (public.is_admin(auth.uid()));

-- 5. Ensure Performance Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_cook_id ON public.bookings(cook_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_users_profile_id ON public.admin_users(profile_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
