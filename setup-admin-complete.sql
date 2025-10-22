-- Complete Admin Setup Script for ContentFlow
-- This script does EVERYTHING in one go - run this instead of the other two scripts
-- Safe to run multiple times

-- ========================================
-- STEP 1: Add role and subscription columns
-- ========================================

-- Add role column (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles' AND column_name = 'role'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN role TEXT DEFAULT 'paid_user';
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
        ALTER TABLE user_profiles ADD COLUMN subscription_tier TEXT DEFAULT 'starter';
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
        ALTER TABLE user_profiles ADD COLUMN subscription_status TEXT DEFAULT 'active';
        RAISE NOTICE 'Added subscription_status column';
    ELSE
        RAISE NOTICE 'Subscription_status column already exists';
    END IF;
END $$;

-- ========================================
-- STEP 2: Add constraints for valid values
-- ========================================

-- Drop existing constraints if they exist
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS valid_role;
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS valid_subscription_tier;

-- Add new constraints
ALTER TABLE user_profiles
ADD CONSTRAINT valid_role CHECK (role IN ('admin', 'paid_user'));

ALTER TABLE user_profiles
ADD CONSTRAINT valid_subscription_tier CHECK (
    subscription_tier IN ('starter', 'professional', 'enterprise', 'unlimited')
);

-- ========================================
-- STEP 3: Update default credits to 0
-- ========================================
ALTER TABLE user_profiles
ALTER COLUMN credits SET DEFAULT 0;

-- ========================================
-- STEP 4: Update trigger for new users
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
-- STEP 5: Set mahesh.khemlani@gmail.com as ADMIN
-- ========================================

-- Update existing user to admin
UPDATE user_profiles
SET
    role = 'admin',
    subscription_tier = 'unlimited',
    subscription_status = 'active',
    credits = 999999
WHERE email = 'mahesh.khemlani@gmail.com';

-- ========================================
-- STEP 6: Verify the setup
-- ========================================

-- Show the admin user
SELECT
    email,
    role,
    subscription_tier,
    subscription_status,
    credits,
    created_at
FROM user_profiles
WHERE email = 'mahesh.khemlani@gmail.com';

-- ========================================
-- SUCCESS! You should see:
-- ========================================
-- email: mahesh.khemlani@gmail.com
-- role: admin
-- subscription_tier: unlimited
-- subscription_status: active
-- credits: 999999
--
-- Now log out and log back in to www.getseowizard.com
-- Your credits will show 999,999 and you'll have unlimited access!
