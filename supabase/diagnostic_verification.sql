
-- Diagnostic Verification Script for Tizl
-- Run this in the Supabase SQL Editor to verify the environment

SELECT 
    table_name, 
    (SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.table_name) as column_count
FROM (
    VALUES 
        ('profiles'),
        ('cooks'),
        ('customer_details'),
        ('bookings'),
        ('booking_timeline'),
        ('booking_history'),
        ('services'),
        ('cities'),
        ('addresses'),
        ('payments'),
        ('reviews'),
        ('admin_users'),
        ('audit_logs'),
        ('analytics_events')
) as t(table_name)
LEFT JOIN information_schema.tables ON t.table_name = information_schema.tables.table_name AND table_schema = 'public';

-- Verify is_admin function
SELECT has_function_privilege('public.is_admin(uuid)', 'execute');

-- Verify RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('analytics_events', 'audit_logs', 'admin_users', 'bookings', 'profiles');
