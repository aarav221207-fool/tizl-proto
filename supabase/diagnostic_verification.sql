-- ============================================================================
-- TIZL DATABASE DIAGNOSTIC & HEALTH VERIFICATION SCRIPT
-- ============================================================================
-- Run this in Supabase SQL Editor to audit schemas, foreign keys, functions, and RLS.
-- ============================================================================

-- 1. Check Tables Existence
SELECT table_name, (
  SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name
) AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN (
    'profiles', 'cooks', 'customer_details', 'bookings', 'booking_timeline',
    'booking_history', 'booking_cancellations', 'booking_notes', 'addresses',
    'services', 'cities', 'payments', 'reviews', 'admin_users', 'audit_logs',
    'analytics_events'
  )
ORDER BY table_name;

-- 2. Verify Foreign Keys
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema='public'
ORDER BY tc.table_name, kcu.column_name;

-- 3. Verify public.cooks Columns (Ensure no obsolete cook_id, status, is_verified)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'cooks'
ORDER BY ordinal_position;

-- 4. Verify is_admin Function Security Definer and search_path
SELECT 
    p.proname AS function_name,
    pg_get_function_result(p.oid) AS result_type,
    pg_get_function_arguments(p.oid) AS arguments,
    p.prosecdef AS is_security_definer,
    p.proconfig AS function_configuration
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.proname IN ('is_admin', 'handle_new_user', 'prevent_audit_log_tampering', 'prevent_analytics_events_tampering');

-- 5. Check RLS Status on All Critical Tables
SELECT 
    schemaname, 
    tablename, 
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 6. Check Active RLS Policies on Critical Tables
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'cooks', 'bookings', 'admin_users', 'analytics_events', 'reviews', 'payments', 'audit_logs')
ORDER BY tablename, policyname;

-- 7. Count Records Across Major Tables
SELECT 'profiles' AS table_name, count(*) AS total_rows FROM public.profiles
UNION ALL
SELECT 'admin_users', count(*) FROM public.admin_users
UNION ALL
SELECT 'cooks', count(*) FROM public.cooks
UNION ALL
SELECT 'customer_details', count(*) FROM public.customer_details
UNION ALL
SELECT 'bookings', count(*) FROM public.bookings
UNION ALL
SELECT 'reviews', count(*) FROM public.reviews
UNION ALL
SELECT 'payments', count(*) FROM public.payments
UNION ALL
SELECT 'audit_logs', count(*) FROM public.audit_logs
UNION ALL
SELECT 'analytics_events', count(*) FROM public.analytics_events
UNION ALL
SELECT 'services', count(*) FROM public.services
UNION ALL
SELECT 'cities', count(*) FROM public.cities;

-- 8. Check Super Admin count in public.admin_users
SELECT 
    COUNT(*) AS total_admin_users,
    COUNT(*) FILTER (WHERE designation = 'super_admin') AS super_admin_count
FROM public.admin_users;
