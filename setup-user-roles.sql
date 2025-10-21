-- Setup User Roles and Profiles System for ContentFlow
-- Run this in Supabase SQL Editor

-- Step 1: Add role and subscription_tier columns to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'paid_user',
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'starter',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';

-- Step 2: Add comment documentation
COMMENT ON COLUMN user_profiles.role IS 'User role: admin (unlimited testing) or paid_user (normal customer)';
COMMENT ON COLUMN user_profiles.subscription_tier IS 'Subscription level: starter, professional, enterprise, or unlimited';
COMMENT ON COLUMN user_profiles.subscription_status IS 'Subscription status: active, cancelled, expired, trial';

-- Step 3: Create enum-like check constraints (optional but recommended)
-- This ensures only valid values are inserted
ALTER TABLE user_profiles
DROP CONSTRAINT IF EXISTS valid_role;

ALTER TABLE user_profiles
ADD CONSTRAINT valid_role CHECK (role IN ('admin', 'paid_user'));

ALTER TABLE user_profiles
DROP CONSTRAINT IF EXISTS valid_subscription_tier;

ALTER TABLE user_profiles
ADD CONSTRAINT valid_subscription_tier CHECK (
    subscription_tier IN ('starter', 'professional', 'enterprise', 'unlimited')
);

-- Step 4: Update the default credits based on the recent change (0 for new users)
ALTER TABLE user_profiles
ALTER COLUMN credits SET DEFAULT 0;

-- Step 5: Update the profile creation trigger to use new defaults
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, credits, role, subscription_tier, subscription_status, created_at)
    VALUES (
        NEW.id,
        NEW.email,
        0,  -- New users start with 0 credits (must purchase)
        'paid_user',  -- Default role
        'starter',  -- Default subscription tier
        'active',  -- Default status
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;  -- Prevent duplicate profile creation
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Set specific user as admin (REPLACE WITH YOUR EMAIL)
-- IMPORTANT: Replace 'your-email@example.com' with your actual login email
-- UPDATE user_profiles
-- SET role = 'admin',
--     subscription_tier = 'unlimited',
--     credits = 999999
-- WHERE email = 'your-email@example.com';

-- Step 7: View current users and their roles
-- SELECT
--     email,
--     role,
--     subscription_tier,
--     credits,
--     created_at
-- FROM user_profiles
-- ORDER BY created_at DESC;

-- ========================================
-- SUBSCRIPTION TIERS EXPLANATION
-- ========================================
-- starter: Basic tier - limited features, pay-per-use credits
-- professional: Mid-tier - better rates, more features
-- enterprise: High-tier - bulk discounts, priority support
-- unlimited: Admin/testing tier - infinite credits, all features

-- ========================================
-- USER ROLES EXPLANATION
-- ========================================
-- paid_user: Normal customer (default)
-- admin: Platform administrator with unlimited access for testing
