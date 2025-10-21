-- Fix blogs table - Add missing columns
-- Run this in Supabase SQL Editor

-- Add platform column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'blogs' AND column_name = 'platform'
    ) THEN
        ALTER TABLE blogs ADD COLUMN platform TEXT NOT NULL DEFAULT 'wordpress';
        RAISE NOTICE 'Added platform column';
    ELSE
        RAISE NOTICE 'Platform column already exists';
    END IF;
END $$;

-- Add signin_url column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'blogs' AND column_name = 'signin_url'
    ) THEN
        ALTER TABLE blogs ADD COLUMN signin_url TEXT;
        RAISE NOTICE 'Added signin_url column';
    ELSE
        RAISE NOTICE 'Signin_url column already exists';
    END IF;
END $$;

-- Add username column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'blogs' AND column_name = 'username'
    ) THEN
        ALTER TABLE blogs ADD COLUMN username TEXT;
        RAISE NOTICE 'Added username column';
    ELSE
        RAISE NOTICE 'Username column already exists';
    END IF;
END $$;

-- Add password column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'blogs' AND column_name = 'password'
    ) THEN
        ALTER TABLE blogs ADD COLUMN password TEXT;
        RAISE NOTICE 'Added password column';
    ELSE
        RAISE NOTICE 'Password column already exists';
    END IF;
END $$;

-- Add api_key column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'blogs' AND column_name = 'api_key'
    ) THEN
        ALTER TABLE blogs ADD COLUMN api_key TEXT;
        RAISE NOTICE 'Added api_key column';
    ELSE
        RAISE NOTICE 'Api_key column already exists';
    END IF;
END $$;

-- Add status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'blogs' AND column_name = 'status'
    ) THEN
        ALTER TABLE blogs ADD COLUMN status TEXT DEFAULT 'active';
        RAISE NOTICE 'Added status column';
    ELSE
        RAISE NOTICE 'Status column already exists';
    END IF;
END $$;

-- Verify all columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'blogs'
ORDER BY ordinal_position;

-- Expected columns:
-- id (uuid)
-- user_id (uuid)
-- name (text)
-- platform (text) ✅ FIXED
-- url (text)
-- signin_url (text) ✅ FIXED
-- username (text) ✅ FIXED
-- password (text) ✅ FIXED
-- api_key (text) ✅ FIXED
-- status (text) ✅ FIXED
-- created_at (timestamp)
-- updated_at (timestamp)
