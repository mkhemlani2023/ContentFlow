-- Complete Admin Setup Script for ContentFlow (FIXED)
-- This handles existing users properly
-- Safe to run multiple times

-- ========================================
-- STEP 1: Add columns without constraints
-- ========================================

-- Add role column (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles' AND column_name = 'role'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN role TEXT;
        RAISE NOTICE 'Added role column';
    ELSE
        RAISE NOTICE 'Role column already exists';
    END IF;
END $$;

-- Add subscription_tier column (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles' AND column_name = 'subscription_tier'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN subscription_tier TEXT;
        RAISE NOTICE 'Added subscription_tier column';
    ELSE
        RAISE NOTICE 'Subscription_tier column already exists';
    END IF;
END $$;

-- Add subscription_status column (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles' AND column_name = 'subscription_status'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN subscription_status TEXT;
        RAISE NOTICE 'Added subscription_status column';
    ELSE
        RAISE NOTICE 'Subscription_status column already exists';
    END IF;
END $$;

-- ========================================
-- STEP 2: Update ALL existing rows with valid values
-- ========================================

-- Set default values for any existing users that don't have them
UPDATE user_profiles
SET
    role = COALESCE(role, 'paid_user'),
    subscription_tier = COALESCE(subscription_tier, 'starter'),
    subscription_status = COALESCE(subscription_status, 'active')
WHERE role IS NULL
   OR subscription_tier IS NULL
   OR subscription_status IS NULL;

-- ========================================
-- STEP 3: Set mahesh.khemlani@gmail.com as ADMIN
-- ========================================

UPDATE user_profiles
SET
    role = 'admin',
    subscription_tier = 'unlimited',
    subscription_status = 'active',
    credits = 999999
WHERE email = 'mahesh.khemlani@gmail.com';

-- ========================================
-- STEP 4: Add constraints AFTER fixing data
-- ========================================

-- Drop existing constraints if they exist
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS valid_role;
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS valid_subscription_tier;

-- Add constraints
ALTER TABLE user_profiles
ADD CONSTRAINT valid_role CHECK (role IN ('admin', 'paid_user'));

ALTER TABLE user_profiles
ADD CONSTRAINT valid_subscription_tier CHECK (
    subscription_tier IN ('starter', 'professional', 'enterprise', 'unlimited')
);

-- ========================================
-- STEP 5: Set defaults for future users
-- ========================================

ALTER TABLE user_profiles
ALTER COLUMN role SET DEFAULT 'paid_user';

ALTER TABLE user_profiles
ALTER COLUMN subscription_tier SET DEFAULT 'starter';

ALTER TABLE user_profiles
ALTER COLUMN subscription_status SET DEFAULT 'active';

ALTER TABLE user_profiles
ALTER COLUMN credits SET DEFAULT 0;

-- ========================================
-- STEP 6: Update trigger for new users
-- ========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, credits, role, subscription_tier, subscription_status, created_at)
    VALUES (
        NEW.id,
        NEW.email,
        0,  -- New users start with 0 credits
        'paid_user',  -- Default role
        'starter',  -- Default tier
        'active',  -- Default status
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- STEP 7: Verify the setup
-- ========================================

-- Show all users and their roles
SELECT
    email,
    role,
    subscription_tier,
    subscription_status,
    credits,
    created_at
FROM user_profiles
ORDER BY created_at DESC;

-- ========================================
-- SUCCESS!
-- ========================================
-- You should see mahesh.khemlani@gmail.com with:
-- - role: admin
-- - subscription_tier: unlimited
-- - credits: 999999
--
-- All other users should have:
-- - role: paid_user
-- - subscription_tier: starter
--
-- Now log out and log back in to www.getseowizard.com
