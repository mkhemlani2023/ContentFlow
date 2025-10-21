-- Set Mahesh Khemlani as Admin for Testing
-- Run this in Supabase SQL Editor after running setup-user-roles.sql

-- Step 1: First, run the setup-user-roles.sql if you haven't already
-- (This adds the role, subscription_tier, and subscription_status columns)

-- Step 2: Set Mahesh as admin with unlimited credits
UPDATE user_profiles
SET
    role = 'admin',
    subscription_tier = 'unlimited',
    subscription_status = 'active',
    credits = 999999
WHERE email = 'mahesh.khemlani@gmail.com';

-- Step 3: Verify the update was successful
SELECT
    email,
    role,
    subscription_tier,
    subscription_status,
    credits,
    created_at
FROM user_profiles
WHERE email = 'mahesh.khemlani@gmail.com';

-- Expected Result:
-- email: mahesh.khemlani@gmail.com
-- role: admin
-- subscription_tier: unlimited
-- subscription_status: active
-- credits: 999999

-- ========================================
-- What This Does:
-- ========================================
-- ✅ Sets your account role to 'admin'
-- ✅ Gives you unlimited subscription tier
-- ✅ Sets 999,999 credits (essentially unlimited)
-- ✅ Ensures active subscription status
-- ✅ Bypasses all credit checks in the frontend
--    (The frontend code checks: if (userProfile.role === 'admin'))

-- ========================================
-- After Running This:
-- ========================================
-- 1. Log out of ContentFlow
-- 2. Log back in with mahesh.khemlani@gmail.com
-- 3. Your credit balance will show 999,999
-- 4. All features will work without deducting credits
-- 5. You can test all functionality freely
