-- ============================================================================
-- TIZL CONSOLIDATED SCHEMA RECONCILIATION MIGRATION
-- File: supabase/migrations/99_final_schema_reconciliation.sql
-- ============================================================================
-- Single, fully idempotent migration that reconciles all database schemas,
-- tables, types, foreign key constraints, RLS policies, triggers, and indexes.
-- Safe to execute repeatedly on any Supabase project.
-- ============================================================================

-- 1. Custom Types and Enums (Safe Creation)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('customer', 'cook', 'admin');
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
    CREATE TYPE public.booking_status AS ENUM (
      'draft', 'pending', 'confirmed', 'cook_assigned', 'in_progress', 'completed', 'cancelled'
    );
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE public.payment_status AS ENUM (
      'pending', 'processing', 'completed', 'failed', 'refunded'
    );
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Core Tables (Ensure Exists)

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  phone text,
  full_name text,
  avatar_url text,
  role public.user_role NOT NULL DEFAULT 'customer',
  status text NOT NULL DEFAULT 'active',
  city text,
  address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Admin Users
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  designation text DEFAULT 'Administrator',
  permissions jsonb NOT NULL DEFAULT '["admin:access"]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Cooks
CREATE TABLE IF NOT EXISTS public.cooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  display_name text,
  bio text,
  specialties text[] DEFAULT ARRAY[]::text[],
  experience_years integer DEFAULT 0,
  hourly_rate numeric(10,2) DEFAULT 349.00,
  rating_avg numeric(3,2) DEFAULT 5.00,
  rating_count integer DEFAULT 0,
  is_available boolean DEFAULT true,
  is_approved boolean DEFAULT false,
  aadhaar_verified boolean DEFAULT false,
  police_verified boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Services
CREATE TABLE IF NOT EXISTS public.services (
  id text PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE,
  description text,
  base_price numeric(10,2) NOT NULL DEFAULT 349.00,
  duration_minutes integer NOT NULL DEFAULT 60,
  is_active boolean NOT NULL DEFAULT true,
  icon text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Operational Cities
CREATE TABLE IF NOT EXISTS public.operational_cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  state text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Customer Addresses
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  postal_code text,
  landmark text,
  is_default boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Bookings
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number text UNIQUE NOT NULL,
  customer_id uuid NOT NULL REFERENCES public.profiles(id),
  cook_id uuid REFERENCES public.cooks(id) ON DELETE SET NULL,
  service_id text NOT NULL,
  booking_date date NOT NULL,
  start_time text NOT NULL,
  duration_hours numeric(3,1) NOT NULL DEFAULT 1.0,
  guest_count integer NOT NULL DEFAULT 2,
  status public.booking_status NOT NULL DEFAULT 'pending',
  cooking_notes text,
  total_amount numeric(10,2) NOT NULL DEFAULT 0.00,
  otp_start text,
  otp_end text,
  service_started_at timestamptz,
  service_completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Payments (Provider-Neutral)
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.profiles(id),
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  status public.payment_status NOT NULL DEFAULT 'pending',
  provider text NOT NULL DEFAULT 'paytm',
  provider_order_id text,
  provider_payment_id text,
  provider_signature text,
  txn_token text,
  bank_txn_id text,
  raw_response jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add any missing columns to payments
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'provider') THEN
    ALTER TABLE public.payments ADD COLUMN provider text NOT NULL DEFAULT 'paytm';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'provider_order_id') THEN
    ALTER TABLE public.payments ADD COLUMN provider_order_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'provider_payment_id') THEN
    ALTER TABLE public.payments ADD COLUMN provider_payment_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'provider_signature') THEN
    ALTER TABLE public.payments ADD COLUMN provider_signature text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'txn_token') THEN
    ALTER TABLE public.payments ADD COLUMN txn_token text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'bank_txn_id') THEN
    ALTER TABLE public.payments ADD COLUMN bank_txn_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'raw_response') THEN
    ALTER TABLE public.payments ADD COLUMN raw_response jsonb;
  END IF;
END $$;

-- Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id text,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Analytics Events
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  visitor_id text,
  event_name text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  path text,
  referrer text,
  user_agent text,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add any missing columns to analytics_events
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analytics_events' AND column_name = 'visitor_id') THEN
    ALTER TABLE public.analytics_events ADD COLUMN visitor_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analytics_events' AND column_name = 'path') THEN
    ALTER TABLE public.analytics_events ADD COLUMN path text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analytics_events' AND column_name = 'referrer') THEN
    ALTER TABLE public.analytics_events ADD COLUMN referrer text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analytics_events' AND column_name = 'user_agent') THEN
    ALTER TABLE public.analytics_events ADD COLUMN user_agent text;
  END IF;
END $$;

-- 3. Functions

-- public.is_admin with strict SECURITY DEFINER & search_path
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  IF user_id IS NULL THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users WHERE profile_id = user_id AND is_active = true
  ) OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Prevent tampering of analytics events
CREATE OR REPLACE FUNCTION public.prevent_analytics_events_tampering()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Analytics events are immutable and cannot be modified or deleted.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_analytics_events_tampering ON public.analytics_events;
CREATE TRIGGER trg_prevent_analytics_events_tampering
BEFORE UPDATE OR DELETE ON public.analytics_events
FOR EACH ROW EXECUTE FUNCTION public.prevent_analytics_events_tampering();

-- Handle new user registration trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role public.user_role;
  raw_role text;
BEGIN
  raw_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'customer'));
  IF raw_role = 'cook' THEN
    assigned_role := 'cook'::public.user_role;
  ELSE
    assigned_role := 'customer'::public.user_role;
  END IF;

  INSERT INTO public.profiles (
    id, email, phone, full_name, avatar_url, role, status, created_at, updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    assigned_role,
    CASE WHEN assigned_role = 'cook' THEN 'pending' ELSE 'active' END,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    phone = COALESCE(public.profiles.phone, EXCLUDED.phone),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- 4. Foreign Key Constraints Reconciliation: fk_bookings_cook -> cooks(id)
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

-- 5. Profile Auto-Repair for Existing Auth Users with Missing Profiles
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    INSERT INTO public.profiles (id, email, role, full_name, created_at, updated_at)
    SELECT 
      u.id,
      COALESCE(u.email, 'user_' || SUBSTRING(u.id::text, 1, 8) || '@tizl.in'),
      COALESCE((u.raw_user_meta_data->>'role')::public.user_role, 'customer'::public.user_role),
      COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
      COALESCE(u.created_at, NOW()),
      NOW()
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    WHERE p.id IS NULL
    ON CONFLICT (id) DO NOTHING;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL; -- Gracefully ignore if auth.users is inaccessible during local build
END $$;

-- 6. Row Level Security Policies

-- Profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = id OR public.is_admin(auth.uid()));

-- Admin Users RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin only all admin_users" ON public.admin_users;
CREATE POLICY "Admin only all admin_users" ON public.admin_users
  FOR ALL USING (public.is_admin(auth.uid()));

-- Cooks RLS
ALTER TABLE public.cooks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view approved cooks" ON public.cooks;
CREATE POLICY "Anyone can view approved cooks" ON public.cooks
  FOR SELECT USING (is_approved = true OR auth.uid() = profile_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Cooks can update own details" ON public.cooks;
CREATE POLICY "Cooks can update own details" ON public.cooks
  FOR UPDATE USING (auth.uid() = profile_id OR public.is_admin(auth.uid()));

-- Bookings RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Customers can view own bookings" ON public.bookings;
CREATE POLICY "Customers can view own bookings" ON public.bookings
  FOR SELECT USING (customer_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Customers can create bookings" ON public.bookings;
CREATE POLICY "Customers can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (customer_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins and cooks can update bookings" ON public.bookings;
CREATE POLICY "Admins and cooks can update bookings" ON public.bookings
  FOR UPDATE USING (
    customer_id = auth.uid() OR 
    cook_id IN (SELECT id FROM public.cooks WHERE profile_id = auth.uid()) OR 
    public.is_admin(auth.uid())
  );

-- Payments RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Customers can view own payments" ON public.payments;
CREATE POLICY "Customers can view own payments" ON public.payments
  FOR SELECT USING (customer_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Service role and admins manage payments" ON public.payments;
CREATE POLICY "Service role and admins manage payments" ON public.payments
  FOR ALL USING (auth.role() = 'service_role' OR public.is_admin(auth.uid()));

-- Analytics Events RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics_events;
CREATE POLICY "Anyone can insert analytics events" ON public.analytics_events
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view analytics events" ON public.analytics_events;
CREATE POLICY "Admins can view analytics events" ON public.analytics_events
  FOR SELECT USING (public.is_admin(auth.uid()));

-- Audit Logs RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (public.is_admin(auth.uid()));

-- 7. High-Performance Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_cook_id ON public.bookings(cook_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON public.payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_order_id ON public.payments(provider_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_profile ON public.analytics_events(profile_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cooks_profile_id ON public.cooks(profile_id);
CREATE INDEX IF NOT EXISTS idx_cooks_is_approved ON public.cooks(is_approved);
