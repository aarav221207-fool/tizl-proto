-- ============================================================================
-- TIZL AUTHENTICATION: AUTOMATIC PROFILE CREATION TRIGGER & RLS POLICIES
-- ============================================================================
-- Run this in your Supabase SQL Editor to automatically synchronize
-- Supabase Auth (auth.users) with Application Profiles (public.profiles).
-- ============================================================================

-- 1. Function to handle new user registration from Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role public.user_role;
  raw_role text;
BEGIN
  -- Extract role from user_metadata (default to 'customer')
  raw_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'customer'));
  
  -- Strict sanitization: Only allow self-service customer or cook. Never grant admin here.
  IF raw_role = 'cook' THEN
    assigned_role := 'cook'::public.user_role;
  ELSE
    assigned_role := 'customer'::public.user_role;
  END IF;

  -- Insert or update the public.profiles record
  INSERT INTO public.profiles (
    id,
    email,
    phone,
    full_name,
    avatar_url,
    role,
    status,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Row Level Security Policies for public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile (or admins to read any profile)
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.admin_users WHERE profile_id = auth.uid()
    )
  );

-- Allow users to update their own profile (or admins to update any profile)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.admin_users WHERE profile_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.admin_users WHERE profile_id = auth.uid()
    )
  );
