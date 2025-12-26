-- ContentFlow Supabase Database Verification Script
-- Run this in Supabase SQL Editor to verify your setup

-- =====================================================
-- 1. CHECK ALL TABLES EXIST
-- =====================================================
SELECT
    table_name,
    CASE
        WHEN table_name IN ('articles', 'blogs', 'publish_logs', 'website_metrics', 'credit_transactions', 'user_profiles')
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- =====================================================
-- 2. CHECK ROW LEVEL SECURITY (RLS) IS ENABLED
-- =====================================================
SELECT
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('articles', 'blogs', 'publish_logs', 'website_metrics', 'credit_transactions', 'user_profiles');

-- =====================================================
-- 3. CHECK RLS POLICIES EXIST
-- =====================================================
SELECT
    tablename,
    policyname,
    cmd as operation,
    qual as using_clause
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- 4. VERIFY INDEXES EXIST
-- =====================================================
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('articles', 'blogs', 'publish_logs', 'website_metrics', 'credit_transactions')
ORDER BY tablename, indexname;

-- =====================================================
-- 5. CHECK TRIGGERS ARE SET UP
-- =====================================================
SELECT
    trigger_name,
    event_object_table as table_name,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- 6. COUNT RECORDS IN EACH TABLE
-- =====================================================
SELECT
    'articles' as table_name,
    COUNT(*) as record_count
FROM articles
UNION ALL
SELECT 'blogs', COUNT(*) FROM blogs
UNION ALL
SELECT 'publish_logs', COUNT(*) FROM publish_logs
UNION ALL
SELECT 'website_metrics', COUNT(*) FROM website_metrics
UNION ALL
SELECT 'credit_transactions', COUNT(*) FROM credit_transactions
UNION ALL
SELECT 'user_profiles', COUNT(*) FROM user_profiles
ORDER BY table_name;

-- =====================================================
-- 7. CHECK USER PROFILES HAVE DEFAULT CREDITS
-- =====================================================
SELECT
    id,
    email,
    credits,
    created_at
FROM user_profiles
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- 8. VERIFY FOREIGN KEY CONSTRAINTS
-- =====================================================
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- =====================================================
-- EXPECTED RESULTS:
-- =====================================================
-- ✅ All 6 tables should exist
-- ✅ RLS should be enabled on all tables
-- ✅ Multiple RLS policies should exist for each table
-- ✅ Indexes should exist on user_id and created_at columns
-- ✅ Triggers should exist for updated_at and new user handling
-- ✅ User profiles should have default 50000 credits
